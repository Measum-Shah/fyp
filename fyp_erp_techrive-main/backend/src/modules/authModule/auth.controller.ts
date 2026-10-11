import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { getRequestContext } from "../hrandPayrollModule/utils/request-context.util";
import * as sessionService from "../hrandPayrollModule/services/session.service";
import { LOGOUT_REASON } from "../hrandPayrollModule/constants/sessionLog.constants";

const JWT_SECRET =
  process.env.JWT_SECRET || "fyp_erp_super_secret_jwt_key_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Safe fields — never expose password or tokens
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role_id: true,
  branch_id: true,
  user_type: true,
  active: true,
  status: true,
  created_at: true,
  updated_at: true,
};

// ─── Login ─────────────────────────────────────────────────────────────────────
export const login = async (req: Request, res: Response) => {
  // Captured once up front — reused for both the success and every failure
  // path below so a failed attempt is logged with the same IP/browser/OS
  // detail as a successful one.
  const context = getRequestContext(req);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email in the `erp_users` table
    const user = await prisma.erpUsers.findFirst({ where: { email } });

    if (!user) {
      // No matching account at all — still recorded (user_id stays null)
      // so failed attempts against unknown/mistyped emails show up on the
      // Sessions & Activity monitoring page, e.g. for spotting credential
      // stuffing against emails that were never valid in the first place.
      await sessionService.recordFailedLogin({
        userId: null,
        attemptedEmail: email,
        reason: "Invalid email or password",
        context,
      });
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Try bcrypt comparison first (hashed password)
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch {
      // password may not be a valid bcrypt hash — fall through
    }

    // Fallback: check against string_password (plaintext stored in DB)
    if (!isMatch && user.string_password) {
      isMatch = password === user.string_password;
    }

    // Final fallback: direct comparison with password field (for legacy plain-text)
    if (!isMatch) {
      isMatch = password === user.password;
    }

    if (!isMatch) {
      await sessionService.recordFailedLogin({
        userId: user.id,
        attemptedEmail: email,
        reason: "Invalid email or password",
        context,
      });
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ─── Account active check ──────────────────────────────────────────
    // Added alongside the new User Account Management screens (see
    // user.service.ts's "Deactivate" action / erp_users.active). Checked
    // AFTER the password match (not right after finding the user) so a
    // deactivated account doesn't leak "this email exists" to someone
    // who doesn't already know the password. Previously `active` was
    // selected/returned everywhere but never actually enforced here —
    // deactivating a user had no real effect before this change.
    if (user.active !== 1) {
      await sessionService.recordFailedLogin({
        userId: user.id,
        attemptedEmail: email,
        reason: "Account is deactivated",
        context,
      });
      return res.status(403).json({ message: "Your account has been deactivated. Contact your administrator." });
    }

    // Start the session row first so its session_token can be embedded in
    // the JWT as `sid` — this is what lets auth.middleware.ts later verify
    // "is this specific login still active" and what Force Logout revokes.
    const { sessionToken } = await sessionService.startSession({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      roleId: user.role_id,
      branchId: user.branch_id,
      context,
    });

    // Sign JWT with user info
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role_id: user.role_id,
        user_type: user.user_type,
        branch_id: user.branch_id,
        sid: sessionToken,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    // Update last login timestamp
    await prisma.erpUsers.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date().toISOString(),
        last_login_ip: context.ipAddress ?? undefined,
        updated_at: new Date(),
      },
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role_id: user.role_id,
        branch_id: user.branch_id,
        user_type: user.user_type,
        active: user.active,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Register ──────────────────────────────────────────────────────────────────
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    // Check duplicate email
    const existing = await prisma.erpUsers.findFirst({ where: { email } });
    if (existing) {
      return res
        .status(409)
        .json({ message: "A user with this email already exists" });
    }

    // Hash password with bcrypt (cost factor 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert into `erp_users` table
    const user = await prisma.erpUsers.create({
      data: {
        name,
        email,
        password: hashedPassword,
        string_password: password,
        active: 1,
        status: 1,
        user_type: "staff",
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: safeUserSelect,
    });

    // Registration auto-logs the new user in (a token is returned below),
    // so it opens a session row the same way login() does — otherwise a
    // register→immediately-use-the-app flow would be invisible on the
    // Sessions monitoring page and its token would carry no `sid`, which
    // would in turn make auth.middleware.ts skip the active-session check
    // for that user until their next real login.
    const context = getRequestContext(req);
    const { sessionToken } = await sessionService.startSession({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      roleId: user.role_id,
      branchId: user.branch_id,
      context,
    });

    // Sign JWT
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role_id: user.role_id,
        user_type: user.user_type,
        branch_id: user.branch_id,
        sid: sessionToken,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Logout (protected) ─────────────────────────────────────────────────────
// New endpoint — the project previously had no server-side logout at all
// (the frontend just cleared localStorage). Needed so:
//   1. logout_time / session_duration_seconds / logout_reason get recorded
//      (none of that is knowable without the server being told logout
//      happened), and
//   2. the session is marked is_active=0 so auth.middleware.ts's
//      isSessionActive() check immediately rejects the old token if it's
//      ever reused, instead of relying solely on JWT expiry (7d default).
export const logout = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.sid) {
      // Token was issued before this change and carries no session — there
      // is nothing to close server-side; treat as a no-op success so the
      // frontend can still clear its local token either way.
      return res.status(200).json({ message: "Logged out successfully" });
    }

    await sessionService.endSessionByToken(req.user.sid, LOGOUT_REASON.MANUAL);

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Get Current Logged-in User (protected) ────────────────────────────────────
export const getMe = async (
  req: Request & { user?: any },
  res: Response
) => {
  try {
    const user = await prisma.erpUsers.findUnique({
      where: { id: req.user?.id },
      select: safeUserSelect,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("GetMe error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─── Seed Admin User ───────────────────────────────────────────────────────────
export const seedAdmin = async (_req: Request, res: Response) => {
  try {
    const adminEmail = "admin@techrive.com";
    const adminPassword = "admin123";

    // Check if admin already exists
    const existing = await prisma.erpUsers.findFirst({
      where: { email: adminEmail },
    });

    if (existing) {
      return res.status(200).json({
        message: "Admin user already exists",
        credentials: {
          email: adminEmail,
          password: adminPassword,
        },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const admin = await prisma.erpUsers.create({
      data: {
        name: "System Administrator",
        email: adminEmail,
        password: hashedPassword,
        string_password: adminPassword,
        role_id: 1,
        branch_id: 1,
        user_type: "admin",
        active: 1,
        status: 1,
        board_id_one: 0,
        board_id_two: 0,
        program_id_one: 0,
        program_id_two: 0,
        created_at: new Date(),
        updated_at: new Date(),
      },
      select: safeUserSelect,
    });

    return res.status(201).json({
      message: "Admin user created successfully",
      credentials: {
        email: adminEmail,
        password: adminPassword,
      },
      user: admin,
    });
  } catch (error) {
    console.error("Seed admin error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

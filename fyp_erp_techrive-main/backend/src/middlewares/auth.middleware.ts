import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
// This is the one place a shared (module-agnostic) middleware reaches into
// a specific module's service layer. session.service.ts doesn't import
// anything from this file (or from authModule), so there's no circular
// dependency — but flagging the direction explicitly since every other
// cross-module wiring in this codebase happens the other way (a module
// importing FROM shared middlewares, e.g. validate.middleware.ts's own
// comment on this same pattern). It's done here because "is this JWT's
// session still active" is inherently an auth-layer concern, even though
// the session data it checks lives in the HR & Payroll module's schema.
import { isSessionActive, touchSessionActivity } from "../modules/hrandPayrollModule/services/session.service";

// Must match the fallback in modules/authModule/auth.controller.ts exactly —
// that's the file that SIGNS the token. If these two fallbacks ever drift,
// every login still "succeeds" (token issued fine) but every subsequent
// authenticated request fails with 401 "Invalid token" as soon as
// JWT_SECRET is unset in the environment, since verify() would be checking
// the signature against a different secret than sign() used. Both files
// still read JWT_SECRET from the environment first, so this only matters
// when that env var is missing.
const JWT_SECRET = process.env.JWT_SECRET || "fyp_erp_super_secret_jwt_key_2026";

// Mirrors the actual payload auth.controller.ts's login()/register() sign
// into the token (id, name, email, role_id, user_type, branch_id) — there
// is no `role` claim, only `role_id`. The previous `role: string` field
// here didn't match anything ever put into the token, which both made the
// `as` cast below type-incorrect (a real tsc error) and meant
// `req.user.role` would silently have been `undefined` for any code that
// ever read it.
export interface AuthRequest extends Request {
  user?: {
    id: number;
    name?: string;
    email: string;
    role_id?: number;
    user_type?: string;
    branch_id?: number;
    // Links this login to its own HR record in `staff` — added for
    // record-level self-scoping (see utils/record-scope.util.ts). Optional
    // because most existing accounts (and any token issued before this
    // change) simply won't have one; treated as "no linked employee" (see
    // resolveRecordScope's fallback) rather than an error.
    employee_id?: number | null;
    // `sid` (session id) — added for the User Session & Activity Logging
    // module. Tokens issued by the current auth.controller.ts always carry
    // it now, but it's optional here so any already-issued token (signed
    // before this change) still verifies fine; see the "if (decoded.sid)"
    // guard below for why a missing sid doesn't fail the request.
    sid?: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token as string, JWT_SECRET as string) as unknown as {
      id: number;
      name?: string;
      email: string;
      role_id?: number;
      user_type?: string;
      branch_id?: number;
      employee_id?: number | null;
      sid?: string;
    };

    // ─── Session & Activity Logging integration ───────────────────────
    // Only tokens signed AFTER this change carry a `sid`. When one is
    // present we treat erp_user_sessions as the source of truth for
    // whether this specific login is still allowed to make requests —
    // this is what makes "Force Logout" (session.controller.ts) and
    // "Logout Reason: Session Expired" actually take effect, rather than
    // just being a label in a report that a still-valid JWT ignores.
    //
    // Performance trade-off, stated plainly: this adds one extra indexed
    // lookup (on erp_user_sessions.session_token, which is UNIQUE) to
    // every authenticated request. That's a deliberate choice — without
    // it, force-logout can't actually revoke a live JWT before it
    // naturally expires. If this ever shows up as a hot path in
    // profiling, the fix is to cache active session_tokens (e.g. in
    // Redis) rather than removing the check. A DB error here fails OPEN
    // (falls through to `next()`) so a transient DB hiccup degrades to
    // "old behavior" instead of locking every user out.
    if (decoded.sid) {
      try {
        const active = await isSessionActive(decoded.sid);
        if (!active) {
          return res.status(401).json({ message: "Unauthorized: Session has ended" });
        }
        // Throttled, fire-and-forget — see touchSessionActivity()'s own
        // comment for why this never awaits/blocks the request.
        touchSessionActivity(decoded.sid);
      } catch (error) {
        console.error("Session active-check failed, allowing request through:", error);
      }
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

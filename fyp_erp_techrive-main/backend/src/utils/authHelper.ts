import { AuthRequest } from "../middlewares/auth.middleware";

// ─── Shared auth helper ───────────────────────────────────────────────────
// Small, module-agnostic accessors for the decoded JWT payload that
// authMiddleware attaches to req.user (see middlewares/auth.middleware.ts's
// AuthRequest interface for the full shape: id, email, role_id, user_type,
// branch_id, employee_id, sid).
//
// Error convention deliberately matches the rest of this codebase (e.g.
// AcademicModule's lms.controller.ts): plain `Error` with an "Unauthorized"
// substring in the message, which existing catch blocks already check for
// via `error.message.includes("Unauthorized")` to return 403. No custom
// error class is introduced here to avoid a cross-module dependency on
// hrandPayrollModule's AppError.
// ────────────────────────────────────────────────────────────────────────

/** Returns the decoded auth payload, or undefined if the request has none
 * (e.g. an endpoint mounted without authMiddleware). Non-throwing — use
 * this when the caller wants to branch on "logged in or not" itself. */
export const getAuthUser = (req: AuthRequest) => req.user;

/** Returns the decoded auth payload, or throws if missing. Use this at the
 * top of any controller/service that requires a logged-in user to proceed
 * — matches the "Unauthorized" substring convention other controllers in
 * this codebase already catch. */
export const requireAuthUser = (req: AuthRequest) => {
  if (!req.user) {
    throw new Error("Unauthorized: No authenticated user on this request");
  }
  return req.user;
};

/** Shortcut for the logged-in user's numeric id (erp_users.id). Throws if
 * there's no authenticated user. */
export const requireAuthUserId = (req: AuthRequest): number => {
  return requireAuthUser(req).id;
};

/** Shortcut for the employee_id linked to this login (the erp_users -> staff
 * link — see record-scope.util.ts for the equivalent pattern already used
 * in hrandPayrollModule). Returns null/undefined rather than throwing if
 * the account has no linked employee record, since "logged in but not
 * linked to a staff row" is a valid state, not necessarily an error. */
export const getAuthEmployeeId = (req: AuthRequest): number | null | undefined => {
  return req.user?.employee_id;
};

/** Same as getAuthEmployeeId, but throws if there's no employee_id linked —
 * use this in endpoints (like a teacher dashboard) that only make sense for
 * a login tied to an actual staff/employee record. */
export const requireAuthEmployeeId = (req: AuthRequest): number => {
  const user = requireAuthUser(req);
  if (user.employee_id == null) {
    throw new Error("Unauthorized: This account is not linked to an employee record");
  }
  return user.employee_id;
};
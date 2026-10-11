// ─── Activity Log Module Constants ──────────────────────────────────────────
// erp_activity_logs table — see database-migrations/2026_08_07_add_session_activity_logging.sql

// Module labels — kept as free-standing string constants (not a DB-backed
// lookup table) since this mirrors how the rest of the app already uses
// plain strings for module-ish groupings (e.g. staff.staff_type).
export const ACTIVITY_MODULE = {
  AUTH: "Auth",
  EMPLOYEE: "Employee",
  BRANCH: "Branch",
  LEAVE: "Leave",
  LOAN: "Loan",
  ATTENDANCE: "Attendance",
  PAYROLL: "Payroll",
  ROLE: "Role",
  USER: "User",
} as const;

export type ActivityModule = (typeof ACTIVITY_MODULE)[keyof typeof ACTIVITY_MODULE];

// Action labels actually wired up in this delivery. Free-text VARCHAR at
// the DB level (same reasoning as ACTIVITY_MODULE) so new actions can be
// added by any future controller without a migration.
export const ACTIVITY_ACTION = {
  CREATED: "created",
  UPDATED: "updated",
  DELETED: "deleted",
  STATUS_CHANGED: "status_changed",
  SYNCHRONIZED: "synchronized",
  GENERATED: "generated",
  LOGIN_SUCCESS: "login_success",
  LOGIN_FAILED: "login_failed",
  LOGOUT: "logout",
} as const;

export type ActivityAction = (typeof ACTIVITY_ACTION)[keyof typeof ACTIVITY_ACTION];

// ─── Session Log Module Constants ───────────────────────────────────────────
// erp_user_sessions table — see database-migrations/2026_08_07_add_session_activity_logging.sql
// for the full column reference and why this is a new table rather than a
// reuse of login_detail/login_details/sessions/active_sessions/in_out_logs.

export const LOGIN_STATUS = {
  SUCCESS: "success",
  FAILED: "failed",
} as const;

export type LoginStatus = (typeof LOGIN_STATUS)[keyof typeof LOGIN_STATUS];

export const LOGOUT_REASON = {
  MANUAL: "manual",
  EXPIRED: "expired",
  FORCED: "forced",
} as const;

export type LogoutReason = (typeof LOGOUT_REASON)[keyof typeof LOGOUT_REASON];

// Session is considered active (is_active) until logout/expiry/force-logout.
export const SESSION_ACTIVE = 1;
export const SESSION_INACTIVE = 0;

// Throttle window for last_activity_at writes — see session.service.ts's
// touchSessionActivity(). Avoids a DB write on every single authenticated
// request; at most one write per session per this interval.
export const ACTIVITY_TOUCH_INTERVAL_MS = 60_000;

// A session with no activity for longer than this is treated as stale/
// "expired" by the sweep in session.service.ts's listSessions() isActive
// resolution (display-only — does not itself close the DB row).
export const SESSION_IDLE_TIMEOUT_MS = 30 * 60_000; // 30 minutes

// ─── Activity Log — Frontend Constants ──────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/constants/activityLog.constants.ts
// value-for-value, so the module filter dropdown and action badge coloring
// on ActivityLogsPage.tsx always match what the server actually writes.

export const ACTIVITY_MODULE = {
  AUTH: "Auth",
  EMPLOYEE: "Employee",
  BRANCH: "Branch",
  LEAVE: "Leave",
  LOAN: "Loan",
  ATTENDANCE: "Attendance",
  PAYROLL: "Payroll",
} as const;

export type ActivityModule = (typeof ACTIVITY_MODULE)[keyof typeof ACTIVITY_MODULE];

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

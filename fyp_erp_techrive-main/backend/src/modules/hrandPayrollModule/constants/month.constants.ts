// ─── Months — Backend Constants ─────────────────────────────────────────────
// Attendance module, Phase 4a: months — a real, empty lookup table (title +
// status, no seed data in the SQL export) that attendance_summary.month_id
// conceptually references. Same "user-managed lookup, not a hardcoded enum"
// reasoning as erp_attendance_statuses.

export const MONTH_TITLE_MAX_LENGTH = 10;

export const MONTH_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

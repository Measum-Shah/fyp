// ─── Attendance Status — Backend Constants ──────────────────────────────────
// Attendance module, Phase 3a: erp_attendance_statuses — a real lookup table
// (title + display_class) that employee_attendance.status conceptually
// references. There's no DB-level FK (this schema has none anywhere), but
// this table exists specifically to hold the set of valid attendance
// statuses (e.g. "Present", "Absent", "Half Day", "Leave", "Late") an org
// can define for itself, rather than a hardcoded enum — confirmed against
// the raw SQL export, which defines this table with no seed rows, meaning
// it's meant to be populated by the user, not fixed by this codebase.

export const ATTENDANCE_STATUS_TITLE_MAX_LENGTH = 25;
export const ATTENDANCE_STATUS_DISPLAY_CLASS_MAX_LENGTH = 15;

export const ATTENDANCE_STATUS_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

// counts_as_absent (2026-08-22, fixes audit finding #3): same reasoning as
// leaveStatus.constants.ts's LEAVE_STATUS_APPROVAL_FLAG — this table is
// free-text/admin-named, so payrollRun.service.ts's computeLeaveDeduction()
// can't infer "Absent" from a name. HR flags the row(s) that should count
// as an unpaid/deductible day via this field. Defaults to 0/off.
export const ATTENDANCE_STATUS_ABSENCE_FLAG = {
  COUNTS_AS_ABSENT: 1,
  DOES_NOT_COUNT: 0,
} as const;

// display_class is a free-text VARCHAR(15) with no enum in the schema —
// this codebase constrains it to a small set of badge-style class names so
// the Attendance list page can render a consistent colored badge per status,
// without depending on whatever string the user happens to type.
export const DISPLAY_CLASS_OPTIONS = [
  "success",
  "danger",
  "warning",
  "info",
  "neutral",
] as const;
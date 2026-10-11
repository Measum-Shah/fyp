// ─── Attendance Status — Frontend Constants ─────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/constants/attendanceStatus.constants.ts

export const ATTENDANCE_STATUS_TITLE_MAX_LENGTH = 25;

export const ATTENDANCE_STATUS_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

export const DISPLAY_CLASS_OPTIONS = [
  "success",
  "danger",
  "warning",
  "info",
  "neutral",
] as const;

export type DisplayClass = (typeof DISPLAY_CLASS_OPTIONS)[number];

export const DISPLAY_CLASS_LABELS: Record<DisplayClass, string> = {
  success: "Green (e.g. Present)",
  danger: "Red (e.g. Absent)",
  warning: "Yellow (e.g. Half Day / Late)",
  info: "Blue (e.g. Leave)",
  neutral: "Gray (e.g. Not Marked)",
};

// counts_as_absent (2026-08-22, fixes audit finding #3): mirrors backend
// ATTENDANCE_STATUS_ABSENCE_FLAG. Since this table is free-text/admin-named,
// this flag is how HR tells the automated Payroll Run which status row(s)
// mean "Absent" — those days become unpaid/deductible, same as an Unpaid
// leave-type day.
export const ATTENDANCE_STATUS_ABSENCE_FLAG = {
  COUNTS_AS_ABSENT: 1,
  DOES_NOT_COUNT: 0,
} as const;
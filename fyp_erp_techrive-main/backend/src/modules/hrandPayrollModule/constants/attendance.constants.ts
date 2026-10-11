// ─── Employee Attendance — Backend Constants ────────────────────────────────
// Attendance module, Phase 3b: employee_attendance — the daily attendance
// record per employee.

// machine_status: 0 = manually entered (through this UI), 1 = recorded by a
// biometric/device import. This module only supports manual entry — device
// integration is a separate, later concern — so every record this UI creates
// is stamped 0, but existing 1-rows (if a device importer is added later)
// still display correctly as read-only "Device" entries.
export const ATTENDANCE_MACHINE_STATUS = {
  MANUAL: 0,
  DEVICE: 1,
} as const;

// status is a plain Int with no DB-level FK, but conceptually references
// erp_attendance_statuses.id (see attendanceStatus.constants.ts) — the set
// of valid values is whatever statuses exist in that table, not a fixed enum
// here.

export const REMARKS_MAX_LENGTH = 1000;
export const COMMENT_MAX_LENGTH = 1000;

export const TIME_HHMM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
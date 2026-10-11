// ─── Employee Attendance — Frontend Constants ───────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/constants/attendance.constants.ts

export const ATTENDANCE_MACHINE_STATUS = {
  MANUAL: 0,
  DEVICE: 1,
} as const;

export const ATTENDANCE_MACHINE_STATUS_LABELS: Record<number, string> = {
  [ATTENDANCE_MACHINE_STATUS.MANUAL]: "Manual",
  [ATTENDANCE_MACHINE_STATUS.DEVICE]: "Device",
};

export const REMARKS_MAX_LENGTH = 1000;
export const COMMENT_MAX_LENGTH = 1000;

export const TIME_HHMM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
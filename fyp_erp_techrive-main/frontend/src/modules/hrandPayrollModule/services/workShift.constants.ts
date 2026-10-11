// ─── Work Shift — Frontend Constants ─────────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/constants/workShift.constants.ts

export const WORK_SHIFT_NAME_MAX_LENGTH = 255;

export const WORK_SHIFT_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

export const GRACE_MINUTES_MIN = 0;
export const GRACE_MINUTES_MAX = 180;

// day: 1 = Monday … 7 = Sunday (ISO-8601), same convention as the backend.
export const WORK_WEEK_DAYS_ORDERED = [
  { day: 1, label: "Monday", short: "Mon" },
  { day: 2, label: "Tuesday", short: "Tue" },
  { day: 3, label: "Wednesday", short: "Wed" },
  { day: 4, label: "Thursday", short: "Thu" },
  { day: 5, label: "Friday", short: "Fri" },
  { day: 6, label: "Saturday", short: "Sat" },
  { day: 7, label: "Sunday", short: "Sun" },
] as const;

// on_off: 1 = working day, 0 = day off.
export const WORK_WEEK_ON_OFF = {
  WORKING: 1,
  OFF: 0,
} as const;

export const TIME_HHMM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
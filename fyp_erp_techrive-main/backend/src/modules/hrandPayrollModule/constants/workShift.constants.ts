// ─── Work Shift — Backend Constants ─────────────────────────────────────────
// Attendance module, Phase 1: erp_hrm_work_shifts (shift master) +
// erp_hrm_work_weeks (its 7-day weekly schedule, one row per day).
//
// erp_hrm_work_weeks.day is a plain Int with no lookup table in the schema —
// this codebase adopts ISO-8601 numbering (1 = Monday … 7 = Sunday) as the
// convention, documented here since nothing in the SQL export pins it down.
//
// erp_hrm_work_weeks.on_off is likewise a plain Int with no enum in the
// schema — this codebase adopts 1 = working day, 0 = day off.

export const WORK_SHIFT_NAME_MAX_LENGTH = 255;

export const WORK_SHIFT_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

// grace_in / grace_out are stored as plain (nullable) Int minutes on
// erp_hrm_work_shifts — no unit column exists, "minutes" is this codebase's
// convention, matching how grace periods are conventionally expressed.
export const GRACE_MINUTES_MIN = 0;
export const GRACE_MINUTES_MAX = 180;

export const WORK_WEEK_DAY = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
} as const;

export const WORK_WEEK_DAYS_ORDERED = [
  { day: WORK_WEEK_DAY.MONDAY, label: "Monday" },
  { day: WORK_WEEK_DAY.TUESDAY, label: "Tuesday" },
  { day: WORK_WEEK_DAY.WEDNESDAY, label: "Wednesday" },
  { day: WORK_WEEK_DAY.THURSDAY, label: "Thursday" },
  { day: WORK_WEEK_DAY.FRIDAY, label: "Friday" },
  { day: WORK_WEEK_DAY.SATURDAY, label: "Saturday" },
  { day: WORK_WEEK_DAY.SUNDAY, label: "Sunday" },
] as const;

export const WORK_WEEK_ON_OFF = {
  WORKING: 1,
  OFF: 0,
} as const;

// erp_hrm_work_weeks.start_time / end_time are @db.Time(6) columns — Prisma
// needs a full Date for these, so times are carried over the wire as plain
// "HH:mm" strings and anchored to an arbitrary fixed UTC date on write/read
// (see workShift.service.ts's timeStringToDate/dateToTimeString helpers).
export const TIME_HHMM_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
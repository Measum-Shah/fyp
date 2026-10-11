import {
  GRACE_MINUTES_MAX,
  GRACE_MINUTES_MIN,
  TIME_HHMM_REGEX,
  WORK_SHIFT_NAME_MAX_LENGTH,
  WORK_WEEK_ON_OFF,
} from "./workShift.constants";
import type {
  CreateWorkShiftPayload,
  UpdateWorkShiftPayload,
  WorkShift,
  WorkShiftFormValues,
  WorkWeekDayFormValues,
  WorkWeekDayPayload,
} from "./workShift.types";

// ─── Work Shift Form — Validation & Conversion ───────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/validators/workShift.validator.ts

const isBlank = (value: string) => value.trim().length === 0;
const isValidPositiveInt = (value: string) => /^\d+$/.test(value.trim());

const validateGraceField = (
  errors: Record<string, string>,
  field: "grace_in" | "grace_out",
  value: string,
  label: string
) => {
  if (isBlank(value)) return;
  if (!isValidPositiveInt(value)) {
    errors[field] = `${label} must be a whole number of minutes`;
    return;
  }
  const n = Number(value);
  if (n < GRACE_MINUTES_MIN || n > GRACE_MINUTES_MAX) {
    errors[field] = `${label} must be between ${GRACE_MINUTES_MIN} and ${GRACE_MINUTES_MAX} minutes`;
  }
};

// Per-day week errors are returned keyed as "week.<day>.<field>" so the
// modal can surface them next to the right row.
export const validateWorkShiftForm = (values: WorkShiftFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.name)) {
    errors.name = "Shift name is required";
  } else if (values.name.trim().length > WORK_SHIFT_NAME_MAX_LENGTH) {
    errors.name = `Shift name must be at most ${WORK_SHIFT_NAME_MAX_LENGTH} characters`;
  }

  if (!isBlank(values.branch_id) && !isValidPositiveInt(values.branch_id)) {
    errors.branch_id = "Campus must be a valid selection";
  }

  validateGraceField(errors, "grace_in", values.grace_in, "Grace-in");
  validateGraceField(errors, "grace_out", values.grace_out, "Grace-out");

  values.week.forEach((d) => {
    if (!d.on_off) return;
    if (isBlank(d.start_time) || !TIME_HHMM_REGEX.test(d.start_time)) {
      errors[`week.${d.day}.start_time`] = "Start time is required";
    }
    if (isBlank(d.end_time) || !TIME_HHMM_REGEX.test(d.end_time)) {
      errors[`week.${d.day}.end_time`] = "End time is required";
    }
  });

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

const trimOrUndefined = (value: string): string | undefined =>
  value.trim() === "" ? undefined : value.trim();

const numberOrUndefined = (value: string): number | undefined =>
  value.trim() === "" ? undefined : Number(value.trim());

const toWeekPayload = (week: WorkWeekDayFormValues[]): WorkWeekDayPayload[] =>
  week.map((d) => ({
    day: d.day,
    on_off: d.on_off ? WORK_WEEK_ON_OFF.WORKING : WORK_WEEK_ON_OFF.OFF,
    start_time: d.on_off ? trimOrUndefined(d.start_time) : undefined,
    end_time: d.on_off ? trimOrUndefined(d.end_time) : undefined,
  }));

export const toCreatePayload = (values: WorkShiftFormValues): CreateWorkShiftPayload => ({
  name: values.name.trim(),
  branch_id: numberOrUndefined(values.branch_id) ?? null,
  grace_in: numberOrUndefined(values.grace_in) ?? null,
  grace_out: numberOrUndefined(values.grace_out) ?? null,
  status: values.status !== "" ? Number(values.status) : undefined,
  week: toWeekPayload(values.week),
});

export const toUpdatePayload = (values: WorkShiftFormValues): UpdateWorkShiftPayload =>
  toCreatePayload(values);

export const workShiftToFormValues = (shift: WorkShift): WorkShiftFormValues => ({
  name: shift.name,
  branch_id: shift.branch_id != null ? String(shift.branch_id) : "",
  grace_in: shift.grace_in != null ? String(shift.grace_in) : "",
  grace_out: shift.grace_out != null ? String(shift.grace_out) : "",
  status: String(shift.status),
  week: [1, 2, 3, 4, 5, 6, 7].map((day) => {
    const existing = shift.week.find((d) => d.day === day);
    return {
      day,
      on_off: existing ? existing.on_off === WORK_WEEK_ON_OFF.WORKING : day >= 1 && day <= 5,
      start_time: existing?.start_time ?? "09:00",
      end_time: existing?.end_time ?? "17:00",
    };
  }),
});
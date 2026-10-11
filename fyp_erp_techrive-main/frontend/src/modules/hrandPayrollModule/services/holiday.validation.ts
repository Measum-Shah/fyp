import { HOLIDAY_NAME_MAX_LENGTH } from "./holiday.constants";
import type {
  CreateHolidayPayload,
  Holiday,
  HolidayFormValues,
  UpdateHolidayPayload,
} from "./holiday.types";

// ─── Holiday Form — Validation & Conversion ──────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/validators/holiday.validator.ts

const isBlank = (value: string) => value.trim().length === 0;

export const validateHolidayForm = (values: HolidayFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.holiday_name)) {
    errors.holiday_name = "Holiday name is required";
  } else if (values.holiday_name.trim().length > HOLIDAY_NAME_MAX_LENGTH) {
    errors.holiday_name = `Holiday name must be at most ${HOLIDAY_NAME_MAX_LENGTH} characters`;
  }

  if (isBlank(values.days)) {
    errors.days = "Number of days is required";
  } else if (!Number.isInteger(Number(values.days)) || Number(values.days) <= 0) {
    errors.days = "Number of days must be a positive whole number";
  }

  const hasStart = !isBlank(values.start_date);
  const hasEnd = !isBlank(values.end_date);

  if (hasStart !== hasEnd) {
    const field = hasStart ? "end_date" : "start_date";
    errors[field] = "Provide both a start date and an end date, or leave both empty";
  }

  if (hasStart && hasEnd && new Date(values.end_date) < new Date(values.start_date)) {
    errors.end_date = "End date cannot be before start date";
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

export const toCreatePayload = (values: HolidayFormValues): CreateHolidayPayload => ({
  holiday_name: values.holiday_name.trim(),
  days: Number(values.days),
  start_date: values.start_date.trim() === "" ? undefined : values.start_date.trim(),
  end_date: values.end_date.trim() === "" ? undefined : values.end_date.trim(),
});

export const toUpdatePayload = (values: HolidayFormValues): UpdateHolidayPayload =>
  toCreatePayload(values);

export const holidayToFormValues = (holiday: Holiday): HolidayFormValues => ({
  holiday_name: holiday.holiday_name,
  days: String(holiday.days),
  start_date: holiday.start_date ? holiday.start_date.slice(0, 10) : "",
  end_date: holiday.end_date ? holiday.end_date.slice(0, 10) : "",
});

// Inclusive day count, for the form's live "X day(s)" preview — mirrors the
// server-side computation in holiday.service.ts exactly. Only meaningful
// once both dates are filled in; the manually-entered Number of Days field
// is the source of truth whenever dates are left empty.
export const previewDayCount = (start_date: string, end_date: string): number | null => {
  if (isBlank(start_date) || isBlank(end_date)) return null;
  const startMs = Date.parse(start_date);
  const endMs = Date.parse(end_date);
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) return null;
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((endMs - startMs) / MS_PER_DAY) + 1;
};
import { z } from "zod";
import { DATE_REGEX } from "../constants/employee.constants";
import { HOLIDAY_NAME_MAX_LENGTH } from "../constants/holiday.constants";

// ─── Create Holiday ──────────────────────────────────────────────────────────
// `days` is required from the client now (Number of Days field). When both
// start_date and end_date are supplied, the server still recomputes `days`
// from them (see holiday.service.ts) so the two never contradict each other
// — the client-supplied `days` is only used as-is when the dates are absent,
// which is the only case it can be authoritative.
export const createHolidaySchema = z
  .object({
    holiday_name: z
      .string({ error: "Holiday name is required" })
      .trim()
      .min(1, "Holiday name is required")
      .max(HOLIDAY_NAME_MAX_LENGTH, `Holiday name must be at most ${HOLIDAY_NAME_MAX_LENGTH} characters`),
    days: z.coerce
      .number({ error: "Number of days is required" })
      .int("Number of days must be a whole number")
      .positive("Number of days must be a positive number"),
    start_date: z
      .string()
      .trim()
      .regex(DATE_REGEX, "Start date must be in YYYY-MM-DD format")
      .optional(),
    end_date: z
      .string()
      .trim()
      .regex(DATE_REGEX, "End date must be in YYYY-MM-DD format")
      .optional(),
  })
  .superRefine((val, ctx) => {
    const hasStart = val.start_date !== undefined && val.start_date !== "";
    const hasEnd = val.end_date !== undefined && val.end_date !== "";
    if (hasStart !== hasEnd) {
      ctx.addIssue({
        code: "custom",
        path: [hasStart ? "end_date" : "start_date"],
        message: "Provide both a start date and an end date, or leave both empty",
      });
    }
    if (hasStart && hasEnd && new Date(val.end_date as string) < new Date(val.start_date as string)) {
      ctx.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "End date cannot be before start date",
      });
    }
  });

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;

// ─── Update Holiday (partial, but body cannot be empty) ─────────────────────
const updateHolidayBaseSchema = z.object({
  holiday_name: z
    .string()
    .trim()
    .min(1, "Holiday name is required")
    .max(HOLIDAY_NAME_MAX_LENGTH, `Holiday name must be at most ${HOLIDAY_NAME_MAX_LENGTH} characters`)
    .optional(),
  days: z.coerce.number().int("Number of days must be a whole number").positive("Number of days must be a positive number").optional(),
  start_date: z.string().trim().regex(DATE_REGEX, "Start date must be in YYYY-MM-DD format").optional(),
  end_date: z.string().trim().regex(DATE_REGEX, "End date must be in YYYY-MM-DD format").optional(),
});

export const updateHolidaySchema = updateHolidayBaseSchema
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the holiday",
  })
  .superRefine((val, ctx) => {
    if (val.start_date && val.end_date && new Date(val.end_date) < new Date(val.start_date)) {
      ctx.addIssue({
        code: "custom",
        path: ["end_date"],
        message: "End date cannot be before start date",
      });
    }
  });

export type UpdateHolidayInput = z.infer<typeof updateHolidayBaseSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const holidayIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Holiday id must be a number" })
    .int("Holiday id must be a valid integer")
    .positive("Holiday id must be a valid integer"),
});

// ─── GET /holidays query params ─────────────────────────────────────────────
export const listHolidaysQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  year: z.coerce.number().int().min(1900).max(2200).optional(),
});
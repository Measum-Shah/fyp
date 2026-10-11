import { z } from "zod";
import {
  GRACE_MINUTES_MAX,
  GRACE_MINUTES_MIN,
  TIME_HHMM_REGEX,
  WORK_SHIFT_NAME_MAX_LENGTH,
  WORK_SHIFT_STATUS,
  WORK_WEEK_ON_OFF,
} from "../constants/workShift.constants";

// ─── Shared field schemas ───────────────────────────────────────────────────
const optionalBranchId = z.coerce.number().int().positive().nullable().optional();

const graceMinutesField = z.coerce
  .number()
  .int("Grace period must be a whole number of minutes")
  .min(GRACE_MINUTES_MIN, `Grace period cannot be negative`)
  .max(GRACE_MINUTES_MAX, `Grace period must be at most ${GRACE_MINUTES_MAX} minutes`)
  .nullable()
  .optional();

// ─── One day of the weekly schedule ─────────────────────────────────────────
// on_off: 1 = working day, 0 = day off (see workShift.constants.ts). When
// working, start_time/end_time are required; when off, they're ignored.
const workWeekDaySchema = z
  .object({
    day: z.coerce.number().int().min(1).max(7),
    on_off: z.union([z.literal(WORK_WEEK_ON_OFF.WORKING), z.literal(WORK_WEEK_ON_OFF.OFF)]),
    start_time: z.string().trim().regex(TIME_HHMM_REGEX, "Start time must be in HH:mm format").optional(),
    end_time: z.string().trim().regex(TIME_HHMM_REGEX, "End time must be in HH:mm format").optional(),
  })
  .superRefine((val, ctx) => {
    if (val.on_off === WORK_WEEK_ON_OFF.WORKING) {
      if (!val.start_time) {
        ctx.addIssue({ code: "custom", path: ["start_time"], message: "Start time is required for a working day" });
      }
      if (!val.end_time) {
        ctx.addIssue({ code: "custom", path: ["end_time"], message: "End time is required for a working day" });
      }
    }
  });

// A full weekly schedule: exactly 7 entries, one per day (1-7), no duplicates.
const workWeekSchema = z
  .array(workWeekDaySchema)
  .length(7, "A full 7-day weekly schedule is required")
  .superRefine((days, ctx) => {
    const seen = new Set<number>();
    for (const d of days) {
      if (seen.has(d.day)) {
        ctx.addIssue({ code: "custom", message: `Day ${d.day} is listed more than once` });
      }
      seen.add(d.day);
    }
    for (let day = 1; day <= 7; day++) {
      if (!seen.has(day)) {
        ctx.addIssue({ code: "custom", message: `Day ${day} is missing from the weekly schedule` });
      }
    }
  });

// ─── Create Work Shift ───────────────────────────────────────────────────────
export const createWorkShiftSchema = z.object({
  name: z
    .string({ error: "Shift name is required" })
    .trim()
    .min(1, "Shift name is required")
    .max(WORK_SHIFT_NAME_MAX_LENGTH, `Shift name must be at most ${WORK_SHIFT_NAME_MAX_LENGTH} characters`),
  branch_id: optionalBranchId,
  grace_in: graceMinutesField,
  grace_out: graceMinutesField,
  status: z.union([z.literal(WORK_SHIFT_STATUS.ACTIVE), z.literal(WORK_SHIFT_STATUS.INACTIVE)]).optional(),
  week: workWeekSchema,
});

export type CreateWorkShiftInput = z.infer<typeof createWorkShiftSchema>;

// ─── Update Work Shift ───────────────────────────────────────────────────────
// week stays required (not partial) — a schedule update always replaces the
// full 7-day set rather than patching individual days, so there's no
// ambiguity about which days changed.
export const updateWorkShiftSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Shift name is required")
    .max(WORK_SHIFT_NAME_MAX_LENGTH, `Shift name must be at most ${WORK_SHIFT_NAME_MAX_LENGTH} characters`)
    .optional(),
  branch_id: optionalBranchId,
  grace_in: graceMinutesField,
  grace_out: graceMinutesField,
  status: z.union([z.literal(WORK_SHIFT_STATUS.ACTIVE), z.literal(WORK_SHIFT_STATUS.INACTIVE)]).optional(),
  week: workWeekSchema.optional(),
});

export type UpdateWorkShiftInput = z.infer<typeof updateWorkShiftSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const workShiftIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Work shift id must be a number" })
    .int("Work shift id must be a valid integer")
    .positive("Work shift id must be a valid integer"),
});

// ─── GET /work-shifts query params ──────────────────────────────────────────
export const listWorkShiftsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  branch_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  status: z.coerce.number().int().optional(),
});
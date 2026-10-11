import { z } from "zod";
import {
  LEAVE_TYPE_NAME_MAX_LENGTH,
  LEAVE_TYPE_PAY_TYPE,
  LEAVE_TYPE_STATUS,
  LEAVE_TYPE_TYPE_MAX_LENGTH,
} from "../constants/leaveType.constants";

const dateField = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((val) => !Number.isNaN(new Date(val).getTime()), {
    message: "Date must be a valid calendar date",
  });

// ─── Create Leave Type ───────────────────────────────────────────────────────
export const createLeaveTypeSchema = z.object({
  name: z
    .string({ error: "Leave type name is required" })
    .trim()
    .min(1, "Leave type name is required")
    .max(
      LEAVE_TYPE_NAME_MAX_LENGTH,
      `Leave type name must be at most ${LEAVE_TYPE_NAME_MAX_LENGTH} characters`
    ),
  permitted_days: z.coerce
    .number({ error: "Permitted days is required" })
    .int("Permitted days must be a whole number")
    .min(0, "Permitted days cannot be negative")
    .optional(),
  year: z.coerce
    .number()
    .int("Year must be a valid year")
    .min(2000, "Year must be 2000 or later")
    .max(2100, "Year must be 2100 or earlier")
    .optional(),
  parent_id: z.coerce.number().int().positive().nullable().optional(),
  type: z.string().trim().max(LEAVE_TYPE_TYPE_MAX_LENGTH).optional(),
  start_date: dateField.optional(),
  end_date: dateField.optional(),
  // pay_type: whether days of this leave type reduce net salary via the
  // automated payroll deduction (see payrollRun.service.ts). Defaults to
  // PAID (0) — matches the pre-existing behavior of every leave type
  // created before this field existed.
  pay_type: z.union([z.literal(LEAVE_TYPE_PAY_TYPE.PAID), z.literal(LEAVE_TYPE_PAY_TYPE.UNPAID)]).optional(),
  status: z
    .union([z.literal(LEAVE_TYPE_STATUS.ACTIVE), z.literal(LEAVE_TYPE_STATUS.INACTIVE)])
    .optional(),
});

export type CreateLeaveTypeInput = z.infer<typeof createLeaveTypeSchema>;

// ─── Update Leave Type (partial, but body cannot be empty) ─────────────────
export const updateLeaveTypeSchema = createLeaveTypeSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the leave type",
  });

export type UpdateLeaveTypeInput = z.infer<typeof updateLeaveTypeSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const leaveTypeIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Leave type id must be a number" })
    .int("Leave type id must be a valid integer")
    .positive("Leave type id must be a valid integer"),
});

// ─── GET /leave-types query params ──────────────────────────────────────────
export const listLeaveTypesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  status: z.coerce.number().int().optional(),
});
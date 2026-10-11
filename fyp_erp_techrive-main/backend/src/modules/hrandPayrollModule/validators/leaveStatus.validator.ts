import { z } from "zod";
import {
  LEAVE_STATUS_APPROVAL_FLAG,
  LEAVE_STATUS_NAME_MAX_LENGTH,
  LEAVE_STATUS_STATUS,
} from "../constants/leaveStatus.constants";

// ─── Create Leave Status ─────────────────────────────────────────────────────
export const createLeaveStatusSchema = z.object({
  name: z
    .string({ error: "Status name is required" })
    .trim()
    .min(1, "Status name is required")
    .max(
      LEAVE_STATUS_NAME_MAX_LENGTH,
      `Status name must be at most ${LEAVE_STATUS_NAME_MAX_LENGTH} characters`
    ),
  // counts_as_approved: mark this row as meaning "Approved" so payroll's
  // automated leave deduction (payrollRun.service.ts) knows to consider
  // requests in this status. Defaults to 0/off — see the schema comment.
  counts_as_approved: z
    .union([
      z.literal(LEAVE_STATUS_APPROVAL_FLAG.COUNTS_AS_APPROVED),
      z.literal(LEAVE_STATUS_APPROVAL_FLAG.DOES_NOT_COUNT),
    ])
    .optional(),
  status: z
    .union([z.literal(LEAVE_STATUS_STATUS.ACTIVE), z.literal(LEAVE_STATUS_STATUS.INACTIVE)])
    .optional(),
});

export type CreateLeaveStatusInput = z.infer<typeof createLeaveStatusSchema>;

// ─── Update Leave Status (partial, but body cannot be empty) ───────────────
export const updateLeaveStatusSchema = createLeaveStatusSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the leave status",
  });

export type UpdateLeaveStatusInput = z.infer<typeof updateLeaveStatusSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const leaveStatusIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Leave status id must be a number" })
    .int("Leave status id must be a valid integer")
    .positive("Leave status id must be a valid integer"),
});

// ─── GET /leave-statuses query params ───────────────────────────────────────
export const listLeaveStatusesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  status: z.coerce.number().int().optional(),
});
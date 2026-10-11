import { z } from "zod";
import {
  LEAVE_REQUEST_ATTACHMENT_MAX_LENGTH,
  LEAVE_REQUEST_COMMENTS_MAX_LENGTH,
  LEAVE_REQUEST_MAX_TOTAL_DAYS,
  LEAVE_REQUEST_REMARKS_MAX_LENGTH,
  LEAVE_REQUEST_SINGLE_DURATION,
  LEAVE_REQUEST_STATUS,
} from "../constants/leaveRequest.constants";

const dateField = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be in YYYY-MM-DD format`)
    .refine((val) => !Number.isNaN(new Date(val).getTime()), {
      message: `${label} must be a valid calendar date`,
    });

const timeField = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in HH:MM (24-hour) format")
  .optional();

// ─── Create Leave Request ────────────────────────────────────────────────────
export const createLeaveRequestSchema = z
  .object({
    employee_id: z.coerce
      .number({ error: "Employee is required" })
      .int("Employee must reference a valid employee id")
      .positive("Employee must reference a valid employee id"),
    leave_type_id: z.coerce
      .number({ error: "Leave type is required" })
      .int("Leave type must reference a valid leave type id")
      .positive("Leave type must reference a valid leave type id"),
    branch_id: z.coerce
      .number({ error: "Campus is required" })
      .int("Campus must reference a valid campus id")
      .positive("Campus must reference a valid campus id"),
    leave_status: z.coerce
      .number({ error: "Leave status is required" })
      .int("Leave status must reference a valid leave status id")
      .positive("Leave status must reference a valid leave status id"),
    start_date: dateField("Start date"),
    end_date: dateField("End date"),
    total_days: z.coerce
      .number({ error: "Total days is required" })
      .int("Total days must be a whole number")
      .positive("Total days must be at least 1")
      .max(LEAVE_REQUEST_MAX_TOTAL_DAYS, `Total days must be at most ${LEAVE_REQUEST_MAX_TOTAL_DAYS}`),
    applied_date: dateField("Applied date"),
    comments: z.string().trim().max(LEAVE_REQUEST_COMMENTS_MAX_LENGTH).optional(),
    remarks: z.string().trim().max(LEAVE_REQUEST_REMARKS_MAX_LENGTH).optional(),
    attachment: z.string().trim().max(LEAVE_REQUEST_ATTACHMENT_MAX_LENGTH).optional(),

    // ─── Single-day partial leave (only meaningful when total_days === 1) ──
    single_duration: z
      .enum([
        LEAVE_REQUEST_SINGLE_DURATION.FULL_DAY,
        LEAVE_REQUEST_SINGLE_DURATION.FIRST_HALF,
        LEAVE_REQUEST_SINGLE_DURATION.SECOND_HALF,
        LEAVE_REQUEST_SINGLE_DURATION.HOURLY,
      ])
      .optional(),
    single_shift: z.string().trim().max(20).optional(),
    single_hours_start: timeField,
    single_hours_end: timeField,

    status: z
      .union([z.literal(LEAVE_REQUEST_STATUS.ACTIVE), z.literal(LEAVE_REQUEST_STATUS.INACTIVE)])
      .optional(),
  })
  .refine((data) => new Date(data.end_date).getTime() >= new Date(data.start_date).getTime(), {
    message: "End date cannot be before start date",
    path: ["end_date"],
  })
  .refine(
    (data) =>
      data.single_duration !== LEAVE_REQUEST_SINGLE_DURATION.HOURLY ||
      (data.single_hours_start && data.single_hours_end),
    {
      message: "Start and end time are required for an hourly leave request",
      path: ["single_hours_start"],
    }
  );

export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;

// ─── Update Leave Request (partial, but body cannot be empty) ──────────────
// NOTE: the cross-field .refine() checks above only run when both fields in
// the comparison are present in the same payload — a partial update that
// only touches one side (e.g. just `remarks`) skips them, same tradeoff
// createEmployeeSchema.partial() already accepts.
export const updateLeaveRequestSchema = z
  .object({
    employee_id: z.coerce.number().int().positive().optional(),
    leave_type_id: z.coerce.number().int().positive().optional(),
    branch_id: z.coerce.number().int().positive().optional(),
    leave_status: z.coerce.number().int().positive().optional(),
    start_date: dateField("Start date").optional(),
    end_date: dateField("End date").optional(),
    total_days: z.coerce.number().int().positive().max(LEAVE_REQUEST_MAX_TOTAL_DAYS).optional(),
    applied_date: dateField("Applied date").optional(),
    comments: z.string().trim().max(LEAVE_REQUEST_COMMENTS_MAX_LENGTH).optional(),
    remarks: z.string().trim().max(LEAVE_REQUEST_REMARKS_MAX_LENGTH).optional(),
    attachment: z.string().trim().max(LEAVE_REQUEST_ATTACHMENT_MAX_LENGTH).optional(),
    single_duration: z
      .enum([
        LEAVE_REQUEST_SINGLE_DURATION.FULL_DAY,
        LEAVE_REQUEST_SINGLE_DURATION.FIRST_HALF,
        LEAVE_REQUEST_SINGLE_DURATION.SECOND_HALF,
        LEAVE_REQUEST_SINGLE_DURATION.HOURLY,
      ])
      .optional(),
    single_shift: z.string().trim().max(20).optional(),
    single_hours_start: timeField,
    single_hours_end: timeField,
    status: z
      .union([z.literal(LEAVE_REQUEST_STATUS.ACTIVE), z.literal(LEAVE_REQUEST_STATUS.INACTIVE)])
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the leave request",
  })
  .refine(
    (data) =>
      !data.start_date ||
      !data.end_date ||
      new Date(data.end_date).getTime() >= new Date(data.start_date).getTime(),
    { message: "End date cannot be before start date", path: ["end_date"] }
  );

export type UpdateLeaveRequestInput = z.infer<typeof updateLeaveRequestSchema>;

// ─── Change leave status (Approve / Reject / any status change) ────────────
export const changeLeaveRequestStatusSchema = z.object({
  leave_status: z.coerce
    .number({ error: "Leave status is required" })
    .int("Leave status must reference a valid leave status id")
    .positive("Leave status must reference a valid leave status id"),
  remarks: z.string().trim().max(LEAVE_REQUEST_REMARKS_MAX_LENGTH).optional(),
});

export type ChangeLeaveRequestStatusInput = z.infer<typeof changeLeaveRequestStatusSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const leaveRequestIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Leave request id must be a number" })
    .int("Leave request id must be a valid integer")
    .positive("Leave request id must be a valid integer"),
});

// ─── GET /leave-requests query params ───────────────────────────────────────
export const listLeaveRequestsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  employee_id: z.coerce.number().int().positive().optional(),
  leave_type_id: z.coerce.number().int().positive().optional(),
  leave_status: z.coerce.number().int().positive().optional(),
  branch_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
});
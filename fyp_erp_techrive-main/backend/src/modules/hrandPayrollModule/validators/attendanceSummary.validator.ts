import { z } from "zod";
import {
  APPROVED_STATUS_OPTIONS,
  PAY_STATUS_OPTIONS,
  REMARKS_MAX_LENGTH,
  TOTAL_ABSENTS_MAX,
  TOTAL_ABSENTS_MIN,
} from "../constants/attendanceSummary.constants";

const totalAbsentsField = z.coerce
  .number()
  .int("Total absents must be a whole number")
  .min(TOTAL_ABSENTS_MIN, "Total absents cannot be negative")
  .max(TOTAL_ABSENTS_MAX, `Total absents must be at most ${TOTAL_ABSENTS_MAX}`)
  .optional();

// ─── Create Attendance Summary ───────────────────────────────────────────────
// approved_status/approved_by are deliberately not accepted here — every
// summary starts life as "Pending" and is only ever moved off that via the
// dedicated PATCH /:id/approval endpoint (see attendanceSummary.service.ts).
export const createAttendanceSummarySchema = z.object({
  branch_id: z.coerce.number({ error: "Campus is required" }).int().positive(),
  staff_id: z.coerce.number({ error: "Employee is required" }).int().positive(),
  month_id: z.coerce.number({ error: "Month is required" }).int().positive(),
  year_id: z.coerce.number({ error: "Year is required" }).int().positive(),
  total_absents: totalAbsentsField,
  remarks: z.string().trim().max(REMARKS_MAX_LENGTH).optional(),
  pay_status: z.enum(PAY_STATUS_OPTIONS, { error: "Pay status is required" }),
});

export type CreateAttendanceSummaryInput = z.infer<typeof createAttendanceSummarySchema>;

// ─── Update Attendance Summary ───────────────────────────────────────────────
export const updateAttendanceSummarySchema = z
  .object({
    total_absents: totalAbsentsField,
    remarks: z.string().trim().max(REMARKS_MAX_LENGTH).optional(),
    pay_status: z.enum(PAY_STATUS_OPTIONS).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the attendance summary",
  });

export type UpdateAttendanceSummaryInput = z.infer<typeof updateAttendanceSummarySchema>;

// ─── PATCH /attendance-summaries/:id/approval body ──────────────────────────
// Approver Name / Approver Designation now reference real Employees /
// Designations (never free text) — see resignation.validator.ts for the
// identical pattern. approved_by (the legacy free-text name) is no longer
// accepted from the client; the service derives and stores it from the
// selected employee for backward compatibility with any code still reading
// the plain-text column.
export const setApprovalSchema = z.object({
  approved_status: z.enum(APPROVED_STATUS_OPTIONS, { error: "Approval status is required" }),
  approved_by_employee_id: z.coerce
    .number({ error: "Approver name is required" })
    .int()
    .positive("Approver name must reference a valid employee"),
  approved_by_designation_id: z.coerce
    .number({ error: "Approver designation is required" })
    .int()
    .positive("Approver designation must reference a valid designation"),
});

export type SetApprovalInput = z.infer<typeof setApprovalSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const attendanceSummaryIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Attendance summary id must be a number" })
    .int("Attendance summary id must be a valid integer")
    .positive("Attendance summary id must be a valid integer"),
});

// ─── GET /attendance-summaries query params ─────────────────────────────────
export const listAttendanceSummariesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  staff_id: z.coerce.number().int().positive().optional(),
  branch_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  month_id: z.coerce.number().int().positive().optional(),
  year_id: z.coerce.number().int().positive().optional(),
  pay_status: z.enum(PAY_STATUS_OPTIONS).optional(),
  approved_status: z.enum(APPROVED_STATUS_OPTIONS).optional(),
});
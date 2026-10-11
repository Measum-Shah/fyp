import { z } from "zod";
import { DATE_REGEX } from "../constants/employee.constants";
import {
  APPROVAL_STATUS,
  EXPERIENCE_LETTER_MAX_LENGTH,
  RESIGN_NOTICE_PERIOD_MAX_LENGTH,
  RESIGN_REASON_MAX_LENGTH,
} from "../constants/resignation.constants";

// ─── Create Resignation ──────────────────────────────────────────────────────
// approved_by_ceo / approved_by_hr_head / status are never accepted here —
// every new resignation starts fully Pending and only moves via
// updateResignationApprovalSchema (see resignation.service.ts for why status
// is computed rather than settable).
export const createResignationSchema = z.object({
  staff_id: z.coerce
    .number({ error: "Employee is required" })
    .int()
    .positive("Employee must reference a valid staff id"),
  branch_id: z.coerce
    .number({ error: "Campus is required" })
    .int()
    .positive("Campus must reference a valid campus id"),
  role_id: z.coerce.number({ error: "Role id is required" }).int().positive("Role id must be a valid id"),
  reason: z
    .string({ error: "Reason is required" })
    .trim()
    .min(1, "Reason is required")
    .max(RESIGN_REASON_MAX_LENGTH, `Reason must be at most ${RESIGN_REASON_MAX_LENGTH} characters`),
  notice_period: z
    .string({ error: "Notice period is required" })
    .trim()
    .min(1, "Notice period is required")
    .max(RESIGN_NOTICE_PERIOD_MAX_LENGTH),
  last_day_of_work: z
    .string({ error: "Last day of work is required" })
    .trim()
    .regex(DATE_REGEX, "Last day of work must be in YYYY-MM-DD format"),
  join_date: z
    .string()
    .trim()
    .regex(DATE_REGEX, "Join date must be in YYYY-MM-DD format")
    .optional(),
  // Public upload path (e.g. "/uploads/resignation-experience-letters/…"),
  // produced by POST /resignations/upload-experience-letter — see
  // resignation.controller.ts#uploadResignationExperienceLetter. Never a
  // raw filename typed by the user.
  experience_letter: z.string().trim().max(EXPERIENCE_LETTER_MAX_LENGTH).optional(),
  class: z.string().trim().max(191).optional(),
  subject: z.string().trim().max(191).optional(),
});

export type CreateResignationInput = z.infer<typeof createResignationSchema>;

// ─── Update Resignation (core fields — partial, but body cannot be empty) ──
export const updateResignationSchema = createResignationSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the resignation",
  });

export type UpdateResignationInput = z.infer<typeof updateResignationSchema>;

// ─── Update approval (separate action) ──────────────────────────────────────
// Each stage (CEO Approval, HR Head Approval) now carries three pieces of
// information together: Approval Status (Pending/Approved/Rejected),
// Approver Name (a real staff id — "Approver Employee"), and Approver
// Designation (a real designation id). Whenever a stage's status is being
// set, its employee + designation must be provided too — a status can't be
// recorded without saying who made the call, matching the task's "Approver
// Name *" / "Approver Designation *" requirement. Approver Designation is
// still required from the client, even though the service will normally
// have already auto-filled it from the selected employee's own designation
// (see employee.service.ts#getStaffLookup / EmployeeApproverFields.tsx) —
// this keeps the API honest and independently validatable.
const approvalField = z
  .union([z.literal(APPROVAL_STATUS.PENDING), z.literal(APPROVAL_STATUS.APPROVED), z.literal(APPROVAL_STATUS.REJECTED)])
  .optional();

const employeeIdField = z.coerce.number().int().positive("Approver name must reference a valid employee").optional();
const designationIdField = z.coerce
  .number()
  .int()
  .positive("Approver designation must reference a valid designation")
  .optional();

export const updateResignationApprovalSchema = z
  .object({
    approved_by_ceo: approvalField,
    approved_by_ceo_employee_id: employeeIdField,
    approved_by_ceo_designation_id: designationIdField,
    approved_by_hr_head: approvalField,
    approved_by_hr_head_employee_id: employeeIdField,
    approved_by_hr_head_designation_id: designationIdField,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one approval field must be provided",
  })
  .superRefine((data, ctx) => {
    if (data.approved_by_ceo !== undefined) {
      if (data.approved_by_ceo_employee_id === undefined) {
        ctx.addIssue({ code: "custom", path: ["approved_by_ceo_employee_id"], message: "Approver name is required" });
      }
      if (data.approved_by_ceo_designation_id === undefined) {
        ctx.addIssue({ code: "custom", path: ["approved_by_ceo_designation_id"], message: "Approver designation is required" });
      }
    }
    if (data.approved_by_hr_head !== undefined) {
      if (data.approved_by_hr_head_employee_id === undefined) {
        ctx.addIssue({ code: "custom", path: ["approved_by_hr_head_employee_id"], message: "Approver name is required" });
      }
      if (data.approved_by_hr_head_designation_id === undefined) {
        ctx.addIssue({ code: "custom", path: ["approved_by_hr_head_designation_id"], message: "Approver designation is required" });
      }
    }
  });

export type UpdateResignationApprovalInput = z.infer<typeof updateResignationApprovalSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const resignationIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Resignation id must be a number" })
    .int()
    .positive("Resignation id must be a valid integer"),
});

// ─── GET /resignations query params ─────────────────────────────────────────
export const listResignationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  staff_id: z.coerce.number().int().positive().optional(),
  branch_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  status: z
    .union([z.literal(APPROVAL_STATUS.PENDING), z.literal(APPROVAL_STATUS.APPROVED), z.literal(APPROVAL_STATUS.REJECTED)])
    .optional(),
});
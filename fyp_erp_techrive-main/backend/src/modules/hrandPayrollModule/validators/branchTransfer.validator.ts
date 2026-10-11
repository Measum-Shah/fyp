import { z } from "zod";
import { DATE_REGEX } from "../constants/employee.constants";
import { APPROVAL_STATUS, TRANSFER_REASON_MAX_LENGTH } from "../constants/branchTransfer.constants";

// ─── Create Branch Transfer ──────────────────────────────────────────────────
// from_branch is optional — if omitted, the service auto-fills it from the
// employee's current staff.branch_id, which is usually more reliable than
// asking the requester to type it in. verified_status/approved_status/status
// are never accepted here; every transfer starts fully Pending (see
// branchTransfer.service.ts).
export const createBranchTransferSchema = z.object({
  staff_id: z.coerce
    .number({ error: "Employee is required" })
    .int()
    .positive("Employee must reference a valid staff id"),
  to_branch: z.coerce
    .number({ error: "Destination campus is required" })
    .int()
    .positive("Destination campus must reference a valid campus id"),
  from_branch: z.coerce.number().int().positive().optional(),
  date: z
    .string({ error: "Date is required" })
    .trim()
    .regex(DATE_REGEX, "Date must be in YYYY-MM-DD format"),
  reason: z
    .string({ error: "Reason is required" })
    .trim()
    .min(1, "Reason is required")
    .max(TRANSFER_REASON_MAX_LENGTH, `Reason must be at most ${TRANSFER_REASON_MAX_LENGTH} characters`),
});

export type CreateBranchTransferInput = z.infer<typeof createBranchTransferSchema>;

// ─── Update Branch Transfer (core fields — only while still Pending) ───────
export const updateBranchTransferSchema = createBranchTransferSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the transfer request",
  });

export type UpdateBranchTransferInput = z.infer<typeof updateBranchTransferSchema>;

// ─── Update approval (separate action) ──────────────────────────────────────
// Each of the three existing stages (Verified, Approved, Principal Approval)
// now carries Approval Status + Approver Name (a real staff id) + Approver
// Designation (a real designation id) together — see resignation.validator.ts
// for the identical pattern this mirrors field-for-field.
const approvalField = z
  .union([z.literal(APPROVAL_STATUS.PENDING), z.literal(APPROVAL_STATUS.APPROVED), z.literal(APPROVAL_STATUS.REJECTED)])
  .optional();

const employeeIdField = z.coerce.number().int().positive("Approver name must reference a valid employee").optional();
const designationIdField = z.coerce
  .number()
  .int()
  .positive("Approver designation must reference a valid designation")
  .optional();

export const updateBranchTransferApprovalSchema = z
  .object({
    verified_status: approvalField,
    verified_employee_id: employeeIdField,
    verified_designation_id: designationIdField,
    approved_status: approvalField,
    approved_employee_id: employeeIdField,
    approved_designation_id: designationIdField,
    principal_approval: approvalField,
    principal_approval_employee_id: employeeIdField,
    principal_approval_designation_id: designationIdField,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one approval field must be provided",
  })
  .superRefine((data, ctx) => {
    const stages: Array<["verified" | "approved" | "principal_approval", string]> = [
      ["verified", "verified_status"],
      ["approved", "approved_status"],
      ["principal_approval", "principal_approval"],
    ];
    for (const [prefix] of stages) {
      const statusKey = prefix === "principal_approval" ? "principal_approval" : (`${prefix}_status` as const);
      const employeeKey = `${prefix}_employee_id` as keyof typeof data;
      const designationKey = `${prefix}_designation_id` as keyof typeof data;
      if ((data as Record<string, unknown>)[statusKey] !== undefined) {
        if (data[employeeKey] === undefined) {
          ctx.addIssue({ code: "custom", path: [employeeKey], message: "Approver name is required" });
        }
        if (data[designationKey] === undefined) {
          ctx.addIssue({ code: "custom", path: [designationKey], message: "Approver designation is required" });
        }
      }
    }
  });

export type UpdateBranchTransferApprovalInput = z.infer<typeof updateBranchTransferApprovalSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const branchTransferIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Transfer id must be a number" })
    .int()
    .positive("Transfer id must be a valid integer"),
});

// ─── GET /branch-transfers query params ─────────────────────────────────────
export const listBranchTransfersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  staff_id: z.coerce.number().int().positive().optional(),
  status: z
    .union([z.literal(APPROVAL_STATUS.PENDING), z.literal(APPROVAL_STATUS.APPROVED), z.literal(APPROVAL_STATUS.REJECTED)])
    .optional(),
});
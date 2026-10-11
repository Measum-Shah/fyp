import { z } from "zod";
import { DATE_REGEX } from "../constants/employee.constants";
import {
  LOAN_REQUEST_ATTACHMENT_MAX_LENGTH,
  LOAN_REQUEST_MAX_AMOUNT,
  LOAN_REQUEST_MAX_INSTALLMENTS,
  LOAN_REQUEST_REASON_MAX_LENGTH,
  LOAN_REQUEST_REMARKS_MAX_LENGTH,
  LOAN_REQUEST_STATUS,
  LOAN_REQUEST_TYPE_MAX_LENGTH,
} from "../constants/loanRequest.constants";

// ─── Loan Request Module — Validators ───────────────────────────────────────
// request_loan_employee — same field set loan.validator.ts already covers,
// plus the soft delete loanRequest.service.ts implements. See
// loanRequest.constants.ts for why this table (not erp_loans/erp_loan_plans)
// is the one modeled here.
//
// This used to be a two-tier approval workflow (status + a separate
// approved_by_ceo sign-off gating payroll deduction). The CEO tier was
// removed at the user's request: it had no reachable UI control, which
// meant approved_by_ceo could never actually be set to Approved, which
// meant computeLoanDeduction() (payrollRun.service.ts) could never deduct
// ANY loan from payroll, ever, regardless of status. `status` alone is now
// the single approval gate — see payrollRun.service.ts.

// ─── Create Loan Request ────────────────────────────────────────────────────
// status is never accepted on create — every new request starts Pending,
// same "creation vs. workflow action" separation loan.validator.ts's
// createLoanSchema already uses.
export const createLoanRequestSchema = z.object({
  staff_id: z.coerce
    .number({ error: "Employee is required" })
    .int()
    .positive("Employee must reference a valid staff id"),
  branch_id: z.coerce
    .number({ error: "Campus is required" })
    .int()
    .positive("Campus must reference a valid campus id"),
  type: z
    .string({ error: "Loan type is required" })
    .trim()
    .min(1, "Loan type is required")
    .max(LOAN_REQUEST_TYPE_MAX_LENGTH, `Loan type must be at most ${LOAN_REQUEST_TYPE_MAX_LENGTH} characters`),
  amount: z.coerce
    .number({ error: "Amount is required" })
    .int()
    .positive("Amount must be greater than 0")
    .max(LOAN_REQUEST_MAX_AMOUNT, "Amount is unreasonably large"),
  installments: z.coerce
    .number({ error: "Number of installments is required" })
    .int()
    .positive("Installments must be at least 1")
    .max(LOAN_REQUEST_MAX_INSTALLMENTS, `Installments must be at most ${LOAN_REQUEST_MAX_INSTALLMENTS}`),
  monthly_installment: z.coerce.number().int().positive().optional(),
  effective_from: z
    .string({ error: "Effective-from date is required" })
    .trim()
    .regex(DATE_REGEX, "Effective-from date must be in YYYY-MM-DD format")
    .refine((val) => !Number.isNaN(new Date(val).getTime()), {
      message: "Effective-from date must be a valid calendar date",
    }),
  reason: z.string().trim().max(LOAN_REQUEST_REASON_MAX_LENGTH).optional(),
  remarks: z.string().trim().max(LOAN_REQUEST_REMARKS_MAX_LENGTH).optional(),
  attachment_file: z.string().trim().max(LOAN_REQUEST_ATTACHMENT_MAX_LENGTH).optional(),
  // Only present so callers that already have a status value in hand (e.g.
  // the payroll-run batch flow, same shape leaveRequest's
  // createLeaveRequestSchema allows via `status`) can set it explicitly.
  // The service still defaults to Pending when omitted.
  status: z
    .union([
      z.literal(LOAN_REQUEST_STATUS.PENDING),
      z.literal(LOAN_REQUEST_STATUS.APPROVED),
      z.literal(LOAN_REQUEST_STATUS.REJECTED),
    ])
    .optional(),
});

export type CreateLoanRequestInput = z.infer<typeof createLoanRequestSchema>;

// ─── Update Loan Request (core fields) ──────────────────────────────────────
export const updateLoanRequestSchema = createLoanRequestSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the loan request",
  });

export type UpdateLoanRequestInput = z.infer<typeof updateLoanRequestSchema>;

// ─── Change status (Approve / Reject / back to Pending) ────────────────────
export const changeLoanRequestStatusSchema = z.object({
  status: z.union([
    z.literal(LOAN_REQUEST_STATUS.PENDING),
    z.literal(LOAN_REQUEST_STATUS.APPROVED),
    z.literal(LOAN_REQUEST_STATUS.REJECTED),
  ], { error: "Status is required" }),
  remarks: z.string().trim().max(LOAN_REQUEST_REMARKS_MAX_LENGTH).optional(),
});

export type ChangeLoanRequestStatusInput = z.infer<typeof changeLoanRequestStatusSchema>;

// ─── :id route param ─────────────────────────────────────────────────────────
export const loanRequestIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Loan request id must be a number" })
    .int()
    .positive("Loan request id must be a valid integer"),
});

// ─── GET /loan-requests query params ────────────────────────────────────────
export const listLoanRequestsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  staff_id: z.coerce.number().int().positive().optional(),
  branch_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  status: z
    .union([
      z.literal(LOAN_REQUEST_STATUS.PENDING),
      z.literal(LOAN_REQUEST_STATUS.APPROVED),
      z.literal(LOAN_REQUEST_STATUS.REJECTED),
    ])
    .optional(),
});
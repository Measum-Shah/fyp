import { z } from "zod";
import { LOAN_PLAN_FIELD_MAX_LENGTH } from "../constants/loanPlan.constants";

const requiredField = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(LOAN_PLAN_FIELD_MAX_LENGTH, `${label} must be at most ${LOAN_PLAN_FIELD_MAX_LENGTH} characters`);

// ─── Create Loan Plan ─────────────────────────────────────────────────────────
// loan_plan_id is never accepted from the client — computed server-side
// (see loanPlan.service.ts) since this table has no autoincrement.
export const createLoanPlanSchema = z.object({
  loan_installment: requiredField("Installment"),
  tenure: requiredField("Tenure"),
  extra_pay: requiredField("Extra pay"),
});

export type CreateLoanPlanInput = z.infer<typeof createLoanPlanSchema>;

// ─── Update Loan Plan (partial, but body cannot be empty) ───────────────────
export const updateLoanPlanSchema = createLoanPlanSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the loan plan",
  });

export type UpdateLoanPlanInput = z.infer<typeof updateLoanPlanSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const loanPlanIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Loan plan id must be a number" })
    .int()
    .positive("Loan plan id must be a valid integer"),
});

// ─── GET /loan-plans query params ───────────────────────────────────────────
export const listLoanPlansQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
});

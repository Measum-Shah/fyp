import { z } from "zod";
import { LOAN_TYPE_DESCRIPTION_MAX_LENGTH, LOAN_TYPE_NAME_MAX_LENGTH } from "../constants/loanType.constants";

// ─── Create Loan Type ─────────────────────────────────────────────────────────
// loan_id is never accepted from the client — it's computed server-side
// (see loanType.service.ts) since this table has no autoincrement.
export const createLoanTypeSchema = z.object({
  loan_type: z
    .string({ error: "Loan type name is required" })
    .trim()
    .min(1, "Loan type name is required")
    .max(LOAN_TYPE_NAME_MAX_LENGTH, `Loan type name must be at most ${LOAN_TYPE_NAME_MAX_LENGTH} characters`),
  description: z
    .string({ error: "Description is required" })
    .trim()
    .min(1, "Description is required")
    .max(LOAN_TYPE_DESCRIPTION_MAX_LENGTH, `Description must be at most ${LOAN_TYPE_DESCRIPTION_MAX_LENGTH} characters`),
});

export type CreateLoanTypeInput = z.infer<typeof createLoanTypeSchema>;

// ─── Update Loan Type (partial, but body cannot be empty) ───────────────────
export const updateLoanTypeSchema = createLoanTypeSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the loan type",
  });

export type UpdateLoanTypeInput = z.infer<typeof updateLoanTypeSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const loanTypeIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Loan type id must be a number" })
    .int()
    .positive("Loan type id must be a valid integer"),
});

// ─── GET /loan-types query params ───────────────────────────────────────────
export const listLoanTypesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
});

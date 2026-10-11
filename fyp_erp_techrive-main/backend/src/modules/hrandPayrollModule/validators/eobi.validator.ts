import { z } from "zod";
import { EOBI_STATUS } from "../constants/eobi.constants";

// ─── Create EOBI/EPF Register Entry ─────────────────────────────────────────
// Field order mirrors the Add Entry form: Employee → Campus (branch) →
// School (company) → EOBI Amount → EPF Amount → Status.
export const createEobiEntrySchema = z.object({
  staff_id: z.coerce
    .number({ error: "Employee is required" })
    .int()
    .positive("Employee must reference a valid staff id"),
  branch_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  eobi_amount: z.coerce
    .number({ error: "EOBI Amount is required" })
    .int()
    .positive("EOBI Amount must be greater than 0"),
  epf_amount: z.coerce
    .number({ error: "EPF Amount is required" })
    .int()
    .positive("EPF Amount must be greater than 0"),
  status: z
    .union([z.literal(EOBI_STATUS.PENDING), z.literal(EOBI_STATUS.PAID), z.literal(EOBI_STATUS.OVERDUE)])
    .optional(),
});

export type CreateEobiEntryInput = z.infer<typeof createEobiEntrySchema>;

// ─── Update EOBI/EPF Register Entry (partial, but body cannot be empty) ────
export const updateEobiEntrySchema = createEobiEntrySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the register entry",
  });

export type UpdateEobiEntryInput = z.infer<typeof updateEobiEntrySchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const eobiEntryIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Register entry id must be a number" })
    .int()
    .positive("Register entry id must be a valid integer"),
});

// ─── GET /eobi-register query params ────────────────────────────────────────
export const listEobiEntriesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  staff_id: z.coerce.number().int().positive().optional(),
  branch_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  status: z
    .union([z.literal(EOBI_STATUS.PENDING), z.literal(EOBI_STATUS.PAID), z.literal(EOBI_STATUS.OVERDUE)])
    .optional(),
});
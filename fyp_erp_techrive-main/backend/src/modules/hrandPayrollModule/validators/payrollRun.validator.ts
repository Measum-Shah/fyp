import { z } from "zod";
import { MONTH_YEAR_REGEX } from "../constants/payrollRun.constants";

const positiveId = (label: string) =>
  z.coerce.number({ error: `${label} is required` }).int().positive(`${label} must be a valid id`);

// ─── Eligible staff for a run ────────────────────────────────────────────────
export const eligibleStaffQuerySchema = z.object({
  branch_id: positiveId("Branch"),
  company_id: z.coerce.number().int().positive().optional(),
  month_year: z
    .string({ error: "Month/Year is required" })
    .trim()
    .regex(MONTH_YEAR_REGEX, "Month/Year must be in YYYY-MM format"),
});

// ─── Create Payroll Run (batch-generate salary sheets) ──────────────────────
export const createPayrollRunSchema = z.object({
  branch_id: positiveId("Branch"),
  company_id: z.coerce.number().int().positive().optional(),
  month_year: z
    .string({ error: "Month/Year is required" })
    .trim()
    .regex(MONTH_YEAR_REGEX, "Month/Year must be in YYYY-MM format"),
  ledger_id: positiveId("Ledger id"),
  financial_year: positiveId("Financial year"),
  staff_ids: z
    .array(z.coerce.number().int().positive())
    .min(1, "Select at least one employee to run payroll for"),
});

export type CreatePayrollRunInput = z.infer<typeof createPayrollRunSchema>;

// ─── List a run's members ────────────────────────────────────────────────────
export const listPayrollRunQuerySchema = z.object({
  branch_id: positiveId("Branch"),
  company_id: z.coerce.number().int().positive().optional(),
  month_year: z
    .string({ error: "Month/Year is required" })
    .trim()
    .regex(MONTH_YEAR_REGEX, "Month/Year must be in YYYY-MM format"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(200).optional().default(100),
});

// ─── :id route param (a single payroll_employees row) ───────────────────────
export const payrollRunMemberIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Payroll run member id must be a number" })
    .int()
    .positive("Payroll run member id must be a valid integer"),
});

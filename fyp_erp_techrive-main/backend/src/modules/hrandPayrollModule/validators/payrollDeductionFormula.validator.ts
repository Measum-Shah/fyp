import { z } from "zod";
import {
  DEDUCTION_FORMULA_BASE_TYPE,
  DEDUCTION_FORMULA_DIVISOR_TYPE,
  DEDUCTION_FORMULA_NAME_MAX_LENGTH,
  DEDUCTION_FORMULA_STATUS,
} from "../constants/payrollDeductionFormula.constants";

const baseTypeField = z.union([
  z.literal(DEDUCTION_FORMULA_BASE_TYPE.BASIC_SALARY),
  z.literal(DEDUCTION_FORMULA_BASE_TYPE.GROSS_SALARY),
]);

const divisorTypeField = z.union([
  z.literal(DEDUCTION_FORMULA_DIVISOR_TYPE.CALENDAR_DAYS_IN_MONTH),
  z.literal(DEDUCTION_FORMULA_DIVISOR_TYPE.FIXED_30),
]);

export const createDeductionFormulaSchema = z.object({
  name: z
    .string({ error: "Formula name is required" })
    .trim()
    .min(1, "Formula name is required")
    .max(
      DEDUCTION_FORMULA_NAME_MAX_LENGTH,
      `Formula name must be at most ${DEDUCTION_FORMULA_NAME_MAX_LENGTH} characters`
    ),
  base_type: baseTypeField.optional(),
  divisor_type: divisorTypeField.optional(),
  // Making a formula the default is a deliberate, explicit action (it's
  // what payroll actually uses) — never silently defaulted true on create.
  is_default: z.union([z.literal(0), z.literal(1)]).optional(),
  status: z
    .union([z.literal(DEDUCTION_FORMULA_STATUS.ACTIVE), z.literal(DEDUCTION_FORMULA_STATUS.INACTIVE)])
    .optional(),
});

export type CreateDeductionFormulaInput = z.infer<typeof createDeductionFormulaSchema>;

export const updateDeductionFormulaSchema = createDeductionFormulaSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the deduction formula",
  });

export type UpdateDeductionFormulaInput = z.infer<typeof updateDeductionFormulaSchema>;

export const deductionFormulaIdParamSchema = z.object({
  id: z
    .coerce.number({ error: "Deduction formula id must be a number" })
    .int()
    .positive("Deduction formula id must be a valid integer"),
});

export const listDeductionFormulasQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  status: z.coerce.number().int().optional(),
});

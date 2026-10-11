import { z } from "zod";
import {
  ALLOWANCE_CALCULATION_TYPE,
  ALLOWANCE_TYPE_CODE_MAX_LENGTH,
  ALLOWANCE_TYPE_NAME_MAX_LENGTH,
  ALLOWANCE_TYPE_STATUS,
} from "../constants/allowanceType.constants";

const calculationTypeField = z.union([
  z.literal(ALLOWANCE_CALCULATION_TYPE.FIXED),
  z.literal(ALLOWANCE_CALCULATION_TYPE.PERCENTAGE),
]);

export const createAllowanceTypeSchema = z.object({
  name: z
    .string({ error: "Allowance name is required" })
    .trim()
    .min(1, "Allowance name is required")
    .max(ALLOWANCE_TYPE_NAME_MAX_LENGTH, `Allowance name must be at most ${ALLOWANCE_TYPE_NAME_MAX_LENGTH} characters`),
  code: z.string().trim().max(ALLOWANCE_TYPE_CODE_MAX_LENGTH).optional(),
  calculation_type: calculationTypeField.optional(),
  default_value: z.coerce.number({ error: "Default value is required" }).min(0),
  is_taxable: z.union([z.literal(0), z.literal(1)]).optional(),
  status: z.union([z.literal(ALLOWANCE_TYPE_STATUS.ACTIVE), z.literal(ALLOWANCE_TYPE_STATUS.INACTIVE)]).optional(),
});

export type CreateAllowanceTypeInput = z.infer<typeof createAllowanceTypeSchema>;

export const updateAllowanceTypeSchema = createAllowanceTypeSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the allowance type",
  });

export type UpdateAllowanceTypeInput = z.infer<typeof updateAllowanceTypeSchema>;

export const allowanceTypeIdParamSchema = z.object({
  id: z.coerce.number({ error: "Allowance type id must be a number" }).int().positive("Allowance type id must be a valid integer"),
});

export const listAllowanceTypesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  status: z.coerce.number().int().optional(),
});

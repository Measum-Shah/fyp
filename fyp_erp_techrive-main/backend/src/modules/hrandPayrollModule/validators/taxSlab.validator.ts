import { z } from "zod";
import { TAX_SLAB_STATUS } from "../constants/taxSlab.constants";

const positiveId = (label: string) =>
  z.coerce.number({ error: `${label} is required` }).int().positive(`${label} must be a valid id`);

export const createTaxSlabSchema = z
  .object({
    fiscal_year_id: positiveId("Fiscal year"),
    slab_order: z.coerce.number().int().positive().optional(),
    min_amount: z.coerce.number({ error: "Minimum amount is required" }).min(0),
    max_amount: z.coerce.number().min(0).nullable().optional(),
    fixed_amount: z.coerce.number({ error: "Fixed amount is required" }).min(0),
    tax_percent: z.coerce.number({ error: "Tax percent is required" }).min(0).max(100),
    status: z.union([z.literal(TAX_SLAB_STATUS.ACTIVE), z.literal(TAX_SLAB_STATUS.INACTIVE)]).optional(),
  })
  .refine((data) => data.max_amount === undefined || data.max_amount === null || data.max_amount > data.min_amount, {
    message: "Maximum amount must be greater than minimum amount",
    path: ["max_amount"],
  });

export type CreateTaxSlabInput = z.infer<typeof createTaxSlabSchema>;

export const updateTaxSlabSchema = z
  .object({
    fiscal_year_id: positiveId("Fiscal year").optional(),
    slab_order: z.coerce.number().int().positive().optional(),
    min_amount: z.coerce.number().min(0).optional(),
    max_amount: z.coerce.number().min(0).nullable().optional(),
    fixed_amount: z.coerce.number().min(0).optional(),
    tax_percent: z.coerce.number().min(0).max(100).optional(),
    status: z.union([z.literal(TAX_SLAB_STATUS.ACTIVE), z.literal(TAX_SLAB_STATUS.INACTIVE)]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the tax slab",
  })
  .refine(
    (data) =>
      data.max_amount === undefined ||
      data.max_amount === null ||
      data.min_amount === undefined ||
      data.max_amount > data.min_amount,
    { message: "Maximum amount must be greater than minimum amount", path: ["max_amount"] }
  );

export type UpdateTaxSlabInput = z.infer<typeof updateTaxSlabSchema>;

export const taxSlabIdParamSchema = z.object({
  id: z.coerce.number({ error: "Tax slab id must be a number" }).int().positive("Tax slab id must be a valid integer"),
});

export const listTaxSlabsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  fiscal_year_id: z.coerce.number().int().positive().optional(),
  status: z.coerce.number().int().optional(),
});

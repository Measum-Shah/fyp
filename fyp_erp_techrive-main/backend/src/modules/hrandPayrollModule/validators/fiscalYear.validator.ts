import { z } from "zod";
import { DATE_REGEX } from "../constants/employee.constants";
import { FISCAL_YEAR_NAME_MAX_LENGTH, FISCAL_YEAR_STATUS } from "../constants/fiscalYear.constants";

const dateField = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .regex(DATE_REGEX, `${label} must be in YYYY-MM-DD format`)
    .refine((val) => !Number.isNaN(new Date(val).getTime()), { message: `${label} must be valid` });

export const createFiscalYearSchema = z
  .object({
    name: z
      .string({ error: "Name is required" })
      .trim()
      .min(1, "Name is required")
      .max(FISCAL_YEAR_NAME_MAX_LENGTH, `Name must be at most ${FISCAL_YEAR_NAME_MAX_LENGTH} characters`),
    start_date: dateField("Start date"),
    end_date: dateField("End date"),
    status: z.union([z.literal(FISCAL_YEAR_STATUS.ACTIVE), z.literal(FISCAL_YEAR_STATUS.INACTIVE)]).optional(),
  })
  .refine((data) => new Date(data.end_date) > new Date(data.start_date), {
    message: "End date must be after start date",
    path: ["end_date"],
  });

export type CreateFiscalYearInput = z.infer<typeof createFiscalYearSchema>;

export const updateFiscalYearSchema = z
  .object({
    name: z.string().trim().min(1).max(FISCAL_YEAR_NAME_MAX_LENGTH).optional(),
    start_date: dateField("Start date").optional(),
    end_date: dateField("End date").optional(),
    status: z.union([z.literal(FISCAL_YEAR_STATUS.ACTIVE), z.literal(FISCAL_YEAR_STATUS.INACTIVE)]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the fiscal year",
  })
  .refine(
    (data) => !(data.start_date && data.end_date) || new Date(data.end_date) > new Date(data.start_date),
    { message: "End date must be after start date", path: ["end_date"] }
  );

export type UpdateFiscalYearInput = z.infer<typeof updateFiscalYearSchema>;

export const fiscalYearIdParamSchema = z.object({
  id: z.coerce.number({ error: "Fiscal year id must be a number" }).int().positive("Fiscal year id must be a valid integer"),
});

export const listFiscalYearsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  status: z.coerce.number().int().optional(),
});

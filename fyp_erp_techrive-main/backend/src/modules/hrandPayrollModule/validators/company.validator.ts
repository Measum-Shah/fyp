import { z } from "zod";
import { PHONE_REGEX } from "../constants/employee.constants";
import {
  COMPANY_ADDRESS_MAX_LENGTH,
  COMPANY_DESCRIPTION_MAX_LENGTH,
  COMPANY_FAX_MAX_LENGTH,
  COMPANY_GST_MAX_LENGTH,
  COMPANY_GST_TYPE_MAX_LENGTH,
  COMPANY_LOGO_MAX_LENGTH,
  COMPANY_NAME_MAX_LENGTH,
  COMPANY_NTN_MAX_LENGTH,
  COMPANY_PHONE_MAX_LENGTH,
  COMPANY_STATUS,
  COMPANY_VAT_MAX_LENGTH,
} from "../constants/company.constants";

// ─── Create Company ───────────────────────────────────────────────────────────
// phone/fax are nullable, optional columns on erp_companies (unlike Branch,
// where they're required), so both are optional here — but PHONE_REGEX still
// applies whenever a value is actually provided.
export const createCompanySchema = z.object({
  name: z
    .string({ error: "School / University name is required" })
    .trim()
    .min(1, "School / University name is required")
    .max(COMPANY_NAME_MAX_LENGTH, `School / University name must be at most ${COMPANY_NAME_MAX_LENGTH} characters`),
  description: z.string().trim().max(COMPANY_DESCRIPTION_MAX_LENGTH).optional(),
  ntn: z.string().trim().max(COMPANY_NTN_MAX_LENGTH).optional(),
  gst: z.string().trim().max(COMPANY_GST_MAX_LENGTH).optional(),
  gst_type: z.string().trim().max(COMPANY_GST_TYPE_MAX_LENGTH).optional(),
  vat: z.string().trim().max(COMPANY_VAT_MAX_LENGTH).optional(),
  phone: z
    .string()
    .trim()
    .max(COMPANY_PHONE_MAX_LENGTH)
    .optional()
    .refine((val) => !val || PHONE_REGEX.test(val), "Phone number format is invalid"),
  fax: z
    .string()
    .trim()
    .max(COMPANY_FAX_MAX_LENGTH)
    .optional()
    .refine((val) => !val || PHONE_REGEX.test(val), "Fax number format is invalid"),
  address: z.string().trim().max(COMPANY_ADDRESS_MAX_LENGTH).optional(),
  logo: z.string().trim().max(COMPANY_LOGO_MAX_LENGTH).optional(),
  status: z.union([z.literal(COMPANY_STATUS.ACTIVE), z.literal(COMPANY_STATUS.INACTIVE)]).optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

// ─── Update Company (partial, but body cannot be empty) ─────────────────────
export const updateCompanySchema = createCompanySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the school / university",
  });

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const companyIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "School / University id must be a number" })
    .int("School / University id must be a valid integer")
    .positive("School / University id must be a valid integer"),
});

// ─── GET /companies query params ────────────────────────────────────────────
export const listCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  status: z.coerce.number().int().optional(),
});
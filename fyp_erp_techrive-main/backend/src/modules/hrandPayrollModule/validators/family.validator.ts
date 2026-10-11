import { z } from "zod";
import {
  FAMILY_CNIC_MAX_LENGTH,
  FAMILY_GENDER_MAX_LENGTH,
  FAMILY_NAME_MAX_LENGTH,
  FAMILY_PHONE_MAX_LENGTH,
  FAMILY_RELATION_MAX_LENGTH,
  FAMILY_WORKPLACE_MAX_LENGTH,
} from "../constants/family.constants";

// Only Employee, Name, Relation, and Phone are required. Gender, CNIC, and
// Workplace are optional — omitted/blank values are normalized to an empty
// string by the service layer, since `staff_families` keeps these columns
// as NOT NULL VARCHAR and doesn't need a schema change to support "no value".
export const createFamilySchema = z.object({
  staff_id: z.coerce.number({ error: "Employee is required" }).int().positive("Employee must reference a valid staff id"),
  name: z.string({ error: "Name is required" }).trim().min(1).max(FAMILY_NAME_MAX_LENGTH),
  relation: z.string({ error: "Relation is required" }).trim().min(1).max(FAMILY_RELATION_MAX_LENGTH),
  phone: z.string({ error: "Phone is required" }).trim().min(1).max(FAMILY_PHONE_MAX_LENGTH),
  gender: z.string().trim().max(FAMILY_GENDER_MAX_LENGTH).optional(),
  cnic: z.string().trim().max(FAMILY_CNIC_MAX_LENGTH).optional(),
  workplace: z.string().trim().max(FAMILY_WORKPLACE_MAX_LENGTH).optional(),
});

export type CreateFamilyInput = z.infer<typeof createFamilySchema>;

export const updateFamilySchema = createFamilySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided to update the family record" });

export type UpdateFamilyInput = z.infer<typeof updateFamilySchema>;

export const familyIdParamSchema = z.object({
  id: z.coerce.number({ error: "Family record id must be a number" }).int().positive("Family record id must be a valid integer"),
});

export const listFamiliesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  staff_id: z.coerce.number().int().positive().optional(),
});
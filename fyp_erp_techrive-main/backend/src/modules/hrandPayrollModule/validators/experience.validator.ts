import { z } from "zod";
import { DATE_REGEX } from "../constants/employee.constants";
import { EXPERIENCE_DESIGNATION_MAX_LENGTH, EXPERIENCE_NAME_MAX_LENGTH } from "../constants/experience.constants";

export const createExperienceSchema = z
  .object({
    staff_id: z.coerce
      .number({ error: "Employee is required" })
      .int()
      .positive("Employee must reference a valid staff id"),
    name: z
      .string({ error: "Company/employer name is required" })
      .trim()
      .min(1, "Company/employer name is required")
      .max(EXPERIENCE_NAME_MAX_LENGTH, `Company/employer name must be at most ${EXPERIENCE_NAME_MAX_LENGTH} characters`),
    designation: z
      .string({ error: "Designation is required" })
      .trim()
      .min(1, "Designation is required")
      .max(EXPERIENCE_DESIGNATION_MAX_LENGTH, `Designation must be at most ${EXPERIENCE_DESIGNATION_MAX_LENGTH} characters`),
    from_date: z
      .string({ error: "From date is required" })
      .trim()
      .regex(DATE_REGEX, "From date must be in YYYY-MM-DD format"),
    to_date: z
      .string({ error: "To date is required" })
      .trim()
      .regex(DATE_REGEX, "To date must be in YYYY-MM-DD format"),
  })
  .refine((data) => new Date(data.to_date) >= new Date(data.from_date), {
    message: "To date must be on or after From date",
    path: ["to_date"],
  });

export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;

export const updateExperienceSchema = z
  .object({
    staff_id: z.coerce.number().int().positive().optional(),
    name: z.string().trim().min(1).max(EXPERIENCE_NAME_MAX_LENGTH).optional(),
    designation: z.string().trim().min(1).max(EXPERIENCE_DESIGNATION_MAX_LENGTH).optional(),
    from_date: z.string().trim().regex(DATE_REGEX).optional(),
    to_date: z.string().trim().regex(DATE_REGEX).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the experience record",
  });

export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;

export const experienceIdParamSchema = z.object({
  id: z.coerce.number({ error: "Experience id must be a number" }).int().positive("Experience id must be a valid integer"),
});

export const listExperiencesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  staff_id: z.coerce.number().int().positive().optional(),
});

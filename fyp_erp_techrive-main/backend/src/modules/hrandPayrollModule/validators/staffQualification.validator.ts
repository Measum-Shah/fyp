import { z } from "zod";
import {
  STAFF_QUALIFICATION_ATTACHMENT_MAX_LENGTH,
  STAFF_QUALIFICATION_BOARD_MAX_LENGTH,
  STAFF_QUALIFICATION_DEGREE_MAX_LENGTH,
  STAFF_QUALIFICATION_GRADE_MAX_LENGTH,
  STAFF_QUALIFICATION_INSTITUTE_MAX_LENGTH,
  STAFF_QUALIFICATION_STATUS,
} from "../constants/staffQualification.constants";

// ─── Create Staff Qualification ───────────────────────────────────────────────
export const createStaffQualificationSchema = z.object({
  staff_id: z.coerce
    .number({ error: "Employee is required" })
    .int("Employee id must be a valid integer")
    .positive("Employee id must be a valid integer"),
  degree: z
    .string({ error: "Degree/qualification name is required" })
    .trim()
    .min(1, "Degree/qualification name is required")
    .max(STAFF_QUALIFICATION_DEGREE_MAX_LENGTH),
  institute: z.string().trim().max(STAFF_QUALIFICATION_INSTITUTE_MAX_LENGTH).optional(),
  board_or_university: z.string().trim().max(STAFF_QUALIFICATION_BOARD_MAX_LENGTH).optional(),
  passing_year: z.coerce
    .number()
    .int("Passing year must be a valid year")
    .min(1950, "Passing year must be valid")
    .max(new Date().getFullYear() + 1, "Passing year cannot be in the future")
    .optional(),
  grade_or_cgpa: z.string().trim().max(STAFF_QUALIFICATION_GRADE_MAX_LENGTH).optional(),
  attachment: z.string().trim().max(STAFF_QUALIFICATION_ATTACHMENT_MAX_LENGTH).optional(),
  status: z
    .union([z.literal(STAFF_QUALIFICATION_STATUS.ACTIVE), z.literal(STAFF_QUALIFICATION_STATUS.INACTIVE)])
    .optional(),
});

export type CreateStaffQualificationInput = z.infer<typeof createStaffQualificationSchema>;

// ─── Update Staff Qualification (partial, but body cannot be empty) ─────────
export const updateStaffQualificationSchema = createStaffQualificationSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the qualification",
  });

export type UpdateStaffQualificationInput = z.infer<typeof updateStaffQualificationSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const staffQualificationIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Qualification id must be a number" })
    .int("Qualification id must be a valid integer")
    .positive("Qualification id must be a valid integer"),
});

// ─── GET /staff-qualifications query params ─────────────────────────────────
export const listStaffQualificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  staff_id: z.coerce.number().int().positive().optional(),
  status: z.coerce.number().int().optional(),
});

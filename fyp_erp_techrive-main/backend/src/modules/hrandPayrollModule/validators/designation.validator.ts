import { z } from "zod";
import { DESIGNATION_DESCRIPTION_MAX_LENGTH, DESIGNATION_NAME_MAX_LENGTH } from "../constants/designation.constants";

// ─── Create Designation ──────────────────────────────────────────────────────
// Parent Designation has been removed — the form (and this schema) now only
// accepts name + an optional free-text description.
export const createDesignationSchema = z.object({
  name: z
    .string({ error: "Designation name is required" })
    .trim()
    .min(1, "Designation name is required")
    .max(
      DESIGNATION_NAME_MAX_LENGTH,
      `Name must be at most ${DESIGNATION_NAME_MAX_LENGTH} characters`
    ),
  description: z
    .string()
    .trim()
    .max(DESIGNATION_DESCRIPTION_MAX_LENGTH, `Description must be at most ${DESIGNATION_DESCRIPTION_MAX_LENGTH} characters`)
    .optional(),
});

export type CreateDesignationInput = z.infer<typeof createDesignationSchema>;

// ─── Update Designation (partial, but body cannot be empty) ────────────────
export const updateDesignationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Designation name is required")
      .max(DESIGNATION_NAME_MAX_LENGTH, `Name must be at most ${DESIGNATION_NAME_MAX_LENGTH} characters`)
      .optional(),
    description: z
      .string()
      .trim()
      .max(DESIGNATION_DESCRIPTION_MAX_LENGTH, `Description must be at most ${DESIGNATION_DESCRIPTION_MAX_LENGTH} characters`)
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the designation",
  });

export type UpdateDesignationInput = z.infer<typeof updateDesignationSchema>;

// ─── :id route param ─────────────────────────────────────────────────────────
export const designationIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Designation id must be a number" })
    .int("Designation id must be a valid integer")
    .positive("Designation id must be a valid integer"),
});

// ─── GET /designations query params ─────────────────────────────────────────
export const listDesignationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
});
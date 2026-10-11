import { z } from "zod";
import {
  STAFF_TYPE_CODE_MAX_LENGTH,
  STAFF_TYPE_DESCRIPTION_MAX_LENGTH,
  STAFF_TYPE_NAME_MAX_LENGTH,
} from "../constants/staffType.constants";

// ─── Create Staff Type ───────────────────────────────────────────────────────
export const createStaffTypeSchema = z.object({
  name: z
    .string({ error: "Staff type name is required" })
    .trim()
    .min(1, "Staff type name is required")
    .max(STAFF_TYPE_NAME_MAX_LENGTH, `Name must be at most ${STAFF_TYPE_NAME_MAX_LENGTH} characters`),
  staff_type_code: z
    .string({ error: "Staff type code is required" })
    .trim()
    .min(1, "Staff type code is required")
    .max(
      STAFF_TYPE_CODE_MAX_LENGTH,
      `Code must be at most ${STAFF_TYPE_CODE_MAX_LENGTH} characters`
    ),
  description: z
    .string()
    .trim()
    .max(
      STAFF_TYPE_DESCRIPTION_MAX_LENGTH,
      `Description must be at most ${STAFF_TYPE_DESCRIPTION_MAX_LENGTH} characters`
    )
    .optional(),
  // Optional — the service assigns the next available position (max + 1)
  // when omitted, so most callers never need to set this by hand.
  sequence_id: z.coerce.number().int().optional(),
});

export type CreateStaffTypeInput = z.infer<typeof createStaffTypeSchema>;

// ─── Update Staff Type (partial, but body cannot be empty) ─────────────────
export const updateStaffTypeSchema = createStaffTypeSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the staff type",
  });

export type UpdateStaffTypeInput = z.infer<typeof updateStaffTypeSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const staffTypeIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Staff type id must be a number" })
    .int("Staff type id must be a valid integer")
    .positive("Staff type id must be a valid integer"),
});

// ─── GET /staff-types query params ──────────────────────────────────────────
export const listStaffTypesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
});

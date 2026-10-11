import { z } from "zod";
import { ACKNOWLEDGE_STATUS, TERMINATION_REASON_MAX_LENGTH } from "../constants/termination.constants";

// ─── Create Termination ──────────────────────────────────────────────────────
// Creating a termination immediately flips the employee to Inactive (see
// termination.service.ts) — there is no draft/approval state for this one.
export const createTerminationSchema = z.object({
  staff_id: z.coerce
    .number({ error: "Employee is required" })
    .int()
    .positive("Employee must reference a valid staff id"),
  reason: z
    .string({ error: "Reason is required" })
    .trim()
    .min(1, "Reason is required")
    .max(TERMINATION_REASON_MAX_LENGTH, `Reason must be at most ${TERMINATION_REASON_MAX_LENGTH} characters`),
  warnings: z
    .string({ error: "Prior warnings summary is required" })
    .trim()
    .min(1, "Prior warnings summary is required"),
  acknowledge: z
    .union([z.literal(ACKNOWLEDGE_STATUS.NO), z.literal(ACKNOWLEDGE_STATUS.YES)])
    .optional(),
});

export type CreateTerminationInput = z.infer<typeof createTerminationSchema>;

// ─── Update Termination (partial, but body cannot be empty) ────────────────
// staff_id is intentionally excluded — it's the record's identity and the
// one thing createTermination has a real side effect around (deactivating
// that employee). Letting it be reassigned after the fact would silently
// leave the originally-terminated employee stuck Inactive with nothing
// pointing at why, while the newly-assigned employee's status never
// changes. Reassigning who a termination is about should be a
// delete-and-recreate, not an edit.
export const updateTerminationSchema = createTerminationSchema
  .omit({ staff_id: true })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the termination",
  });

export type UpdateTerminationInput = z.infer<typeof updateTerminationSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const terminationIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Termination id must be a number" })
    .int()
    .positive("Termination id must be a valid integer"),
});

// ─── GET /terminations query params ─────────────────────────────────────────
export const listTerminationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  staff_id: z.coerce.number().int().positive().optional(),
});
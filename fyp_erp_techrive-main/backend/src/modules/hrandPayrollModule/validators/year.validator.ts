import { z } from "zod";
import { YEAR_MAX, YEAR_MIN, YEAR_STATUS } from "../constants/year.constants";

// Create takes the year number itself as `year` — the DB `id`/`title` are
// both derived from it server-side (see year.constants.ts).
export const createYearSchema = z.object({
  year: z.coerce
    .number({ error: "Year is required" })
    .int("Year must be a whole number")
    .min(YEAR_MIN, `Year must be at least ${YEAR_MIN}`)
    .max(YEAR_MAX, `Year must be at most ${YEAR_MAX}`),
  status: z.union([z.literal(YEAR_STATUS.ACTIVE), z.literal(YEAR_STATUS.INACTIVE)]).optional(),
});

export type CreateYearInput = z.infer<typeof createYearSchema>;

// Update can only change status — the year number itself is the row's
// identity and isn't editable after creation (delete and recreate instead).
export const updateYearSchema = z
  .object({
    status: z.union([z.literal(YEAR_STATUS.ACTIVE), z.literal(YEAR_STATUS.INACTIVE)]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the year",
  });

export type UpdateYearInput = z.infer<typeof updateYearSchema>;

export const yearIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Year id must be a number" })
    .int("Year id must be a valid integer")
    .positive("Year id must be a valid integer"),
});

export const listYearsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  status: z.coerce.number().int().optional(),
});

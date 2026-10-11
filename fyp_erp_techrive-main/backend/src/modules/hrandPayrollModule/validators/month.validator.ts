import { z } from "zod";
import { MONTH_STATUS, MONTH_TITLE_MAX_LENGTH } from "../constants/month.constants";

export const createMonthSchema = z.object({
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(1, "Title is required")
    .max(MONTH_TITLE_MAX_LENGTH, `Title must be at most ${MONTH_TITLE_MAX_LENGTH} characters`),
  status: z.union([z.literal(MONTH_STATUS.ACTIVE), z.literal(MONTH_STATUS.INACTIVE)]).optional(),
});

export type CreateMonthInput = z.infer<typeof createMonthSchema>;

export const updateMonthSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(MONTH_TITLE_MAX_LENGTH, `Title must be at most ${MONTH_TITLE_MAX_LENGTH} characters`)
      .optional(),
    status: z.union([z.literal(MONTH_STATUS.ACTIVE), z.literal(MONTH_STATUS.INACTIVE)]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the month",
  });

export type UpdateMonthInput = z.infer<typeof updateMonthSchema>;

export const monthIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Month id must be a number" })
    .int("Month id must be a valid integer")
    .positive("Month id must be a valid integer"),
});

export const listMonthsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  status: z.coerce.number().int().optional(),
});

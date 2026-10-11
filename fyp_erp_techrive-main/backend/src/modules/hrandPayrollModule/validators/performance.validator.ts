import { z } from "zod";
import { PERFORMANCE_RATING, PERFORMANCE_STATUS } from "../constants/performance.constants";

const ratingField = (label: string) =>
  z.union(
    [
      z.literal(PERFORMANCE_RATING.EXCELLENT),
      z.literal(PERFORMANCE_RATING.GOOD),
      z.literal(PERFORMANCE_RATING.AVERAGE),
      z.literal(PERFORMANCE_RATING.POOR),
    ],
    { error: `${label} is required` }
  );

const MONTHS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"] as const;

// Simplified Performance Review form: Employee | Month | Date | Performance.
// The 5 legacy rating columns (lecture_deliver, confidence, punctuality,
// moral_values, student_feedback) are no longer accepted from the client —
// the service mirrors the single `performance` rating into all 5 so their
// NOT NULL DB columns stay satisfied without a schema migration.
export const createPerformanceSchema = z.object({
  staff_id: z.coerce.number({ error: "Employee is required" }).int().positive("Employee must reference a valid staff id"),
  month: z.enum(MONTHS, { error: "Month must be a valid two-digit month (01–12)" }),
  date: z.string({ error: "Date is required" }).trim().min(1, "Date is required").max(191),
  performance: ratingField("Performance"),
  status: z.union([z.literal(PERFORMANCE_STATUS.ACTIVE), z.literal(PERFORMANCE_STATUS.INACTIVE)]).optional(),
});

export type CreatePerformanceInput = z.infer<typeof createPerformanceSchema>;

export const updatePerformanceSchema = createPerformanceSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided to update the performance record" });

export type UpdatePerformanceInput = z.infer<typeof updatePerformanceSchema>;

export const performanceIdParamSchema = z.object({
  id: z.coerce.number({ error: "Performance record id must be a number" }).int().positive("Performance record id must be a valid integer"),
});

export const listPerformancesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  staff_id: z.coerce.number().int().positive().optional(),
  month: z.enum(MONTHS).optional(),
});
import { z } from "zod";

// ─── GET /activity-logs query params ─────────────────────────────────────
export const listActivityLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  user_id: z.coerce.number().int().positive().optional(),
  module: z.string().trim().max(100).optional(),
  action: z.string().trim().max(100).optional(),
  record_type: z.string().trim().max(100).optional(),
  record_id: z.string().trim().max(50).optional(),
  date_from: z.string().trim().optional(),
  date_to: z.string().trim().optional(),
  search: z.string().trim().max(191).optional(),
});

export type ListActivityLogsQuery = z.infer<typeof listActivityLogsQuerySchema>;

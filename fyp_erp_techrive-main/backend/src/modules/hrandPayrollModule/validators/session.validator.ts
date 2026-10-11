import { z } from "zod";
import { LOGIN_STATUS } from "../constants/sessionLog.constants";

// ─── GET /sessions query params ──────────────────────────────────────────
export const listSessionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  user_id: z.coerce.number().int().positive().optional(),
  is_active: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  login_status: z.enum([LOGIN_STATUS.SUCCESS, LOGIN_STATUS.FAILED]).optional(),
  search: z.string().trim().max(191).optional(),
});

export type ListSessionsQuery = z.infer<typeof listSessionsQuerySchema>;

// ─── :id route param (force logout) ──────────────────────────────────────
export const sessionIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Session id must be a number" })
    .int("Session id must be a valid integer")
    .positive("Session id must be a valid integer"),
});

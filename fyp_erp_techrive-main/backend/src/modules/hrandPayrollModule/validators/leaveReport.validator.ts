import { z } from "zod";
import { DATE_REGEX } from "../constants/employee.constants";

// ─── Leave Reports — Validators ─────────────────────────────────────────────
// Mirrors report.validator.ts's conventions exactly. Both reports here read
// from tables Leave Management already owns (erp_hrm_leave_requests,
// erp_hrm_leave_entitlements) — no new DB objects.

// ─── GET /reports/leave-requests ────────────────────────────────────────────
export const leaveRequestsReportQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  employee_id: z.coerce.number().int().positive().optional(),
  leave_type_id: z.coerce.number().int().positive().optional(),
  leave_status: z.coerce.number().int().positive().optional(),
  branch_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  // Filters on start_date falling within [from, to] — both optional and
  // independent, same as the rest of this endpoint's filters, so a caller
  // can pass just `from`, just `to`, both, or neither.
  from: z.string().trim().regex(DATE_REGEX, "From date must be in YYYY-MM-DD format").optional(),
  to: z.string().trim().regex(DATE_REGEX, "To date must be in YYYY-MM-DD format").optional(),
});

export type LeaveRequestsReportQuery = z.infer<typeof leaveRequestsReportQuerySchema>;

// ─── GET /reports/leave-balances ────────────────────────────────────────────
export const leaveBalancesReportQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  employee_id: z.coerce.number().int().positive().optional(),
  leave_type_id: z.coerce.number().int().positive().optional(),
});

export type LeaveBalancesReportQuery = z.infer<typeof leaveBalancesReportQuerySchema>;

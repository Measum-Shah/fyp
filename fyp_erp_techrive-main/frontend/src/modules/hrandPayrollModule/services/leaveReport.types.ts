// ─── Leave Reports — Shared Types ────────────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/leaveReport.service.ts
// field-for-field, same convention as report.types.ts.

import type { ApiEnvelope, PaginationMeta } from "./employee.types";

// ─── Leave Requests Report ───────────────────────────────────────────────────
export interface LeaveRequestReportRow {
  id: number;
  employee_id: number;
  employee_name: string;
  reg_no: string | null;
  leave_type_id: number;
  leave_type_name: string;
  branch_id: number;
  branch_name: string;
  leave_status_id: number;
  leave_status_name: string;
  start_date: string;
  end_date: string;
  total_days: number;
  applied_date: string;
  comments: string | null;
}

export interface LeaveRequestsReportParams {
  page?: number;
  limit?: number;
  search?: string;
  employee_id?: number;
  leave_type_id?: number;
  leave_status?: number;
  branch_id?: number;
  company_id?: number;
  from?: string;
  to?: string;
}

export type LeaveRequestsReportResponse = ApiEnvelope<LeaveRequestReportRow[]> & {
  meta: PaginationMeta;
};

// ─── Leave Balances Report ───────────────────────────────────────────────────
export interface LeaveBalanceReportRow {
  id: number;
  employee_id: number;
  employee_name: string;
  reg_no: string | null;
  leave_type_id: number;
  leave_type_name: string;
  no_of_days: number;
  days_used: number;
  remaining_days: number;
  start_date: string | null;
  end_date: string | null;
}

export interface LeaveBalancesReportParams {
  page?: number;
  limit?: number;
  employee_id?: number;
  leave_type_id?: number;
}

export type LeaveBalancesReportResponse = ApiEnvelope<LeaveBalanceReportRow[]> & {
  meta: PaginationMeta;
};

// ─── Attendance Reports — Shared Types ───────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/attendanceReport.service.ts
// field-for-field.

import type { ApiEnvelope, PaginationMeta } from "./employee.types";

// ─── Attendance Records Report ───────────────────────────────────────────────
export interface AttendanceRecordReportRow {
  id: number;
  employee_id: number;
  employee_name: string;
  reg_no: string | null;
  branch_id: number | null;
  branch_name: string;
  attendance_date: string | null;
  status_id: number;
  status_title: string;
  time_in: string | null;
  time_out: string | null;
  remarks: string | null;
}

export interface AttendanceRecordsReportParams {
  page?: number;
  limit?: number;
  employee_id?: number;
  branch_id?: number;
  company_id?: number;
  status?: number;
  from?: string;
  to?: string;
}

export type AttendanceRecordsReportResponse = ApiEnvelope<AttendanceRecordReportRow[]> & {
  meta: PaginationMeta;
};

// ─── Attendance Summary Report ───────────────────────────────────────────────
export interface AttendanceSummaryReportRow {
  id: number;
  employee_id: number;
  employee_name: string;
  reg_no: string | null;
  branch_id: number;
  branch_name: string;
  month_id: number;
  month_title: string;
  year_id: number;
  year_title: string;
  total_absents: number | null;
  pay_status: string;
  approved_status: string | null;
}

export interface AttendanceSummaryReportParams {
  page?: number;
  limit?: number;
  staff_id?: number;
  branch_id?: number;
  company_id?: number;
  month_id?: number;
  year_id?: number;
  pay_status?: string;
  approved_status?: string;
}

export type AttendanceSummaryReportResponse = ApiEnvelope<AttendanceSummaryReportRow[]> & {
  meta: PaginationMeta;
};

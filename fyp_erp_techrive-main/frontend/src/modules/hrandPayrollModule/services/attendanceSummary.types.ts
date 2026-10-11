import type { ApprovedStatus, PayStatus } from "./attendanceSummary.constants";

export interface SummaryEmployee {
  id: number;
  name: string;
  reg_no: string | null;
}

export interface AttendanceSummary {
  id: number;
  branch_id: number;
  staff_id: number;
  employee: SummaryEmployee | null;
  month_id: number;
  month_title: string | null;
  year_id: number;
  year_title: string | null;
  total_absents: number | null;
  remarks: string | null;
  pay_status: string;
  approved_status: string | null;
  approved_by: string | null;
  approved_by_employee_id: number | null;
  approved_by_designation_id: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateAttendanceSummaryPayload {
  branch_id: number;
  staff_id: number;
  month_id: number;
  year_id: number;
  total_absents?: number;
  remarks?: string;
  pay_status: PayStatus;
}

export interface UpdateAttendanceSummaryPayload {
  total_absents?: number;
  remarks?: string;
  pay_status?: PayStatus;
}

export interface SetApprovalPayload {
  approved_status: ApprovedStatus;
  approved_by_employee_id: number;
  approved_by_designation_id: number;
}

export interface AttendanceSummaryFormValues {
  branch_id: string;
  staff_id: string;
  employee_label: string;
  month_id: string;
  year_id: string;
  total_absents: string;
  remarks: string;
  pay_status: string;
}

export const EMPTY_ATTENDANCE_SUMMARY_FORM_VALUES: AttendanceSummaryFormValues = {
  branch_id: "",
  staff_id: "",
  employee_label: "",
  month_id: "",
  year_id: "",
  total_absents: "0",
  remarks: "",
  pay_status: "",
};

export interface AttendanceSummaryDayDetail {
  date: string; // "YYYY-MM-DD"
  day_name: string;
  status_id: number | null;
  status_title: string | null;
  status_display_class: string | null;
  time_in: string | null;
  time_out: string | null;
  remarks: string | null;
}

export interface AttendanceSummaryLeaveStats {
  total_leave_days: number;
  paid_leave_days: number;
  unpaid_leave_days: number;
}

export interface AttendanceSummaryDetail {
  summary: AttendanceSummary;
  days: AttendanceSummaryDayDetail[];
  leave_stats: AttendanceSummaryLeaveStats;
}

export interface ListAttendanceSummariesParams {
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
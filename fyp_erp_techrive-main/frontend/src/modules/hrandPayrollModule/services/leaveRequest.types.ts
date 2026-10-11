// ─── Leave Request — Types ───────────────────────────────────────────────────
// Mirrors backend leaveRequest.service.ts (leaveRequestSelect) and
// validators/leaveRequest.validator.ts field-for-field. Excludes the legacy
// multi-day partial-pattern columns (work_shift_data, partial_days,
// all_days_*, starting_*, ending_*) — see leaveRequest.constants.ts on the
// backend for why.

export const LEAVE_REQUEST_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

export const LEAVE_REQUEST_SINGLE_DURATION_OPTIONS = [
  "Full Day",
  "First Half",
  "Second Half",
  "Hourly",
] as const;
export type LeaveRequestSingleDuration = (typeof LEAVE_REQUEST_SINGLE_DURATION_OPTIONS)[number];

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type_id: number;
  branch_id: number;
  leave_status: number;
  start_date: string;
  end_date: string;
  total_days: number;
  applied_date: string;
  comments: string | null;
  remarks: string | null;
  attachment: string | null;
  single_duration: string | null;
  single_shift: string | null;
  single_hours_start: string | null;
  single_hours_end: string | null;
  status: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateLeaveRequestPayload {
  employee_id: number;
  leave_type_id: number;
  branch_id: number;
  leave_status: number;
  start_date: string;
  end_date: string;
  total_days: number;
  applied_date: string;
  comments?: string;
  remarks?: string;
  attachment?: string;
  single_duration?: LeaveRequestSingleDuration;
  single_shift?: string;
  single_hours_start?: string;
  single_hours_end?: string;
  status?: number;
}

export type UpdateLeaveRequestPayload = Partial<CreateLeaveRequestPayload>;

export interface ChangeLeaveRequestStatusPayload {
  leave_status: number;
  remarks?: string;
}

export interface LeaveRequestFormValues {
  employee_id: string;
  leave_type_id: string;
  branch_id: string;
  leave_status: string;
  start_date: string;
  end_date: string;
  applied_date: string;
  comments: string;
  remarks: string;
  attachment: string;
  single_duration: string;
  single_shift: string;
  single_hours_start: string;
  single_hours_end: string;
  status: number;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export const EMPTY_LEAVE_REQUEST_FORM_VALUES: LeaveRequestFormValues = {
  employee_id: "",
  leave_type_id: "",
  branch_id: "",
  leave_status: "",
  start_date: "",
  end_date: "",
  applied_date: todayISO(),
  comments: "",
  remarks: "",
  attachment: "",
  single_duration: "",
  single_shift: "",
  single_hours_start: "",
  single_hours_end: "",
  status: LEAVE_REQUEST_STATUS.ACTIVE,
};

export interface ListLeaveRequestsParams {
  page?: number;
  limit?: number;
  search?: string;
  employee_id?: number;
  leave_type_id?: number;
  leave_status?: number;
  branch_id?: number;
}

export interface UploadAttachmentResponseData {
  attachment: string;
}

export interface EmployeeLookupOption {
  id: number;
  name: string;
  reg_no: string | null;
}
export interface AttendanceEmployeeSummary {
  id: number;
  name: string;
  reg_no: string | null;
}

export interface AttendanceRecord {
  id: number;
  branch_id: number | null;
  employee_id: number | null;
  employee: AttendanceEmployeeSummary | null;
  attendance_date: string | null; // ISO date string
  status: number;
  timeIn: string | null; // "HH:mm"
  timeOut: string | null; // "HH:mm"
  remarks: string | null;
  comment: string | null;
  machine_status: number;
  approve_reject_by: number | null; // see attendance.validation.ts's reviewed helper
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateAttendancePayload {
  employee_id: number;
  branch_id?: number;
  attendance_date: string; // "YYYY-MM-DD"
  status: number;
  timeIn?: string;
  timeOut?: string;
  remarks?: string;
  comment?: string;
}

export type UpdateAttendancePayload = Partial<Omit<CreateAttendancePayload, "employee_id">>;

export interface AttendanceFormValues {
  employee_id: string;
  employee_label: string; // display label for the chosen employee, shown in the search input
  branch_id: string;
  attendance_date: string;
  status: string;
  timeIn: string;
  timeOut: string;
  remarks: string;
  comment: string;
}

export const EMPTY_ATTENDANCE_FORM_VALUES: AttendanceFormValues = {
  employee_id: "",
  employee_label: "",
  branch_id: "",
  attendance_date: "",
  status: "",
  timeIn: "",
  timeOut: "",
  remarks: "",
  comment: "",
};

export interface ListAttendanceParams {
  page?: number;
  limit?: number;
  employee_id?: number;
  branch_id?: number;
  company_id?: number;
  status?: number;
  start_date?: string;
  end_date?: string;
}
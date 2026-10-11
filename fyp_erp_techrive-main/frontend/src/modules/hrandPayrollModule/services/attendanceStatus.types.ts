import type { DisplayClass } from "./attendanceStatus.constants";
import { ATTENDANCE_STATUS_ABSENCE_FLAG, ATTENDANCE_STATUS_STATUS } from "./attendanceStatus.constants";

export { ATTENDANCE_STATUS_STATUS, ATTENDANCE_STATUS_ABSENCE_FLAG };

export interface AttendanceStatus {
  id: number;
  title: string;
  display_class: DisplayClass | null;
  counts_as_absent: number;
  status: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateAttendanceStatusPayload {
  title: string;
  display_class?: DisplayClass | null;
  counts_as_absent?: 0 | 1;
  status?: number;
}

export type UpdateAttendanceStatusPayload = Partial<CreateAttendanceStatusPayload>;

export interface AttendanceStatusFormValues {
  title: string;
  display_class: string;
  counts_as_absent: 0 | 1;
  status: string;
}

export const EMPTY_ATTENDANCE_STATUS_FORM_VALUES: AttendanceStatusFormValues = {
  title: "",
  display_class: "",
  counts_as_absent: ATTENDANCE_STATUS_ABSENCE_FLAG.DOES_NOT_COUNT,
  status: String(ATTENDANCE_STATUS_STATUS.ACTIVE),
};

export interface ListAttendanceStatusesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
}
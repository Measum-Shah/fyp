import { COMMENT_MAX_LENGTH, REMARKS_MAX_LENGTH, TIME_HHMM_REGEX } from "./attendance.constants";
import type {
  AttendanceFormValues,
  AttendanceRecord,
  CreateAttendancePayload,
  UpdateAttendancePayload,
} from "./attendance.types";

const isBlank = (value: string) => value.trim().length === 0;
const isValidPositiveInt = (value: string) => /^\d+$/.test(value.trim());

export const validateAttendanceForm = (values: AttendanceFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.employee_id) || !isValidPositiveInt(values.employee_id)) {
    errors.employee_id = "Please select an employee";
  }

  if (isBlank(values.attendance_date)) {
    errors.attendance_date = "Attendance date is required";
  }

  if (isBlank(values.status) || !isValidPositiveInt(values.status)) {
    errors.status = "Please select an attendance status";
  }

  if (!isBlank(values.timeIn) && !TIME_HHMM_REGEX.test(values.timeIn)) {
    errors.timeIn = "Time in must be a valid time";
  }
  if (!isBlank(values.timeOut) && !TIME_HHMM_REGEX.test(values.timeOut)) {
    errors.timeOut = "Time out must be a valid time";
  }
  if (
    !isBlank(values.timeIn) &&
    !isBlank(values.timeOut) &&
    TIME_HHMM_REGEX.test(values.timeIn) &&
    TIME_HHMM_REGEX.test(values.timeOut) &&
    values.timeOut <= values.timeIn
  ) {
    errors.timeOut = "Time out must be after time in";
  }

  if (values.remarks.trim().length > REMARKS_MAX_LENGTH) {
    errors.remarks = `Remarks must be at most ${REMARKS_MAX_LENGTH} characters`;
  }
  if (values.comment.trim().length > COMMENT_MAX_LENGTH) {
    errors.comment = `Comment must be at most ${COMMENT_MAX_LENGTH} characters`;
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

const trimOrUndefined = (value: string): string | undefined =>
  value.trim() === "" ? undefined : value.trim();

export const toCreatePayload = (values: AttendanceFormValues): CreateAttendancePayload => ({
  employee_id: Number(values.employee_id),
  branch_id: values.branch_id.trim() !== "" ? Number(values.branch_id) : undefined,
  attendance_date: values.attendance_date,
  status: Number(values.status),
  timeIn: trimOrUndefined(values.timeIn),
  timeOut: trimOrUndefined(values.timeOut),
  remarks: trimOrUndefined(values.remarks),
  comment: trimOrUndefined(values.comment),
});

export const toUpdatePayload = (values: AttendanceFormValues): UpdateAttendancePayload => {
  const { employee_id: _employee_id, ...rest } = toCreatePayload(values);
  return rest;
};

export const attendanceToFormValues = (record: AttendanceRecord): AttendanceFormValues => ({
  employee_id: record.employee_id !== null ? String(record.employee_id) : "",
  employee_label: record.employee
    ? `${record.employee.name}${record.employee.reg_no ? ` (${record.employee.reg_no})` : ""}`
    : "",
  branch_id: record.branch_id !== null ? String(record.branch_id) : "",
  attendance_date: record.attendance_date ? record.attendance_date.slice(0, 10) : "",
  status: String(record.status),
  timeIn: record.timeIn ?? "",
  timeOut: record.timeOut ?? "",
  remarks: record.remarks ?? "",
  comment: record.comment ?? "",
});

// approve_reject_by only records WHO reviewed a record, not an
// approved/rejected outcome — see attendance.service.ts (backend) for why.
export const isReviewed = (record: AttendanceRecord): boolean => record.approve_reject_by !== null;
import type {
  CreateLeaveRequestPayload,
  LeaveRequest,
  LeaveRequestFormValues,
  LeaveRequestSingleDuration,
  UpdateLeaveRequestPayload,
} from "./leaveRequest.types";

// ─── Leave Request Form — Validation & Conversion ────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/validators/leaveRequest.validator.ts

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// erp_hrm_leave_requests.total_days is stored explicitly rather than derived
// on the backend, so the frontend computes it (inclusive day count) and the
// form displays it read-only — see backend leaveRequest.constants.ts.
export const calculateTotalDays = (startDate: string, endDate: string): number => {
  if (!DATE_REGEX.test(startDate) || !DATE_REGEX.test(endDate)) return 0;
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return 0;
  return Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

export const validateLeaveRequestForm = (
  values: LeaveRequestFormValues
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (values.employee_id.trim() === "") errors.employee_id = "Employee is required";
  if (values.leave_type_id.trim() === "") errors.leave_type_id = "Leave type is required";
  if (values.branch_id.trim() === "") errors.branch_id = "Campus is required";
  if (values.leave_status.trim() === "") errors.leave_status = "Leave status is required";

  if (!values.start_date) {
    errors.start_date = "Start date is required";
  } else if (!DATE_REGEX.test(values.start_date)) {
    errors.start_date = "Start date must be a valid date";
  }

  if (!values.end_date) {
    errors.end_date = "End date is required";
  } else if (!DATE_REGEX.test(values.end_date)) {
    errors.end_date = "End date must be a valid date";
  }

  if (
    values.start_date &&
    values.end_date &&
    DATE_REGEX.test(values.start_date) &&
    DATE_REGEX.test(values.end_date) &&
    new Date(values.end_date).getTime() < new Date(values.start_date).getTime()
  ) {
    errors.end_date = "End date cannot be before start date";
  }

  if (!values.applied_date) {
    errors.applied_date = "Applied date is required";
  } else if (!DATE_REGEX.test(values.applied_date)) {
    errors.applied_date = "Applied date must be a valid date";
  }

  if (values.comments.trim().length > 2000) {
    errors.comments = "Comments must be at most 2000 characters";
  }
  if (values.remarks.trim().length > 2000) {
    errors.remarks = "Remarks must be at most 2000 characters";
  }
  if (values.attachment.trim().length > 500) {
    errors.attachment = "Attachment must be at most 500 characters";
  }

  const isSingleDay = calculateTotalDays(values.start_date, values.end_date) === 1;
  if (isSingleDay && values.single_duration === "Hourly") {
    if (values.single_hours_start && !TIME_REGEX.test(values.single_hours_start)) {
      errors.single_hours_start = "Start time must be in HH:MM format";
    } else if (!values.single_hours_start) {
      errors.single_hours_start = "Start time is required for an hourly leave request";
    }
    if (values.single_hours_end && !TIME_REGEX.test(values.single_hours_end)) {
      errors.single_hours_end = "End time must be in HH:MM format";
    } else if (!values.single_hours_end) {
      errors.single_hours_end = "End time is required for an hourly leave request";
    }
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

export const toCreatePayload = (values: LeaveRequestFormValues): CreateLeaveRequestPayload => {
  const totalDays = calculateTotalDays(values.start_date, values.end_date);
  const isSingleDay = totalDays === 1;

  return {
    employee_id: Number(values.employee_id),
    leave_type_id: Number(values.leave_type_id),
    branch_id: Number(values.branch_id),
    leave_status: Number(values.leave_status),
    start_date: values.start_date,
    end_date: values.end_date,
    total_days: totalDays,
    applied_date: values.applied_date,
    comments: values.comments.trim() === "" ? undefined : values.comments.trim(),
    remarks: values.remarks.trim() === "" ? undefined : values.remarks.trim(),
    attachment: values.attachment.trim() === "" ? undefined : values.attachment.trim(),
    single_duration:
      isSingleDay && values.single_duration
        ? (values.single_duration as LeaveRequestSingleDuration)
        : undefined,
    single_shift: isSingleDay && values.single_shift ? values.single_shift.trim() : undefined,
    single_hours_start:
      isSingleDay && values.single_duration === "Hourly" ? values.single_hours_start : undefined,
    single_hours_end:
      isSingleDay && values.single_duration === "Hourly" ? values.single_hours_end : undefined,
    status: values.status,
  };
};

export const toUpdatePayload = (values: LeaveRequestFormValues): UpdateLeaveRequestPayload =>
  toCreatePayload(values);

export const leaveRequestToFormValues = (request: LeaveRequest): LeaveRequestFormValues => ({
  employee_id: String(request.employee_id),
  leave_type_id: String(request.leave_type_id),
  branch_id: String(request.branch_id),
  leave_status: String(request.leave_status),
  start_date: request.start_date ? request.start_date.slice(0, 10) : "",
  end_date: request.end_date ? request.end_date.slice(0, 10) : "",
  applied_date: request.applied_date ? request.applied_date.slice(0, 10) : "",
  comments: request.comments ?? "",
  remarks: request.remarks ?? "",
  attachment: request.attachment ?? "",
  single_duration: request.single_duration ?? "",
  single_shift: request.single_shift ?? "",
  single_hours_start: request.single_hours_start ?? "",
  single_hours_end: request.single_hours_end ?? "",
  status: request.status,
});
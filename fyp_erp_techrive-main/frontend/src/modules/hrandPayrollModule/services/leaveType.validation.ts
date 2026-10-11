import { EMPTY_LEAVE_TYPE_FORM_VALUES } from "./leaveType.types";
import type {
  CreateLeaveTypePayload,
  LeaveType,
  LeaveTypeFormValues,
  UpdateLeaveTypePayload,
} from "./leaveType.types";

// ─── Leave Type Form — Validation & Conversion ───────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/validators/leaveType.validator.ts

const isBlank = (value: string) => value.trim().length === 0;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const validateLeaveTypeForm = (values: LeaveTypeFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.name)) {
    errors.name = "Leave type name is required";
  } else if (values.name.trim().length > 255) {
    errors.name = "Leave type name must be at most 255 characters";
  }

  if (values.permitted_days.trim() !== "") {
    const permittedDays = Number(values.permitted_days);
    if (!Number.isInteger(permittedDays) || permittedDays < 0) {
      errors.permitted_days = "Permitted days must be a whole number, 0 or greater";
    }
  }

  if (values.year.trim() !== "") {
    const year = Number(values.year);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      errors.year = "Year must be between 2000 and 2100";
    }
  }

  if (values.parent_id.trim() !== "") {
    const parentId = Number(values.parent_id);
    if (!Number.isInteger(parentId) || parentId <= 0) {
      errors.parent_id = "Parent leave type id must be a positive whole number";
    }
  }

  if (values.type.trim().length > 20) {
    errors.type = "Type must be at most 20 characters";
  }

  if (values.start_date && !DATE_REGEX.test(values.start_date)) {
    errors.start_date = "Start date must be a valid date";
  }

  if (values.end_date && !DATE_REGEX.test(values.end_date)) {
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

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

export const toCreatePayload = (values: LeaveTypeFormValues): CreateLeaveTypePayload => ({
  name: values.name.trim(),
  permitted_days: values.permitted_days.trim() === "" ? undefined : Number(values.permitted_days),
  year: values.year.trim() === "" ? undefined : Number(values.year),
  parent_id: values.parent_id.trim() === "" ? undefined : Number(values.parent_id),
  type: values.type.trim() === "" ? undefined : values.type.trim(),
  start_date: values.start_date || undefined,
  end_date: values.end_date || undefined,
  pay_type: values.pay_type,
  status: values.status,
});

export const toUpdatePayload = (values: LeaveTypeFormValues): UpdateLeaveTypePayload =>
  toCreatePayload(values);

export const leaveTypeToFormValues = (leaveType: LeaveType): LeaveTypeFormValues => ({
  name: leaveType.name,
  permitted_days: String(leaveType.permitted_days ?? ""),
  year: String(leaveType.year ?? ""),
  parent_id: leaveType.parent_id ? String(leaveType.parent_id) : "",
  type: leaveType.type ?? "",
  start_date: leaveType.start_date ? leaveType.start_date.slice(0, 10) : "",
  end_date: leaveType.end_date ? leaveType.end_date.slice(0, 10) : "",
  pay_type: leaveType.pay_type,
  status: leaveType.status,
});

export { EMPTY_LEAVE_TYPE_FORM_VALUES };
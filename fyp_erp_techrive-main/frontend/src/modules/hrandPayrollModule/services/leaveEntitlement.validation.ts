import type {
  CreateLeaveEntitlementPayload,
  LeaveEntitlement,
  LeaveEntitlementFormValues,
  UpdateLeaveEntitlementPayload,
} from "./leaveEntitlement.types";

// ─── Leave Entitlement Form — Validation & Conversion ────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/validators/leaveEntitlement.validator.ts

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const validateLeaveEntitlementForm = (
  values: LeaveEntitlementFormValues
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (values.employee_id.trim() === "") {
    errors.employee_id = "Employee is required";
  }

  if (values.leave_type_id.trim() === "") {
    errors.leave_type_id = "Leave type is required";
  }

  if (values.no_of_days.trim() === "") {
    errors.no_of_days = "Number of days is required";
  } else if (Number(values.no_of_days) < 0) {
    errors.no_of_days = "Number of days cannot be negative";
  }

  if (values.days_used.trim() !== "" && Number(values.days_used) < 0) {
    errors.days_used = "Days used cannot be negative";
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

  if (values.credited_date && !DATE_REGEX.test(values.credited_date)) {
    errors.credited_date = "Credited date must be a valid date";
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

export const toCreatePayload = (
  values: LeaveEntitlementFormValues
): CreateLeaveEntitlementPayload => ({
  employee_id: Number(values.employee_id),
  leave_type_id: Number(values.leave_type_id),
  no_of_days: Number(values.no_of_days),
  days_used: values.days_used.trim() === "" ? undefined : Number(values.days_used),
  start_date: values.start_date || undefined,
  end_date: values.end_date || undefined,
  credited_date: values.credited_date || undefined,
  status: values.status,
});

export const toUpdatePayload = (
  values: LeaveEntitlementFormValues
): UpdateLeaveEntitlementPayload => toCreatePayload(values);

export const leaveEntitlementToFormValues = (
  entitlement: LeaveEntitlement
): LeaveEntitlementFormValues => ({
  employee_id: String(entitlement.employee_id),
  leave_type_id: String(entitlement.leave_type_id),
  no_of_days: String(entitlement.no_of_days ?? ""),
  days_used: String(entitlement.days_used ?? "0"),
  start_date: entitlement.start_date ? entitlement.start_date.slice(0, 10) : "",
  end_date: entitlement.end_date ? entitlement.end_date.slice(0, 10) : "",
  credited_date: entitlement.credited_date ? entitlement.credited_date.slice(0, 10) : "",
  status: entitlement.status,
});
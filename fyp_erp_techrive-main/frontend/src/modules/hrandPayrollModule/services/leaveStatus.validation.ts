import type {
  CreateLeaveStatusPayload,
  LeaveStatus,
  LeaveStatusFormValues,
  UpdateLeaveStatusPayload,
} from "./leaveStatus.types";

// ─── Leave Status Form — Validation & Conversion ─────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/validators/leaveStatus.validator.ts

const isBlank = (value: string) => value.trim().length === 0;

export const validateLeaveStatusForm = (
  values: LeaveStatusFormValues
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.name)) {
    errors.name = "Status name is required";
  } else if (values.name.trim().length > 255) {
    errors.name = "Status name must be at most 255 characters";
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

export const toCreatePayload = (values: LeaveStatusFormValues): CreateLeaveStatusPayload => ({
  name: values.name.trim(),
  counts_as_approved: values.counts_as_approved,
  status: values.status,
});

export const toUpdatePayload = (values: LeaveStatusFormValues): UpdateLeaveStatusPayload =>
  toCreatePayload(values);

export const leaveStatusToFormValues = (leaveStatus: LeaveStatus): LeaveStatusFormValues => ({
  name: leaveStatus.name,
  counts_as_approved: leaveStatus.counts_as_approved === 1 ? 1 : 0,
  status: leaveStatus.status,
});
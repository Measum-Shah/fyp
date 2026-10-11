import type { CreateTerminationPayload, Termination, TerminationFormValues, UpdateTerminationPayload } from "./termination.types";

const isBlank = (value: string) => value.trim().length === 0;

export const validateTerminationForm = (values: TerminationFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (isBlank(values.staff_id)) errors.staff_id = "Employee is required";
  if (isBlank(values.reason)) errors.reason = "Reason is required";
  if (isBlank(values.warnings)) errors.warnings = "Prior warnings summary is required";
  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean => Object.keys(errors).length === 0;

export const toCreatePayload = (values: TerminationFormValues): CreateTerminationPayload => ({
  staff_id: Number(values.staff_id),
  reason: values.reason.trim(),
  warnings: values.warnings.trim(),
  acknowledge: values.acknowledge,
});

export const toUpdatePayload = (values: TerminationFormValues): UpdateTerminationPayload => toCreatePayload(values);

export const terminationToFormValues = (record: Termination): TerminationFormValues => ({
  staff_id: String(record.user_id),
  reason: record.reason,
  warnings: record.warnings,
  acknowledge: record.acknowledge ?? "no",
});

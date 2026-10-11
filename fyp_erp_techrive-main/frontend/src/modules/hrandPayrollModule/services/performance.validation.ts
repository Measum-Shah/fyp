import type { CreatePerformancePayload, Performance, PerformanceFormValues, UpdatePerformancePayload } from "./performance.types";

const isBlank = (value: string) => value.trim().length === 0;

export const validatePerformanceForm = (values: PerformanceFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (isBlank(values.staff_id)) errors.staff_id = "Employee is required";
  if (isBlank(values.month)) errors.month = "Month is required";
  if (isBlank(values.date)) errors.date = "Date is required";
  if (isBlank(values.performance)) errors.performance = "Performance is required";
  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean => Object.keys(errors).length === 0;

export const toCreatePayload = (values: PerformanceFormValues): CreatePerformancePayload => ({
  staff_id: Number(values.staff_id),
  month: values.month,
  date: values.date.trim(),
  performance: values.performance,
});

export const toUpdatePayload = (values: PerformanceFormValues): UpdatePerformancePayload => toCreatePayload(values);

export const performanceToFormValues = (record: Performance): PerformanceFormValues => ({
  staff_id: record.user_id != null ? String(record.user_id) : "",
  month: record.month ?? "",
  date: record.date ?? "",
  // Fall back to the legacy student_feedback rating for records saved
  // before the single-Performance field existed.
  performance: record.performance ?? record.student_feedback ?? "",
});
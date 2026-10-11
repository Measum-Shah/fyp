import { DATE_REGEX } from "./employee.constants";
import type {
  CreateIncrementPayload,
  Increment,
  IncrementFormValues,
  UpdateIncrementPayload,
} from "./increment.types";

const isBlank = (value: string) => value.trim().length === 0;

export const validateIncrementForm = (values: IncrementFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.staff_id)) errors.staff_id = "Employee is required";
  if (isBlank(values.branch_id)) errors.branch_id = "Campus is required";
  if (isBlank(values.reason)) errors.reason = "Reason is required";

  if (isBlank(values.increment_date)) {
    errors.increment_date = "Increment date is required";
  } else if (!DATE_REGEX.test(values.increment_date.trim())) {
    errors.increment_date = "Date must be in YYYY-MM-DD format";
  }

  if (isBlank(values.basic_salary)) errors.basic_salary = "Current basic salary is required";
  if (isBlank(values.previous_gross_salary)) errors.previous_gross_salary = "Previous gross salary is required";
  if (isBlank(values.amount)) errors.amount = "Increment amount is required";
  if (isBlank(values.new_salary_increment)) errors.new_salary_increment = "New gross salary could not be calculated";

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean => Object.keys(errors).length === 0;

// New Gross Salary = Previous Gross Salary + Increment Amount — single
// source of truth for the live client-side preview shown in the form. The
// server independently recomputes the same formula on save (see
// increment.service.ts#createIncrement/updateIncrement), so the two can
// never drift.
export const computeNewGrossSalary = (previousGrossSalary: string, amount: string): number => {
  const previous = Number(previousGrossSalary || 0);
  const inc = Number(amount || 0);
  return (Number.isFinite(previous) ? previous : 0) + (Number.isFinite(inc) ? inc : 0);
};

export const toCreatePayload = (values: IncrementFormValues): CreateIncrementPayload => ({
  staff_id: Number(values.staff_id),
  branch_id: Number(values.branch_id),
  reason: values.reason.trim(),
  increment_date: values.increment_date.trim(),
  basic_salary: Number(values.basic_salary),
  previous_gross_salary: Number(values.previous_gross_salary),
  New_salary_increment: Number(values.new_salary_increment),
  Amount: Number(values.amount),
});

export const toUpdatePayload = (values: IncrementFormValues): UpdateIncrementPayload => toCreatePayload(values);

export const incrementToFormValues = (record: Increment): IncrementFormValues => ({
  staff_id: record.staff_id != null ? String(record.staff_id) : "",
  branch_id: record.branch_id != null ? String(record.branch_id) : "",
  reason: record.reason ?? "",
  increment_date: record.increment_date ? record.increment_date.slice(0, 10) : "",
  basic_salary: record.basic_salary != null ? String(record.basic_salary) : "",
  previous_gross_salary: record.previous_gross_salary != null ? String(record.previous_gross_salary) : "",
  new_salary_increment: record.New_salary_increment != null ? String(record.New_salary_increment) : "",
  amount: record.Amount != null ? String(record.Amount) : "",
});
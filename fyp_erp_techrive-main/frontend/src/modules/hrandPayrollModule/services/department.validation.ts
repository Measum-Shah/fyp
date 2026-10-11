import {
  DEPARTMENT_DESCRIPTION_MAX_LENGTH,
  DEPARTMENT_NAME_MAX_LENGTH,
} from "./department.constants";
import type {
  CreateDepartmentPayload,
  Department,
  DepartmentFormValues,
  UpdateDepartmentPayload,
} from "./department.types";

// ─── Department Form — Validation & Conversion ───────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/validators/department.validator.ts

const isBlank = (value: string) => value.trim().length === 0;

export const validateDepartmentForm = (
  values: DepartmentFormValues
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.name)) {
    errors.name = "Department name is required";
  } else if (values.name.trim().length > DEPARTMENT_NAME_MAX_LENGTH) {
    errors.name = `Department name must be at most ${DEPARTMENT_NAME_MAX_LENGTH} characters`;
  }

  if (values.description.trim().length > DEPARTMENT_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be at most ${DEPARTMENT_DESCRIPTION_MAX_LENGTH} characters`;
  }

  if (isBlank(values.company_id)) {
    errors.company_id = "School is required";
  }
  if (isBlank(values.branch_id)) {
    errors.branch_id = "Campus is required";
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

export const toCreatePayload = (
  values: DepartmentFormValues
): CreateDepartmentPayload => ({
  name: values.name.trim(),
  description: values.description.trim() === "" ? undefined : values.description.trim(),
  company_id: Number(values.company_id),
  branch_id: Number(values.branch_id),
});

export const toUpdatePayload = (
  values: DepartmentFormValues
): UpdateDepartmentPayload => toCreatePayload(values);

export const departmentToFormValues = (department: Department): DepartmentFormValues => ({
  name: department.name,
  description: department.description ?? "",
  company_id: department.company_id?.toString() ?? "",
  branch_id: department.branch_id?.toString() ?? "",
});
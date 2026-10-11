import {
  STAFF_TYPE_CODE_MAX_LENGTH,
  STAFF_TYPE_DESCRIPTION_MAX_LENGTH,
  STAFF_TYPE_NAME_MAX_LENGTH,
} from "./staffType.constants";
import type {
  CreateStaffTypePayload,
  StaffType,
  StaffTypeFormValues,
  UpdateStaffTypePayload,
} from "./staffType.types";

// ─── Staff Type Form — Validation & Conversion ───────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/validators/staffType.validator.ts

const isBlank = (value: string) => value.trim().length === 0;

export const validateStaffTypeForm = (
  values: StaffTypeFormValues
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.name)) {
    errors.name = "Staff type name is required";
  } else if (values.name.trim().length > STAFF_TYPE_NAME_MAX_LENGTH) {
    errors.name = `Name must be at most ${STAFF_TYPE_NAME_MAX_LENGTH} characters`;
  }

  if (isBlank(values.staff_type_code)) {
    errors.staff_type_code = "Staff type code is required";
  } else if (values.staff_type_code.trim().length > STAFF_TYPE_CODE_MAX_LENGTH) {
    errors.staff_type_code = `Code must be at most ${STAFF_TYPE_CODE_MAX_LENGTH} characters`;
  }

  if (values.description.trim().length > STAFF_TYPE_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be at most ${STAFF_TYPE_DESCRIPTION_MAX_LENGTH} characters`;
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

export const toCreatePayload = (values: StaffTypeFormValues): CreateStaffTypePayload => ({
  name: values.name.trim(),
  staff_type_code: values.staff_type_code.trim(),
  description: values.description.trim() === "" ? undefined : values.description.trim(),
});

export const toUpdatePayload = (values: StaffTypeFormValues): UpdateStaffTypePayload =>
  toCreatePayload(values);

export const staffTypeToFormValues = (staffType: StaffType): StaffTypeFormValues => ({
  name: staffType.name,
  staff_type_code: staffType.staff_type_code,
  description: staffType.description ?? "",
});

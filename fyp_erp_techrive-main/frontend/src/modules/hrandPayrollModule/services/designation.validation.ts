import { DESIGNATION_DESCRIPTION_MAX_LENGTH, DESIGNATION_NAME_MAX_LENGTH } from "./designation.constants";
import type {
  CreateDesignationPayload,
  Designation,
  DesignationFormValues,
  UpdateDesignationPayload,
} from "./designation.types";

// ─── Designation Form — Validation & Conversion ─────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/validators/designation.validator.ts

export const validateDesignationForm = (
  values: DesignationFormValues
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (values.name.trim().length === 0) {
    errors.name = "Designation name is required";
  } else if (values.name.trim().length > DESIGNATION_NAME_MAX_LENGTH) {
    errors.name = `Name must be at most ${DESIGNATION_NAME_MAX_LENGTH} characters`;
  }

  if (values.description.trim().length > DESIGNATION_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be at most ${DESIGNATION_DESCRIPTION_MAX_LENGTH} characters`;
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

export const toCreatePayload = (values: DesignationFormValues): CreateDesignationPayload => ({
  name: values.name.trim(),
  description: values.description.trim() === "" ? undefined : values.description.trim(),
});

export const toUpdatePayload = (values: DesignationFormValues): UpdateDesignationPayload => ({
  name: values.name.trim(),
  description: values.description.trim(),
});

export const designationToFormValues = (designation: Designation): DesignationFormValues => ({
  name: designation.name,
  description: designation.description ?? "",
});
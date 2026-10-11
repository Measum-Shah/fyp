import { DATE_REGEX } from "./employee.constants";
import type { CreateExperiencePayload, Experience, ExperienceFormValues, UpdateExperiencePayload } from "./experience.types";

const isBlank = (value: string) => value.trim().length === 0;

export const validateExperienceForm = (values: ExperienceFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (isBlank(values.staff_id)) errors.staff_id = "Employee is required";
  if (isBlank(values.name)) errors.name = "Company/employer name is required";
  if (isBlank(values.designation)) errors.designation = "Designation is required";

  if (isBlank(values.from_date)) {
    errors.from_date = "From date is required";
  } else if (!DATE_REGEX.test(values.from_date.trim())) {
    errors.from_date = "Must be in YYYY-MM-DD format";
  }

  if (isBlank(values.to_date)) {
    errors.to_date = "To date is required";
  } else if (!DATE_REGEX.test(values.to_date.trim())) {
    errors.to_date = "Must be in YYYY-MM-DD format";
  } else if (!isBlank(values.from_date) && DATE_REGEX.test(values.from_date.trim()) && new Date(values.to_date) < new Date(values.from_date)) {
    errors.to_date = "To date must be on or after From date";
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean => Object.keys(errors).length === 0;

export const toCreatePayload = (values: ExperienceFormValues): CreateExperiencePayload => ({
  staff_id: Number(values.staff_id),
  name: values.name.trim(),
  designation: values.designation.trim(),
  from_date: values.from_date.trim(),
  to_date: values.to_date.trim(),
});

export const toUpdatePayload = (values: ExperienceFormValues): UpdateExperiencePayload => toCreatePayload(values);

export const experienceToFormValues = (record: Experience): ExperienceFormValues => ({
  staff_id: record.staff_id != null ? String(record.staff_id) : "",
  name: record.name,
  designation: record.designation,
  from_date: record.from_date ? record.from_date.slice(0, 10) : "",
  to_date: record.to_date ? record.to_date.slice(0, 10) : "",
});
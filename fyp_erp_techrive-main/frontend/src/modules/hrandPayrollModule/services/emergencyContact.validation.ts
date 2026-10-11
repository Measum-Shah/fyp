import type {
  CreateEmergencyContactPayload,
  EmergencyContact,
  EmergencyContactFormValues,
  UpdateEmergencyContactPayload,
} from "./emergencyContact.types";

const isBlank = (value: string) => value.trim().length === 0;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmergencyContactForm = (values: EmergencyContactFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (isBlank(values.staff_id)) errors.staff_id = "Employee is required";
  if (isBlank(values.name)) errors.name = "Name is required";
  if (isBlank(values.relation)) errors.relation = "Relation is required";
  if (isBlank(values.phone)) errors.phone = "Phone is required";

  if (isBlank(values.email)) {
    errors.email = "Email is required";
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = "Must be a valid email address";
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean => Object.keys(errors).length === 0;

export const toCreatePayload = (values: EmergencyContactFormValues): CreateEmergencyContactPayload => ({
  staff_id: Number(values.staff_id),
  name: values.name.trim(),
  relation: values.relation.trim(),
  phone: values.phone.trim(),
  email: values.email.trim(),
});

export const toUpdatePayload = (values: EmergencyContactFormValues): UpdateEmergencyContactPayload => toCreatePayload(values);

export const emergencyContactToFormValues = (record: EmergencyContact): EmergencyContactFormValues => ({
  staff_id: record.staff_id != null ? String(record.staff_id) : "",
  name: record.name,
  relation: record.relation,
  phone: record.phone,
  email: record.email,
});

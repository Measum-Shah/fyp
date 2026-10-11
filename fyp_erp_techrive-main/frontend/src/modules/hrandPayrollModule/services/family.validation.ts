import type { CreateFamilyPayload, Family, FamilyFormValues, UpdateFamilyPayload } from "./family.types";

const isBlank = (value: string) => value.trim().length === 0;

export const validateFamilyForm = (values: FamilyFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (isBlank(values.staff_id)) errors.staff_id = "Employee is required";
  if (isBlank(values.name)) errors.name = "Name is required";
  if (isBlank(values.relation)) errors.relation = "Relation is required";
  if (isBlank(values.phone)) errors.phone = "Phone is required";
  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean => Object.keys(errors).length === 0;

export const toCreatePayload = (values: FamilyFormValues): CreateFamilyPayload => ({
  staff_id: Number(values.staff_id),
  name: values.name.trim(),
  relation: values.relation.trim(),
  phone: values.phone.trim(),
  gender: values.gender.trim() === "" ? undefined : values.gender.trim(),
  cnic: values.cnic.trim() === "" ? undefined : values.cnic.trim(),
  workplace: values.workplace.trim() === "" ? undefined : values.workplace.trim(),
});

export const toUpdatePayload = (values: FamilyFormValues): UpdateFamilyPayload => toCreatePayload(values);

export const familyToFormValues = (record: Family): FamilyFormValues => ({
  staff_id: record.staff_id != null ? String(record.staff_id) : "",
  name: record.name,
  relation: record.relation,
  phone: record.phone,
  gender: record.gender,
  cnic: record.cnic,
  workplace: record.workplace,
});
import type {
  CreateStaffQualificationPayload,
  StaffQualification,
  StaffQualificationFormValues,
  UpdateStaffQualificationPayload,
} from "./staffQualification.types";

const isBlank = (value: string) => value.trim().length === 0;
const CURRENT_YEAR = new Date().getFullYear();

export const validateStaffQualificationForm = (
  values: StaffQualificationFormValues
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.degree)) {
    errors.degree = "Degree / qualification name is required";
  }

  if (!isBlank(values.passing_year)) {
    const year = Number(values.passing_year);
    if (!Number.isInteger(year) || year < 1950 || year > CURRENT_YEAR + 1) {
      errors.passing_year = `Passing year must be between 1950 and ${CURRENT_YEAR + 1}`;
    }
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

export const toCreatePayload = (
  staffId: number,
  values: StaffQualificationFormValues
): CreateStaffQualificationPayload => ({
  staff_id: staffId,
  degree: values.degree.trim(),
  institute: values.institute.trim() || undefined,
  board_or_university: values.board_or_university.trim() || undefined,
  passing_year: values.passing_year.trim() ? Number(values.passing_year) : undefined,
  grade_or_cgpa: values.grade_or_cgpa.trim() || undefined,
  attachment: values.attachment.trim() || undefined,
});

export const toUpdatePayload = (
  staffId: number,
  values: StaffQualificationFormValues
): UpdateStaffQualificationPayload => toCreatePayload(staffId, values);

export const staffQualificationToFormValues = (
  record: StaffQualification
): StaffQualificationFormValues => ({
  degree: record.degree,
  institute: record.institute ?? "",
  board_or_university: record.board_or_university ?? "",
  passing_year: record.passing_year != null ? String(record.passing_year) : "",
  grade_or_cgpa: record.grade_or_cgpa ?? "",
  attachment: record.attachment ?? "",
});
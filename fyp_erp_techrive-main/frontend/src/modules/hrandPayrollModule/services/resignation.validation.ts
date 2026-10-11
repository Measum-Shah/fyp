import { DATE_REGEX } from "./employee.constants";
import type {
  CreateResignationPayload,
  Resignation,
  ResignationFormValues,
  UpdateResignationPayload,
} from "./resignation.types";

const isBlank = (value: string) => value.trim().length === 0;

export const validateResignationForm = (values: ResignationFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.staff_id)) errors.staff_id = "Employee is required";
  if (isBlank(values.branch_id)) errors.branch_id = "Campus is required";
  if (isBlank(values.role_id)) errors.role_id = "Role id is required";
  if (isBlank(values.reason)) errors.reason = "Reason is required";
  if (isBlank(values.notice_period)) errors.notice_period = "Notice period is required";

  if (isBlank(values.last_day_of_work)) {
    errors.last_day_of_work = "Last day of work is required";
  } else if (!DATE_REGEX.test(values.last_day_of_work.trim())) {
    errors.last_day_of_work = "Must be in YYYY-MM-DD format";
  }

  if (values.join_date.trim() !== "" && !DATE_REGEX.test(values.join_date.trim())) {
    errors.join_date = "Must be in YYYY-MM-DD format";
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean => Object.keys(errors).length === 0;

const strOrUndefined = (value: string): string | undefined => (value.trim() === "" ? undefined : value.trim());

export const toCreatePayload = (values: ResignationFormValues): CreateResignationPayload => ({
  staff_id: Number(values.staff_id),
  branch_id: Number(values.branch_id),
  role_id: Number(values.role_id),
  reason: values.reason.trim(),
  notice_period: values.notice_period.trim(),
  last_day_of_work: values.last_day_of_work.trim(),
  join_date: strOrUndefined(values.join_date),
  experience_letter: strOrUndefined(values.experience_letter),
  class: strOrUndefined(values.class),
  subject: strOrUndefined(values.subject),
});

export const toUpdatePayload = (values: ResignationFormValues): UpdateResignationPayload => toCreatePayload(values);

export const resignationToFormValues = (record: Resignation): ResignationFormValues => ({
  staff_id: String(record.staff_id),
  branch_id: String(record.branch_id),
  role_id: String(record.role_id),
  reason: record.reason,
  notice_period: record.notice_period,
  last_day_of_work: record.last_day_of_work ?? "",
  join_date: record.join_date ? record.join_date.slice(0, 10) : "",
  experience_letter: record.experience_letter ?? "",
  class: record.class ?? "",
  subject: record.subject ?? "",
});
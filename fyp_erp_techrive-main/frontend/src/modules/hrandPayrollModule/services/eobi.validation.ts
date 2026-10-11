import type { CreateEobiEntryPayload, EobiEntry, EobiFormValues, UpdateEobiEntryPayload } from "./eobi.types";

const isBlank = (value: string) => value.trim().length === 0;
const isValidPositiveInt = (value: string) => /^\d+$/.test(value.trim()) && Number(value.trim()) > 0;

export const validateEobiForm = (values: EobiFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.staff_id)) errors.staff_id = "Employee is required";

  if (isBlank(values.eobi_amount)) {
    errors.eobi_amount = "EOBI Amount is required";
  } else if (!isValidPositiveInt(values.eobi_amount)) {
    errors.eobi_amount = "EOBI Amount must be greater than 0";
  }

  if (isBlank(values.epf_amount)) {
    errors.epf_amount = "EPF Amount is required";
  } else if (!isValidPositiveInt(values.epf_amount)) {
    errors.epf_amount = "EPF Amount must be greater than 0";
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean => Object.keys(errors).length === 0;

const numOrUndefined = (value: string): number | undefined => (value.trim() === "" ? undefined : Number(value.trim()));

export const toCreatePayload = (values: EobiFormValues): CreateEobiEntryPayload => ({
  staff_id: Number(values.staff_id),
  branch_id: numOrUndefined(values.branch_id),
  company_id: numOrUndefined(values.company_id),
  eobi_amount: Number(values.eobi_amount),
  epf_amount: Number(values.epf_amount),
  status: values.status || undefined,
});

export const toUpdatePayload = (values: EobiFormValues): UpdateEobiEntryPayload => toCreatePayload(values);

export const eobiEntryToFormValues = (record: EobiEntry): EobiFormValues => ({
  staff_id: record.staff_id != null ? String(record.staff_id) : "",
  branch_id: record.branch_id != null ? String(record.branch_id) : "",
  company_id: record.company_id != null ? String(record.company_id) : "",
  eobi_amount: String(record.eobi_amount ?? ""),
  epf_amount: String(record.epf_amount ?? ""),
  status: record.status ?? "",
});
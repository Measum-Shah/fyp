import { DATE_REGEX } from "./employee.constants";
import type {
  CreateFiscalYearPayload,
  FiscalYear,
  FiscalYearFormValues,
  UpdateFiscalYearPayload,
} from "./fiscalYear.types";

const isBlank = (value: string) => value.trim().length === 0;

export const validateFiscalYearForm = (values: FiscalYearFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.name)) errors.name = "Name is required";

  if (isBlank(values.start_date)) {
    errors.start_date = "Start date is required";
  } else if (!DATE_REGEX.test(values.start_date.trim())) {
    errors.start_date = "Start date must be in YYYY-MM-DD format";
  }

  if (isBlank(values.end_date)) {
    errors.end_date = "End date is required";
  } else if (!DATE_REGEX.test(values.end_date.trim())) {
    errors.end_date = "End date must be in YYYY-MM-DD format";
  }

  if (!errors.start_date && !errors.end_date && values.end_date <= values.start_date) {
    errors.end_date = "End date must be after start date";
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean => Object.keys(errors).length === 0;

export const toCreatePayload = (values: FiscalYearFormValues): CreateFiscalYearPayload => ({
  name: values.name.trim(),
  start_date: values.start_date.trim(),
  end_date: values.end_date.trim(),
  status: values.status,
});

export const toUpdatePayload = (values: FiscalYearFormValues): UpdateFiscalYearPayload => toCreatePayload(values);

export const fiscalYearToFormValues = (record: FiscalYear): FiscalYearFormValues => ({
  name: record.name,
  start_date: record.start_date.slice(0, 10),
  end_date: record.end_date.slice(0, 10),
  status: record.status,
});

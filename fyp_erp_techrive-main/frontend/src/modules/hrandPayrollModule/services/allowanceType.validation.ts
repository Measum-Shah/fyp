import type {
  AllowanceType,
  AllowanceTypeFormValues,
  CreateAllowanceTypePayload,
  UpdateAllowanceTypePayload,
} from "./allowanceType.types";

const isBlank = (value: string) => value.trim().length === 0;

export const validateAllowanceTypeForm = (values: AllowanceTypeFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.name)) errors.name = "Allowance name is required";

  if (isBlank(values.default_value)) {
    errors.default_value = "Default value is required";
  } else {
    const num = Number(values.default_value);
    if (Number.isNaN(num) || num < 0) errors.default_value = "Default value must be a non-negative number";
    else if (values.calculation_type === "PERCENTAGE" && num > 100) errors.default_value = "A percentage-based value cannot exceed 100";
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean => Object.keys(errors).length === 0;

export const toCreatePayload = (values: AllowanceTypeFormValues): CreateAllowanceTypePayload => ({
  name: values.name.trim(),
  code: values.code.trim() || undefined,
  calculation_type: values.calculation_type,
  default_value: Number(values.default_value),
  is_taxable: values.is_taxable,
  status: values.status,
});

export const toUpdatePayload = (values: AllowanceTypeFormValues): UpdateAllowanceTypePayload => toCreatePayload(values);

export const allowanceTypeToFormValues = (record: AllowanceType): AllowanceTypeFormValues => ({
  name: record.name,
  code: record.code ?? "",
  calculation_type: record.calculation_type === "PERCENTAGE" ? "PERCENTAGE" : "FIXED",
  default_value: String(record.default_value),
  is_taxable: record.is_taxable === 1 ? 1 : 0,
  status: record.status,
});

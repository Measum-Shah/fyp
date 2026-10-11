import type {
  CreateDeductionFormulaPayload,
  DeductionFormula,
  DeductionFormulaFormValues,
  UpdateDeductionFormulaPayload,
} from "./payrollDeductionFormula.types";

const isBlank = (value: string) => value.trim().length === 0;

export const validateDeductionFormulaForm = (values: DeductionFormulaFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (isBlank(values.name)) errors.name = "Formula name is required";
  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean => Object.keys(errors).length === 0;

export const toCreatePayload = (values: DeductionFormulaFormValues): CreateDeductionFormulaPayload => ({
  name: values.name.trim(),
  base_type: values.base_type,
  divisor_type: values.divisor_type,
  is_default: values.is_default,
  status: values.status,
});

export const toUpdatePayload = (values: DeductionFormulaFormValues): UpdateDeductionFormulaPayload => toCreatePayload(values);

export const deductionFormulaToFormValues = (record: DeductionFormula): DeductionFormulaFormValues => ({
  name: record.name,
  base_type: record.base_type,
  divisor_type: record.divisor_type,
  is_default: record.is_default === 1 ? 1 : 0,
  status: record.status,
});

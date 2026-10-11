import type { CreateLoanTypePayload, LoanType, LoanTypeFormValues, UpdateLoanTypePayload } from "./loanType.types";

const isBlank = (value: string) => value.trim().length === 0;

export const validateLoanTypeForm = (values: LoanTypeFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.loan_type)) errors.loan_type = "Loan type name is required";
  if (isBlank(values.description)) errors.description = "Description is required";

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean => Object.keys(errors).length === 0;

export const toCreatePayload = (values: LoanTypeFormValues): CreateLoanTypePayload => ({
  loan_type: values.loan_type.trim(),
  description: values.description.trim(),
});

export const toUpdatePayload = (values: LoanTypeFormValues): UpdateLoanTypePayload => toCreatePayload(values);

export const loanTypeToFormValues = (record: LoanType): LoanTypeFormValues => ({
  loan_type: record.loan_type,
  description: record.description,
});

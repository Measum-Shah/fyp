import {
  BANK_ACCOUNT_NUMBER_MAX_LENGTH,
  BANK_ACCOUNT_TITLE_MAX_LENGTH,
  BANK_BRANCH_MAX_LENGTH,
} from "./bankAccount.constants";
import type {
  BankAccount,
  BankAccountFormValues,
  CreateBankAccountPayload,
  UpdateBankAccountPayload,
} from "./bankAccount.types";

// ─── Bank Account Form — Validation & Conversion ─────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/validators/bankAccount.validator.ts

const isBlank = (value: string) => value.trim().length === 0;

export const validateBankAccountForm = (values: BankAccountFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.staff_id)) {
    errors.staff_id = "Employee is required";
  }

  if (isBlank(values.account_title)) {
    errors.account_title = "Account title is required";
  } else if (values.account_title.trim().length > BANK_ACCOUNT_TITLE_MAX_LENGTH) {
    errors.account_title = `Account title must be at most ${BANK_ACCOUNT_TITLE_MAX_LENGTH} characters`;
  }

  if (isBlank(values.account_number)) {
    errors.account_number = "Account number is required";
  } else if (values.account_number.trim().length > BANK_ACCOUNT_NUMBER_MAX_LENGTH) {
    errors.account_number = `Account number must be at most ${BANK_ACCOUNT_NUMBER_MAX_LENGTH} characters`;
  }

  if (isBlank(values.bank_branch)) {
    errors.bank_branch = "Bank branch is required";
  } else if (values.bank_branch.trim().length > BANK_BRANCH_MAX_LENGTH) {
    errors.bank_branch = `Bank branch must be at most ${BANK_BRANCH_MAX_LENGTH} characters`;
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

export const toCreatePayload = (values: BankAccountFormValues): CreateBankAccountPayload => ({
  staff_id: Number(values.staff_id),
  account_title: values.account_title.trim(),
  account_number: values.account_number.trim(),
  bank_branch: values.bank_branch.trim(),
  status: values.status,
});

export const toUpdatePayload = (values: BankAccountFormValues): UpdateBankAccountPayload =>
  toCreatePayload(values);

export const bankAccountToFormValues = (record: BankAccount): BankAccountFormValues => ({
  staff_id: record.staff_id != null ? String(record.staff_id) : "",
  account_title: record.account_title,
  account_number: record.account_number,
  bank_branch: record.bank_branch,
  status: record.status ?? "",
});
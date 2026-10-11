import type {
  CreateLoanRequestPayload,
  LoanRequest,
  LoanRequestFormValues,
  UpdateLoanRequestPayload,
} from "./loanRequest.types";

// ─── Loan Request Form — Validation & Conversion ─────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/validators/loanRequest.validator.ts

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Exported (not just a local helper) so LoanRequestFormModal.tsx can drive
// the live "Monthly Deduction" preview as Amount/Installments are typed,
// rather than only computing this once at submit time — same formula, one
// definition, matching backend/.../loanRequest.service.ts's
// calculateMonthlyInstallment.
export const calculateMonthlyInstallment = (amount: number, installments: number): number =>
  Math.round(amount / installments);

export const validateLoanRequestForm = (
  values: LoanRequestFormValues
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (values.staff_id.trim() === "") errors.staff_id = "Employee is required";
  if (values.branch_id.trim() === "") errors.branch_id = "Campus is required";
  if (values.type.trim() === "") errors.type = "Loan type is required";

  const amount = Number(values.amount);
  if (values.amount.trim() === "") {
    errors.amount = "Amount is required";
  } else if (!Number.isFinite(amount) || amount <= 0) {
    errors.amount = "Amount must be greater than 0";
  }

  const installments = Number(values.installments);
  if (values.installments.trim() === "") {
    errors.installments = "Number of installments is required";
  } else if (!Number.isInteger(installments) || installments <= 0) {
    errors.installments = "Installments must be at least 1";
  }

  if (values.monthly_installment.trim() !== "") {
    const monthly = Number(values.monthly_installment);
    if (!Number.isFinite(monthly) || monthly <= 0) {
      errors.monthly_installment = "Monthly deduction must be greater than 0";
    }
  }

  if (!values.effective_from) {
    errors.effective_from = "Effective-from date is required";
  } else if (!DATE_REGEX.test(values.effective_from)) {
    errors.effective_from = "Effective-from date must be a valid date";
  }

  if (values.reason.trim().length > 2000) {
    errors.reason = "Reason must be at most 2000 characters";
  }
  if (values.attachment_file.trim().length > 255) {
    errors.attachment_file = "Attachment must be at most 255 characters";
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

export const toCreatePayload = (values: LoanRequestFormValues): CreateLoanRequestPayload => ({
  staff_id: Number(values.staff_id),
  branch_id: Number(values.branch_id),
  type: values.type.trim(),
  amount: Number(values.amount),
  installments: Number(values.installments),
  monthly_installment:
    values.monthly_installment.trim() === ""
      ? calculateMonthlyInstallment(Number(values.amount), Number(values.installments))
      : Number(values.monthly_installment),
  effective_from: values.effective_from,
  reason: values.reason.trim() === "" ? undefined : values.reason.trim(),
  attachment_file: values.attachment_file.trim() === "" ? undefined : values.attachment_file.trim(),
});

export const toUpdatePayload = (values: LoanRequestFormValues): UpdateLoanRequestPayload =>
  toCreatePayload(values);

export const loanRequestToFormValues = (request: LoanRequest): LoanRequestFormValues => ({
  staff_id: String(request.staff_id),
  branch_id: String(request.branch_id),
  type: request.type,
  amount: String(request.amount),
  installments: String(request.installments),
  monthly_installment: request.monthly_installment != null ? String(request.monthly_installment) : "",
  effective_from: request.effective_from ? request.effective_from.slice(0, 10) : "",
  reason: request.reason ?? "",
  attachment_file: request.attachment_file ?? "",
});
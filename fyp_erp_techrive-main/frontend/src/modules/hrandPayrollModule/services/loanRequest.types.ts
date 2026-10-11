// ─── Loan Request — Types ────────────────────────────────────────────────────
// Mirrors backend loanRequest.service.ts (loanRequestSelect) and
// validators/loanRequest.validator.ts field-for-field. `status` is the
// single approval gate here (see loanRequest.constants.ts on the backend
// for why it's a fixed enum rather than an admin-managed lookup table like
// leave_status). There used to be a second, independent approved_by_ceo
// sign-off too — removed entirely, front and back, at the user's request
// (it had no reachable UI control, so it could never actually be set,
// which meant no loan was ever deducted from payroll — see
// payrollRun.service.ts's computeLoanDeduction on the backend).

// COMPLETED (2026-08-22): a loan the payroll run has fully repaid. Set only
// by the backend (payrollRun.service.ts) once a loan's balance hits 0 —
// never selectable from the status-change UI (there's no "Complete" action;
// only Approve/Reject/Pending remain user-driven). Included here purely so
// this pill renders "Completed" instead of "Unknown" for such loans.
export const LOAN_REQUEST_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
  COMPLETED: 3,
} as const;

export const LOAN_REQUEST_STATUS_LABELS: Record<number, string> = {
  [LOAN_REQUEST_STATUS.PENDING]: "Pending",
  [LOAN_REQUEST_STATUS.APPROVED]: "Approved",
  [LOAN_REQUEST_STATUS.REJECTED]: "Rejected",
  [LOAN_REQUEST_STATUS.COMPLETED]: "Completed",
};

// Suggested via an HTML5 datalist — `type` is free text, no lookup table,
// same treatment as staff.designation on the Employee form.
export const LOAN_REQUEST_TYPE_SUGGESTIONS = [
  "Salary Advance",
  "Personal Loan",
  "Emergency Loan",
  "Medical Loan",
  "Education Loan",
];

export interface LoanRequest {
  id: number;
  staff_id: number;
  branch_id: number;
  attachment_file: string | null;
  effective_from: string;
  type: string;
  amount: number;
  installments: number;
  monthly_installment: number | null;
  reason: string | null;
  remarks: string | null;
  status: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateLoanRequestPayload {
  staff_id: number;
  branch_id: number;
  type: string;
  amount: number;
  installments: number;
  monthly_installment?: number;
  effective_from: string;
  reason?: string;
  remarks?: string;
  attachment_file?: string;
  status?: number;
}

export type UpdateLoanRequestPayload = Partial<CreateLoanRequestPayload>;

export interface ChangeLoanRequestStatusPayload {
  status: number;
  remarks?: string;
}

export interface LoanRequestFormValues {
  staff_id: string;
  branch_id: string;
  type: string;
  amount: string;
  installments: string;
  monthly_installment: string;
  effective_from: string;
  reason: string;
  attachment_file: string;
}

export const EMPTY_LOAN_REQUEST_FORM_VALUES: LoanRequestFormValues = {
  staff_id: "",
  branch_id: "",
  type: "",
  amount: "",
  installments: "",
  monthly_installment: "",
  effective_from: "",
  reason: "",
  attachment_file: "",
};

export interface ListLoanRequestsParams {
  page?: number;
  limit?: number;
  search?: string;
  staff_id?: number;
  branch_id?: number;
  status?: number;
}

export interface EmployeeLookupOption {
  id: number;
  name: string;
  reg_no: string | null;
}
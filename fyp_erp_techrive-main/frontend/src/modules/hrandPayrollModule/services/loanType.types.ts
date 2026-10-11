// ─── Loan Type — Types ────────────────────────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/loanType.service.ts

export interface LoanType {
  loan_id: number;
  loan_type: string;
  description: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface LoanTypeLookupOption {
  id: number;
  name: string;
}

export interface CreateLoanTypePayload {
  loan_type: string;
  description: string;
}

export type UpdateLoanTypePayload = Partial<CreateLoanTypePayload>;

export interface LoanTypeFormValues {
  loan_type: string;
  description: string;
}

export const EMPTY_LOAN_TYPE_FORM_VALUES: LoanTypeFormValues = {
  loan_type: "",
  description: "",
};

export interface ListLoanTypesParams {
  page?: number;
  limit?: number;
  search?: string;
}

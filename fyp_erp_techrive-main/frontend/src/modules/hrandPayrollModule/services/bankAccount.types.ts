// ─── Bank Account — Types ─────────────────────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/bankAccount.service.ts
// (bankAccountSelect) and validators/bankAccount.validator.ts field-for-field.

export const BANK_ACCOUNT_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "InActive",
} as const;

export interface BankAccount {
  id: number;
  staff_id: number | null;
  staff_reg_no: string | null;
  staff_bi_id: number | null;
  account_title: string;
  account_number: string;
  bank_branch: string;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateBankAccountPayload {
  staff_id: number;
  account_title: string;
  account_number: string;
  bank_branch: string;
  status?: string;
  staff_bi_id?: number;
}

export type UpdateBankAccountPayload = Partial<CreateBankAccountPayload>;

export interface BankAccountFormValues {
  staff_id: string;
  account_title: string;
  account_number: string;
  bank_branch: string;
  status: string;
}

export const EMPTY_BANK_ACCOUNT_FORM_VALUES: BankAccountFormValues = {
  staff_id: "",
  account_title: "",
  account_number: "",
  bank_branch: "",
  status: BANK_ACCOUNT_STATUS.INACTIVE,
};

export interface ListBankAccountsParams {
  page?: number;
  limit?: number;
  search?: string;
  staff_id?: number;
  status?: string;
}

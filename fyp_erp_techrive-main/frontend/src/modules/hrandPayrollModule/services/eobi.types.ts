// ─── EOBI / EPF Register — Types ─────────────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/eobi.service.ts and
// validators/eobi.validator.ts.
//
// Field order (Add Entry form): Employee → Campus (branch) → School (company)
// → EOBI Amount → EPF Amount → Status.

export const EOBI_STATUS = {
  PENDING: "Pending",
  PAID: "Paid",
  OVERDUE: "Overdue",
} as const;

export interface EobiEntry {
  id: number;
  staff_id: number | null;
  branch_id: number | null;
  company_id: number | null;
  eobi_amount: number;
  epf_amount: number;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateEobiEntryPayload {
  staff_id: number;
  branch_id?: number;
  company_id?: number;
  eobi_amount: number;
  epf_amount: number;
  status?: string;
}

export type UpdateEobiEntryPayload = Partial<CreateEobiEntryPayload>;

export interface EobiFormValues {
  staff_id: string;
  branch_id: string;
  company_id: string;
  eobi_amount: string;
  epf_amount: string;
  status: string;
}

export const EMPTY_EOBI_FORM_VALUES: EobiFormValues = {
  staff_id: "",
  branch_id: "",
  company_id: "",
  eobi_amount: "",
  epf_amount: "",
  status: EOBI_STATUS.PENDING,
};

export interface ListEobiEntriesParams {
  page?: number;
  limit?: number;
  search?: string;
  staff_id?: number;
  branch_id?: number;
  status?: string;
}
// ─── Salary Sheet — Types ─────────────────────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/salary.service.ts
// (salarySelect) and validators/salary.validator.ts field-for-field.

export const PAY_STATUS = { YES: "Yes", NO: "No" } as const;

export const SALARY_STATUS = {
  PENDING: "Pending",
  INACTIVE: "Inactive",
  ACTIVE: "Active",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID: "Paid",
} as const;

export const APPROVAL_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

export const MONTH_OPTIONS = [
  { value: "01", label: "January" }, { value: "02", label: "February" },
  { value: "03", label: "March" }, { value: "04", label: "April" },
  { value: "05", label: "May" }, { value: "06", label: "June" },
  { value: "07", label: "July" }, { value: "08", label: "August" },
  { value: "09", label: "September" }, { value: "10", label: "October" },
  { value: "11", label: "November" }, { value: "12", label: "December" },
] as const;

// ─── Applied allowance (read-only, returned nested on a SalarySheet) ──────
// Mirrors backend salary.service.ts's AppliedAllowanceView.
export interface AppliedSalaryAllowance {
  id: number;
  allowance_type_id: number;
  name: string;
  amount: number;
  is_taxable: boolean;
}

export interface SalarySheet {
  id: number;
  branch_id: number | null;
  sheet_code: string;
  name: string | null;
  ledger_id: number | null;
  staff_id: number | null;
  staff_category: string | null;
  gross_salary: number;
  basic_salary: number | null;
  medical_allowance: string | null;
  house_rent_allowance: string | null;
  conveyance_allowance: number | null;
  training: number | null;
  eobi_amount: number | null;
  epf_amount: number | null;
  tax_amount: number | null;
  loan_amount: number | null;
  remaining_amount: number | null;
  pay_loan: number | null;
  description: string | null;
  net_salary: number | null;
  pay_status: string | null;
  other_deduction: number | null;
  date: string | null;
  year_id: number | null;
  month_id: string | null;
  leaves: number | null;
  leaves_deduction: number | null;
  gross_before_adj: number | null;
  total_epf: number | null;
  total_eobi: number | null;
  total_tax: number | null;
  total_salary: number | null;
  salary_status: string | null;
  created_at: string | null;
  updated_at: string | null;
  principal_approval_status: string | null;
  principal_approved_by: string | null;
  accountant_salary_status: string | null;
  dgm_salary_status: string | null;
  gm_salary_status: string | null;
  ceo_salary_status: string | null;
  gm_name_salary_approve: string | null;
  accountant_name_salary_approve: string | null;
  dgm_name_salary_approve: string | null;
  ceo_name_salary_approve: string | null;
  arrears: number | null;
  remarks: string | null;
  bank_account: string | null;
  financial_year: number | null;
  // Added 2026-08-14 — see salary.constants.ts's "Allowances & Auto Tax
  // Calculation" note on the backend.
  exempt_amount: number | null;
  tax_slab_id: number | null;
  allowances: AppliedSalaryAllowance[];
  // 2026-08-22, fixes audit finding P-01: present only on the response to
  // a create/update call that auto-calculated tax (not on every GET/list —
  // see salary.service.ts's createSalarySheet/updateSalarySheet). True
  // when the taxable amount fell in a genuine gap between configured slabs
  // (as opposed to no slabs being configured at all, which is normal).
  tax_slab_gap_warning?: boolean;
  // 2026-08-22, fixes audit finding P-04 + adds the "how was this
  // calculated" explainer: present only on a create/update response when
  // the corresponding figure was auto-calculated this call. Shown via
  // CalculationInfoPopover next to the Tax/EOBI/EPF fields.
  tax_calculation_breakdown?: string | null;
  eobi_calculation_breakdown?: string | null;
  epf_calculation_breakdown?: string | null;
}

export interface CreateSalaryAllowanceEntry {
  allowance_type_id: number;
  amount?: number;
}

export interface CreateSalaryPayload {
  staff_id: number;
  branch_id: number;
  ledger_id: number;
  financial_year: number;
  date: string;
  month_id: string;
  year_id: number;
  staff_category?: string;
  description?: string;
  bank_account?: string;
  remarks?: string;
  // Required UNLESS `allowances` is provided — in that case it's derived
  // server-side and this is ignored. See salary.constants.ts on the backend.
  gross_salary?: number;
  basic_salary?: number;
  medical_allowance?: number;
  house_rent_allowance?: number;
  conveyance_allowance?: number;
  training?: number;
  eobi_amount?: number;
  epf_amount?: number;
  // Manual override — when omitted and `allowances`/`exempt_amount` are
  // present, tax is auto-calculated from the fiscal year's tax slabs.
  tax_amount?: number;
  exempt_amount?: number;
  loan_amount?: number;
  pay_loan?: number;
  other_deduction?: number;
  leaves?: number;
  leaves_deduction?: number;
  arrears?: number;
  allowances?: CreateSalaryAllowanceEntry[];
  pay_status?: string;
  salary_status?: string;
}

export type UpdateSalaryPayload = Partial<CreateSalaryPayload>;

// Single HR approval step. Sent as hr_status/hr_approved_by; the backend
// maps this onto the DB's "accountant_*" columns and also syncs the
// sheet's overall salary_status from it (Approved/Rejected/Pending) — see
// updateSalaryApproval in salary.service.ts. The other four legacy chain
// fields (principal/dgm/gm/ceo) still exist on SalarySheet above purely
// because dropping DB columns needs a real migration; nothing in the app
// reads or writes them anymore.
export interface UpdateSalaryApprovalPayload {
  ceo_status?: "Pending" | "Approved" | "Rejected";
  ceo_approved_by?: string;
  hr_status?: "Pending" | "Approved" | "Rejected";
  hr_approved_by?: string;
}

// One row in the Salary form's allowance picker. `name`/`calculation_type`
// carry over from the picked hr_allowance_types option purely for display
// (computing the live preview amount) — never sent to the API as-is; see
// salary.validation.ts's toCreatePayload/toUpdatePayload.
export interface SalaryAllowanceFormEntry {
  allowance_type_id: string;
  name: string;
  calculation_type: "FIXED" | "PERCENTAGE";
  default_value?: number;
  is_taxable: boolean;
  amount: string; // blank = use the allowance type's own default
}

export interface SalaryFormValues {
  calculation_mode?: "BASIC" | "GROSS";
  staff_id: string;
  branch_id: string;
  ledger_id: string;
  financial_year: string;
  date: string;
  month_id: string;
  year_id: string;
  staff_category: string;
  description: string;
  bank_account: string;
  remarks: string;
  gross_salary: string;
  basic_salary: string;
  medical_allowance: string;
  house_rent_allowance: string;
  conveyance_allowance: string;
  training: string;
  eobi_amount: string;
  epf_amount: string;
  tax_amount: string;
  exempt_amount: string;
  loan_amount: string;
  pay_loan: string;
  other_deduction: string;
  leaves: string;
  leaves_deduction: string;
  arrears: string;
  pay_status: string;
  salary_status: string;
  allowances: SalaryAllowanceFormEntry[];
}

export const EMPTY_SALARY_FORM_VALUES: SalaryFormValues = {
  calculation_mode: "BASIC",
  staff_id: "",
  branch_id: "",
  ledger_id: "",
  financial_year: "",
  date: new Date().toISOString().slice(0, 10),
  month_id: String(new Date().getMonth() + 1).padStart(2, "0"),
  year_id: String(new Date().getFullYear()),
  staff_category: "",
  description: "",
  bank_account: "",
  remarks: "",
  gross_salary: "",
  basic_salary: "",
  medical_allowance: "",
  house_rent_allowance: "",
  conveyance_allowance: "",
  training: "",
  eobi_amount: "",
  epf_amount: "",
  tax_amount: "",
  exempt_amount: "",
  loan_amount: "",
  pay_loan: "",
  other_deduction: "",
  leaves: "",
  leaves_deduction: "",
  arrears: "",
  pay_status: PAY_STATUS.YES,
  salary_status: SALARY_STATUS.INACTIVE,
  allowances: [],
};

export interface ListSalaryParams {
  page?: number;
  limit?: number;
  search?: string;
  staff_id?: number;
  branch_id?: number;
  month_id?: string;
  year_id?: number;
  salary_status?: string;
}

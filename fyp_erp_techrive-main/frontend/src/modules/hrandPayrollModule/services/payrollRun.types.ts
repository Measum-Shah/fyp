// ─── Payroll Run — Types ──────────────────────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/payrollRun.service.ts
// and validators/payrollRun.validator.ts.

export const PAYROLL_RUN_STATUS = {
  QUEUED: 0,
  GENERATED: 1,
  FAILED: 2,
} as const;

export const PAYROLL_RUN_STATUS_LABEL: Record<number, string> = {
  [PAYROLL_RUN_STATUS.QUEUED]: "Queued",
  [PAYROLL_RUN_STATUS.GENERATED]: "Generated",
  [PAYROLL_RUN_STATUS.FAILED]: "Failed",
};

export interface EligibleStaffMember {
  id: number;
  name: string;
  reg_no: string | null;
  has_active_bank_account: boolean;
}

export interface CreatePayrollRunPayload {
  branch_id: number;
  month_year: string;
  ledger_id: number;
  financial_year: number;
  staff_ids: number[];
}

export interface RunResultEntry {
  staff_id: number;
  staff_name: string;
  reason?: string;
}

export interface RunPayrollBatchResult {
  generated: RunResultEntry[];
  skipped: RunResultEntry[];
}

export interface PayrollRunMember {
  id: number;
  employee_id: number;
  employee_name: string;
  reg_no: string | null;
  status: number;
  created_at: string | null;
  salary_sheet_id: number | null;
  net_salary: number | null;
  salary_status: string | null;
}

export interface ListPayrollRunParams {
  branch_id: number;
  month_year: string;
  page?: number;
  limit?: number;
}

export interface GenerateRunFormValues {
  branch_id: string;
  month_year: string;
  ledger_id: string;
  financial_year: string;
}

const now = new Date();
export const EMPTY_GENERATE_RUN_FORM_VALUES: GenerateRunFormValues = {
  branch_id: "",
  month_year: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  ledger_id: "",
  financial_year: String(now.getFullYear()),
};

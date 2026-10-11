// ─── Payroll Reports — Shared Types ──────────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/payrollReport.service.ts
// (row shapes) and .../validators/payrollReport.validator.ts (query params).

import type { PaginationMeta } from "./employee.types";

/* ── Payroll Run Summary ──────────────────────────────────────────────────── */
export interface PayrollRunSummaryParams {
  branch_id?: number;
  company_id?: number;
  month_year?: string;
}

export interface PayrollRunSummaryRow {
  branch_id: number;
  branch_name: string;
  month_year: string;
  employee_count: number;
  total_gross: number;
  total_net: number;
  total_deductions: number;
}

export interface PayrollRunSummaryResponse {
  message: string;
  data: PayrollRunSummaryRow[];
  meta: { totalRuns: number };
}

/* ── Salary Register ──────────────────────────────────────────────────────── */
export interface SalaryRegisterParams {
  page?: number;
  limit?: number;
  search?: string;
  staff_id?: number;
  branch_id?: number;
  company_id?: number;
  month_id?: string;
  year_id?: number;
  salary_status?: string;
}

export interface SalaryRegisterRow {
  id: number;
  employee_id: number;
  employee_name: string;
  reg_no: string | null;
  branch_id: number;
  branch_name: string;
  month_id: string | null;
  year_id: number | null;
  gross_salary: number;
  basic_salary: number | null;
  medical_allowance: string;
  house_rent_allowance: string;
  conveyance_allowance: number | null;
  eobi_amount: number | null;
  epf_amount: number | null;
  tax_amount: number | null;
  loan_amount: number | null;
  net_salary: number | null;
  salary_status: string;
}

export interface SalaryRegisterResponse {
  message: string;
  data: SalaryRegisterRow[];
  meta: PaginationMeta;
}

/* ── Loan Register ────────────────────────────────────────────────────────── */
export interface LoanRegisterParams {
  page?: number;
  limit?: number;
  search?: string;
  staff_id?: number;
  branch_id?: number;
  company_id?: number;
  status?: number;
}

export interface LoanRegisterRow {
  id: number;
  employee_id: number;
  employee_name: string;
  reg_no: string | null;
  branch_id: number;
  branch_name: string;
  type: string;
  amount: number;
  installments: number;
  monthly_installment: number | null;
  status: number;
  effective_from: string;
  reason: string | null;
  remaining_balance: number | null;
}

export interface LoanRegisterResponse {
  message: string;
  data: LoanRegisterRow[];
  meta: PaginationMeta;
}

/* ── Gross Salary Report ──────────────────────────────────────────────────── */
export interface GrossSalaryParams {
  month_id?: string;
  year_id?: number;
  branch_id?: number;
  company_id?: number;
  department_id?: number;
}

// Employee info + Gross Salary + Allowances + Deductions + Payroll
// Deductions + Arrears + Leaves + Net Salary — every figure the Gross
// Salary Report table/export needs, read straight off erp_staff_salaries
// (see payrollReport.service.ts's getGrossSalaryReport for exactly how
// each figure is sourced — nothing here is recalculated on the frontend).
//
// allowances/deductions/payroll_deductions are still the same rolled-up
// totals as before; each is now paired with a `*_by_type` map naming the
// individual components that sum to it (e.g. `allowances_by_type:
// { medical_allowance: 5000, house_rent_allowance: 30000,
// allowance_type_7: 12000 }`). Keys match the `key` field in this
// response's meta.allowanceColumns/deductionColumns/
// payrollDeductionColumns — render one table/CSV column per entry in
// those arrays and look up `row.<group>_by_type[column.key] ?? 0`, so a
// brand-new allowance type added later shows up automatically with no
// frontend code change.
export interface GrossSalaryRow {
  id: number;
  employee_id: number;
  employee_name: string;
  reg_no: string | null;
  branch_id: number;
  branch_name: string;
  department_name: string;
  gross_salary: number;
  allowances: number;
  allowances_by_type: Record<string, number>;
  deductions: number | null;
  deductions_by_type: Record<string, number>;
  payroll_deductions: number;
  payroll_deductions_by_type: Record<string, number>;
  arrears: number;
  leaves: number;
  net_salary: number | null;
  salary_status: string;
}

// A single named component column within one of the three breakdown
// groups (Allowances / Deductions / Payroll Deductions). `key` matches a
// key in the corresponding row's `*_by_type` map; `label` is the
// display/CSV header text.
export interface GrossSalaryColumn {
  key: string;
  label: string;
}

export interface GrossSalaryReportResponse {
  message: string;
  data: GrossSalaryRow[];
  meta: {
    employeeCount: number;
    totalGross: number;
    totalNet: number;
    totalAllowances: number;
    totalDeductions: number;
    month_id: string;
    year_id: number;
    allowanceColumns: GrossSalaryColumn[];
    deductionColumns: GrossSalaryColumn[];
    payrollDeductionColumns: GrossSalaryColumn[];
  };
}

/* ── Bulk Salary Slips ────────────────────────────────────────────────────── */
export interface SalarySlipsParams {
  month_id: string;
  year_id: number;
  branch_id?: number;
  company_id?: number;
  department_id?: number;
  staff_ids?: string;
}

export interface SalarySlipRow {
  sheet_id: number;
  employee_id: number;
  employee_name: string;
  reg_no: string | null;
  designation: string | null;
  department_name: string;
  branch_name: string;
  company_name: string;
  cnic: string | null;
  bank_account: string | null;
  account_title: string | null;
  account_number: string | null;
  month_id: string;
  year_id: number;
  basic_salary: number | null;
  medical_allowance: string;
  house_rent_allowance: string;
  conveyance_allowance: number | null;
  gross_salary: number;
  eobi_amount: number | null;
  epf_amount: number | null;
  tax_amount: number | null;
  loan_amount: number | null;
  other_deduction: number | null;
  arrears: number;
  net_salary: number | null;
  salary_status: string;
}

export interface SalarySlipsResponse {
  message: string;
  data: SalarySlipRow[];
  meta: { total: number };
}
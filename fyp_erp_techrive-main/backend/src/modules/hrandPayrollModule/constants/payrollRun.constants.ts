// ─── Payroll Run Constants ───────────────────────────────────────────────────
// Table: payroll_employees — tracks which employees are included in a given
// branch's payroll run for a given month. It carries no salary figures
// itself; the actual figures live in erp_staff_salaries (Salary Sheet). This
// feature's job is purely to batch-create Salary Sheets for many employees
// at once, using each employee's own stored payroll fields (staff.salary,
// staff.basic_salary, staff.conveyance, staff.house_rent,
// staff.medical_allowances, staff.epf_amount, staff.eobi_amount,
// staff.tax_percentage) as the source figures instead of manual entry.
//
// month_year is a single VARCHAR(10) column (not separate month/year ints
// like erp_staff_salaries) — stored/accepted here as "YYYY-MM" and converted
// to erp_staff_salaries' month_id/year_id under the hood.
//
// Deliberately NOT pulled into the batch-generated figures: loan deductions,
// arrears, leave deductions, other manual adjustments. Each Salary Sheet
// this creates is a normal, fully-editable sheet (see salary.service.ts) —
// payroll can open any of them afterward and add a loan deduction, arrears,
// etc. before it enters the approval chain. Batch-generating a rough draft
// for everyone and refining a few afterward is faster than typing every
// figure by hand for every employee, every month.

export const PAYROLL_RUN_STATUS = {
  QUEUED: 0,
  GENERATED: 1,
  FAILED: 2,
} as const;

export const MONTH_YEAR_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

import { z } from "zod";

// ─── Payroll Reports — Validators ───────────────────────────────────────────
// Mirrors report.validator.ts's / leaveReport.validator.ts's conventions.
// All three reports here read from tables Payroll & Salary already owns
// (payroll_employees, erp_staff_salaries, request_loan_employee).

// ─── GET /reports/payroll-run-summary ───────────────────────────────────────
// month_year stays a free "YYYY-MM" string, same as payrollRun.validator.ts's
// own CreatePayrollRunInput — not date-regex-validated here since it's a
// partial (year-month only) value, not a full date.
export const payrollRunSummaryQuerySchema = z.object({
  branch_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  month_year: z.string().trim().max(10).optional(),
});

export type PayrollRunSummaryQuery = z.infer<typeof payrollRunSummaryQuerySchema>;

// ─── GET /reports/salary-register ───────────────────────────────────────────
export const salaryRegisterQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  staff_id: z.coerce.number().int().positive().optional(),
  branch_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  month_id: z.string().trim().max(2).optional(),
  year_id: z.coerce.number().int().positive().optional(),
  salary_status: z.string().trim().max(50).optional(),
});

export type SalaryRegisterQuery = z.infer<typeof salaryRegisterQuerySchema>;

// ─── GET /reports/loan-register ─────────────────────────────────────────────
export const loanRegisterQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  staff_id: z.coerce.number().int().positive().optional(),
  branch_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  status: z.coerce.number().int().min(0).max(2).optional(),
});

export type LoanRegisterQuery = z.infer<typeof loanRegisterQuerySchema>;

// ─── GET /reports/gross-salary ───────────────────────────────────────────────
// "How much salary did we pay this month" — month_id/year_id are OPTIONAL
// and default to the current calendar month/year in the service when
// omitted, so the dashboard widget and the report page's first paint can
// both call this with no params and get "this month" for free.
export const grossSalaryQuerySchema = z.object({
  month_id: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])$/, "month_id must be '01'..'12'")
    .optional(),
  year_id: z.coerce.number().int().positive().optional(),
  branch_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  department_id: z.coerce.number().int().positive().optional(),
});

export type GrossSalaryQuery = z.infer<typeof grossSalaryQuerySchema>;

// ─── GET /reports/salary-slips ───────────────────────────────────────────────
// Bulk salary slip data for print. month_id/year_id are REQUIRED here
// (unlike gross-salary above) — printing slips for "whatever month happens
// to be current" by accident is exactly the kind of mistake a required
// param prevents; the frontend always passes the month the user picked.
export const salarySlipsQuerySchema = z.object({
  month_id: z
    .string({ error: "Month is required" })
    .trim()
    .regex(/^(0[1-9]|1[0-2])$/, "month_id must be '01'..'12'"),
  year_id: z.coerce.number({ error: "Year is required" }).int().positive(),
  branch_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  department_id: z.coerce.number().int().positive().optional(),
  staff_ids: z
    .string()
    .trim()
    .transform((val) => val.split(",").map((v) => Number(v.trim())).filter((n) => Number.isFinite(n) && n > 0))
    .optional(),
});

export type SalarySlipsQuery = z.infer<typeof salarySlipsQuerySchema>;

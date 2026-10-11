// ─── Payroll Deduction Formula Constants ────────────────────────────────────
// Table: hr_payroll_deduction_formulas (2026-08-22, NEW — fixes audit
// finding #3). A small admin-managed master, same CRUD shape as Allowance
// Types / Tax Slabs, defining how a leave/attendance deductible day is
// turned into a Rupee amount. See schema.prisma's model comment and
// payrollRun.service.ts's computeLeaveDeduction() for how it's used.

export const DEDUCTION_FORMULA_NAME_MAX_LENGTH = 255;

export const DEDUCTION_FORMULA_BASE_TYPE = {
  BASIC_SALARY: 1,
  GROSS_SALARY: 2,
} as const;

export const DEDUCTION_FORMULA_DIVISOR_TYPE = {
  CALENDAR_DAYS_IN_MONTH: 1,
  FIXED_30: 2,
} as const;

export const DEDUCTION_FORMULA_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

export const DEDUCTION_FORMULA_DEFAULT_FLAG = {
  IS_DEFAULT: 1,
  NOT_DEFAULT: 0,
} as const;

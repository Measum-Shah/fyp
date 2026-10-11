// ─── Payroll Deduction Formula — Types ──────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/payrollDeductionFormula.service.ts

export const DEDUCTION_FORMULA_BASE_TYPE = { BASIC_SALARY: 1, GROSS_SALARY: 2 } as const;
export const DEDUCTION_FORMULA_DIVISOR_TYPE = { CALENDAR_DAYS_IN_MONTH: 1, FIXED_30: 2 } as const;
export const DEDUCTION_FORMULA_STATUS = { ACTIVE: 1, INACTIVE: 0 } as const;

export interface DeductionFormula {
  id: number;
  name: string;
  base_type: number;
  divisor_type: number;
  is_default: number;
  status: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateDeductionFormulaPayload {
  name: string;
  base_type?: number;
  divisor_type?: number;
  is_default?: 0 | 1;
  status?: number;
}

export type UpdateDeductionFormulaPayload = Partial<CreateDeductionFormulaPayload>;

export interface DeductionFormulaFormValues {
  name: string;
  base_type: number;
  divisor_type: number;
  is_default: 0 | 1;
  status: number;
}

export const EMPTY_DEDUCTION_FORMULA_FORM_VALUES: DeductionFormulaFormValues = {
  name: "",
  base_type: DEDUCTION_FORMULA_BASE_TYPE.BASIC_SALARY,
  divisor_type: DEDUCTION_FORMULA_DIVISOR_TYPE.CALENDAR_DAYS_IN_MONTH,
  is_default: 0,
  status: DEDUCTION_FORMULA_STATUS.ACTIVE,
};

export interface ListDeductionFormulasParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
}

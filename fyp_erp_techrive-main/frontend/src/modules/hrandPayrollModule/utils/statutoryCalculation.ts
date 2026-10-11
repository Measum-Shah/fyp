// ─── EOBI / EPF (Provident Fund) Calculation Preview ────────────────────────
// Mirrors backend/.../utils/statutory-calculation.util.ts exactly, so a
// form can show "this is what will be auto-calculated" instantly as the
// user types, before the record is even saved. The backend remains the
// source of truth — this is only a live preview.
//
// See the backend file for the full explanation of the formulas; the
// short version: EOBI is 1% of a fixed government-notified minimum wage
// (not the employee's salary), EPF is a company-policy percentage
// (default 5%) of basic salary.
export const STATUTORY_CALCULATION_DEFAULTS = {
  EOBI_MINIMUM_WAGE: 40000,
  EOBI_EMPLOYEE_PERCENT: 1,
  EPF_PERCENT_OF_BASIC: 5,
} as const;

export interface StatutoryPreviewResult {
  amount: number;
  breakdown: string;
}

export const previewAutoEobi = (): StatutoryPreviewResult => {
  const { EOBI_MINIMUM_WAGE, EOBI_EMPLOYEE_PERCENT } = STATUTORY_CALCULATION_DEFAULTS;
  const amount = Math.round((EOBI_EMPLOYEE_PERCENT / 100) * EOBI_MINIMUM_WAGE);
  const breakdown =
    `EOBI (Employees' Old-Age Benefits) — under Pakistan's EOBI Act, the employee's own ` +
    `contribution is ${EOBI_EMPLOYEE_PERCENT}% of the government-notified minimum wage ` +
    `(currently ₨${EOBI_MINIMUM_WAGE.toLocaleString()}). The employer separately pays a further ` +
    `5% of the same base — that portion is not deducted from your salary. ` +
    `(${EOBI_EMPLOYEE_PERCENT}% × ₨${EOBI_MINIMUM_WAGE.toLocaleString()} = ₨${amount.toLocaleString()}). ` +
    `Minimum wage varies by province and changes periodically.`;
  return { amount, breakdown };
};

export const previewAutoEpf = (basicSalary: number): StatutoryPreviewResult => {
  const { EPF_PERCENT_OF_BASIC } = STATUTORY_CALCULATION_DEFAULTS;
  const safeBasic = Number.isFinite(basicSalary) && basicSalary > 0 ? basicSalary : 0;
  const amount = Math.round((EPF_PERCENT_OF_BASIC / 100) * safeBasic);
  const breakdown =
    `EPF / Provident Fund — Pakistani law has no single fixed statutory percentage for this ` +
    `(unlike EOBI); it's a school / university-policy figure, commonly 8–10% of basic salary. This ` +
    `organization's default rate is ${EPF_PERCENT_OF_BASIC}% of basic salary. ` +
    `(${EPF_PERCENT_OF_BASIC}% × ₨${safeBasic.toLocaleString()} = ₨${amount.toLocaleString()})`;
  return { amount, breakdown };
};
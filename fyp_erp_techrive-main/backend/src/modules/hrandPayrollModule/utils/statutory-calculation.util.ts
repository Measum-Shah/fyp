// ─── EOBI / EPF (Provident Fund) Calculation Helper ─────────────────────────
// Fixes audit finding P-04 (P2): EOBI/EPF were plain manually-typed numbers
// with no formula behind them. Kept standalone (no prisma import), same
// convention as tax-calculation.util.ts, so it stays a pure, easily-testable
// function independent of the DB.
//
// This used to read its percentages/minimum-wage from a configurable
// "Statutory Settings" table (hr_statutory_contribution_settings) with a
// whole CRUD screen behind it. That indirection has been removed — EOBI/EPF
// now always auto-calculate straight from the fixed constants below
// (statutoryCalculation.constants.ts). Every place that used to auto-fill
// from that settings table (Salary Sheets, the Employee salary structure,
// and an Increment's New PF) now calls these two functions directly.
//
// EOBI: per Pakistan's Employees' Old-Age Benefits Act, the EMPLOYEE's own
// contribution is a percentage (currently 1%) of the government-notified
// MINIMUM WAGE — not of their actual salary. The employer separately
// contributes a further 5% of the same base, but that amount is not
// deducted from the employee and is therefore out of scope for a payslip
// deduction field.
//
// EPF ("Provident Fund" in Pakistani usage): there is NO single fixed
// statutory percentage in Pakistani law — unlike EOBI, it's a
// company-policy figure, commonly 8-10% of basic salary, set by the
// employer or a collective bargaining agreement. This calculator applies
// the organization's configured default percentage; it does not claim
// that percentage is legally mandated.
//
// Every caller can still override either figure manually: these functions
// are only ever invoked when nothing was explicitly entered (see
// salary.service.ts / employee.service.ts / increment.service.ts's
// "explicit value always wins" handling) — the UI's "Add manually" option
// on the ⓘ calculation popover is exactly that override.

import { STATUTORY_CALCULATION_DEFAULTS } from "../constants/statutoryCalculation.constants";

export interface EobiCalculationResult {
  eobi_amount: number;
  calculation_breakdown: string;
}

export interface EpfCalculationResult {
  epf_amount: number;
  calculation_breakdown: string;
}

export const calculateAutoEobi = (): EobiCalculationResult => {
  const { EOBI_MINIMUM_WAGE, EOBI_EMPLOYEE_PERCENT } = STATUTORY_CALCULATION_DEFAULTS;
  const amount = Math.round((EOBI_EMPLOYEE_PERCENT / 100) * EOBI_MINIMUM_WAGE);
  const calculation_breakdown =
    `EOBI (Employees' Old-Age Benefits) — under Pakistan's EOBI Act, the employee's own ` +
    `contribution is ${EOBI_EMPLOYEE_PERCENT}% of the government-notified minimum wage ` +
    `(currently ₨${EOBI_MINIMUM_WAGE.toLocaleString()}). The employer separately pays a further ` +
    `5% of the same base — that portion is not deducted from your salary. ` +
    `(${EOBI_EMPLOYEE_PERCENT}% × ₨${EOBI_MINIMUM_WAGE.toLocaleString()} = ₨${amount.toLocaleString()}). ` +
    `Minimum wage varies by province and changes periodically — verify this figure against your ` +
    `current provincial notification.`;
  return { eobi_amount: amount, calculation_breakdown };
};

export const calculateAutoEpf = (basicSalary: number): EpfCalculationResult => {
  const { EPF_PERCENT_OF_BASIC } = STATUTORY_CALCULATION_DEFAULTS;
  const amount = Math.round((EPF_PERCENT_OF_BASIC / 100) * basicSalary);
  const calculation_breakdown =
    `EPF / Provident Fund — Pakistani law has no single fixed statutory percentage for this ` +
    `(unlike EOBI); it's a school / university-policy figure, commonly 8–10% of basic salary. This ` +
    `organization's default rate is ${EPF_PERCENT_OF_BASIC}% of basic salary. ` +
    `(${EPF_PERCENT_OF_BASIC}% × ₨${basicSalary.toLocaleString()} = ₨${amount.toLocaleString()})`;
  return { epf_amount: amount, calculation_breakdown };
};
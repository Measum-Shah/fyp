// ─── Fiscal Year Constants ────────────────────────────────────────────────────
// Table: erp_financial_years — this ALREADY EXISTS in the schema (it's what
// erp_staff_salaries.financial_year points at). This module just gives it a
// proper CRUD screen ("Fiscal Years") so Tax Slabs (hr_tax_slabs) and Salary
// Sheets have something real to pick from instead of a bare numeric id
// field, which is what the Salary form did before this feature.
//
// status is a SmallInt (1/0), same convention as erp_tax_settings.status —
// not the string "Active"/"InActive" convention bankAccount.constants.ts
// uses, because that's what this specific column actually is.

export const FISCAL_YEAR_NAME_MAX_LENGTH = 255;

export const FISCAL_YEAR_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

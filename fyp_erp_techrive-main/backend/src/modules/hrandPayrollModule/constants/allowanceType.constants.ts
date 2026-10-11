// ─── Allowance Type Constants ────────────────────────────────────────────────
// Table: hr_allowance_types — a reusable master list of allowance types
// (e.g. "Medical", "House Rent", "Fuel"), picked from when building a Salary
// Sheet's earnings (see salary.service.ts's applyAllowances). This is the
// dynamic replacement for the old fixed medical/house_rent/conveyance
// columns on erp_staff_salaries — those three still exist and still work,
// this is additive, not a migration away from them.
//
// calculation_type drives how default_value is interpreted when an
// allowance is applied to a sheet without an explicit override amount:
//   FIXED      -> default_value is a flat Rupee amount
//   PERCENTAGE -> default_value is a percentage of the sheet's basic_salary
//
// is_taxable is only ever this type's *default*. The value actually used
// for tax calculation is the one snapshotted onto hr_salary_allowances at
// the moment the allowance was applied — see salary.constants.ts's note on
// exempt_amount for why (an edit here must never retroactively change the
// tax already computed on a past sheet).

export const ALLOWANCE_TYPE_NAME_MAX_LENGTH = 100;
export const ALLOWANCE_TYPE_CODE_MAX_LENGTH = 50;

export const ALLOWANCE_CALCULATION_TYPE = {
  FIXED: "FIXED",
  PERCENTAGE: "PERCENTAGE",
} as const;

export const ALLOWANCE_TYPE_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

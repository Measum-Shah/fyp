// ─── Salary Sheet Constants ───────────────────────────────────────────────────
// Table: erp_staff_salaries — the actual monthly payroll record per employee.
//
// A few schema realities worth flagging up front (same spirit as
// branch.constants.ts / employee.constants.ts):
//
// - ledger_id (NOT NULL int) looks like it references erp_ledgers, but there
//   is no relation defined anywhere in this schema (nothing is), and
//   erp_ledgers is out of scope for this feature. Exposed as a plain
//   required integer, same treatment as branch_id/bank_id were in
//   branch.constants.ts before those got real lookups.
// - financial_year (NOT NULL int) likely references erp_financial_years,
//   same story — plain required integer here.
// - month_id is a VARCHAR, not an int, despite the name (confirmed against
//   the raw SQL) — kept as a "01".."12" string to match the column type.
// - net_salary / total_salary / total_epf / total_eobi / total_tax /
//   gross_before_adj / remaining_amount are independent nullable columns
//   with no computed/generated-column constraint in Postgres — this schema
//   does not derive them for you. This service computes and stores them on
//   every create/update so the numbers are always internally consistent,
//   documented next to that logic in salary.service.ts.
// - The multi-level approval columns (accountant/dgm/gm/ceo/principal) each
//   pair a *_status field with a *_name (or *_approved_by) field. All default
//   to 'Pending' at the DB level and are only meant to be changed by that
//   approval step — the Create form never sets them; only Update can.

// ─── Allowances & Auto Tax Calculation (added 2026-08-14) ──────────────────
// erp_staff_salaries also picked up two new columns (see
// database-migrations/2026_08_14_add_allowances_and_tax_slabs.sql):
//   - exempt_amount: a manual, additional slice of the taxable base the
//     user wants shielded from tax entirely (e.g. "pay part of this in
//     untaxed cash"). Subtracted from the taxable base before tax slabs
//     are matched. Defaults to 0.
//   - tax_slab_id: which hr_tax_slabs row was applied when tax_amount was
//     auto-calculated. NULL when tax_amount was entered manually instead
//     (no slabs configured for that financial_year, or the user typed a
//     value themselves) — see salary.service.ts's resolveTaxAmount.
//
// A Create/Update request may optionally include an `allowances` array —
// `{ allowance_type_id, amount? }[]` — picked from the reusable
// hr_allowance_types master list (see allowanceType.constants.ts). When
// present:
//   - gross_salary is derived automatically as basic_salary + the three
//     legacy fixed allowance fields (medical/house_rent/conveyance, still
//     supported) + the sum of every resolved dynamic allowance amount —
//     any gross_salary sent in the same request is ignored.
//   - tax_amount is derived automatically from the taxable base (basic
//     salary + taxable dynamic allowances − exempt_amount) matched
//     against hr_tax_slabs for the sheet's financial_year, UNLESS the
//     request also explicitly sends tax_amount, which always wins as a
//     manual override.
// When `allowances` is omitted entirely, every field behaves exactly as it
// did before this feature (fully backward compatible with existing sheets
// and the old flat Salary form).

export const SALARY_SHEET_CODE_MAX_LENGTH = 191;
export const SALARY_STAFF_CATEGORY_MAX_LENGTH = 100;
export const SALARY_DESCRIPTION_MAX_LENGTH = 191;
export const SALARY_BANK_ACCOUNT_MAX_LENGTH = 255;
export const SALARY_APPROVAL_NAME_MAX_LENGTH = 191;
export const SALARY_MONTH_ID_MAX_LENGTH = 191;

export const PAY_STATUS = {
  YES: "Yes",
  NO: "No",
} as const;

export const SALARY_STATUS = {
  PENDING: "Pending",
  INACTIVE: "Inactive",
  ACTIVE: "Active",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID: "Paid",
} as const;

export const APPROVAL_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

// Approval fields on erp_staff_salaries.
// Salaries stay Inactive until CEO approval is granted.
export const CEO_APPROVAL_STATUS_FIELD = "ceo_salary_status" as const;
export const CEO_APPROVAL_NAME_FIELD = "ceo_name_salary_approve" as const;
export const HR_APPROVAL_STATUS_FIELD = "accountant_salary_status" as const;
export const HR_APPROVAL_NAME_FIELD = "accountant_name_salary_approve" as const;

export const APPROVAL_FIELDS = [CEO_APPROVAL_STATUS_FIELD, HR_APPROVAL_STATUS_FIELD] as const;


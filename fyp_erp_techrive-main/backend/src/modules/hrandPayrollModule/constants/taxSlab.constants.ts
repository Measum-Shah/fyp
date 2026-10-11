// ─── Tax Slab Constants ───────────────────────────────────────────────────────
// Table: hr_tax_slabs — progressive/FBR-style income tax slabs, scoped to a
// Fiscal Year (fiscal_year_id -> erp_financial_years.id, see
// fiscalYear.constants.ts). Used by salary.service.ts to auto-compute
// tax_amount on a salary sheet from its taxable base.
//
// Formula for a taxable amount T that falls in a given slab:
//     tax = fixed_amount + (tax_percent / 100) * (T - min_amount)
// i.e. the standard FBR salary-tax-slab formula, where fixed_amount already
// bakes in the cumulative tax owed from every lower slab, and tax_percent
// applies only to the portion of T above this slab's own min_amount.
//
// max_amount = null means "no upper bound" (the top/last slab). Slabs for
// a given fiscal year should not overlap — enforced at the application
// layer (see taxSlab.service.ts's assertNoOverlap), not by any DB
// constraint, same convention as this schema's other "business rule, not a
// DB rule" cases (e.g. bankAccount.service.ts's single-active-account rule).

export const TAX_SLAB_MIN_AMOUNT_FLOOR = 0;

export const TAX_SLAB_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

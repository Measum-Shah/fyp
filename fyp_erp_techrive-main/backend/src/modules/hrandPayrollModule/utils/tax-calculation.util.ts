// ─── Tax Calculation Helper ───────────────────────────────────────────────────
// Shared between taxSlab.service.ts (slab CRUD/validation) and
// salary.service.ts (auto tax_amount on a sheet). Kept standalone (no
// prisma import) so it stays a pure, easily-testable function.

export interface TaxableBaseComponents {
  basic_salary: number;
  taxable_allowance_sum: number;
  exempt_amount: number;
}

/**
 * Plain-English "how was the taxable base itself built" line — Basic
 * Salary + taxable allowances only (non-taxable allowances still count
 * toward Gross/Net Salary, just not toward tax — see
 * salary.service.ts's `resolvedAllowances.filter(a => a.is_taxable)`)
 * minus any Exempt Amount carve-out. Shared by the live formula path
 * (resolveAutoTaxAmount, below) and the read-time reconstruction path
 * (reconstructTaxBreakdown, for sheets viewed after the fact — see
 * salary.service.ts's listSalarySheets/getSalarySheetById) so both always
 * describe the taxable base identically.
 */
export const buildTaxableBaseBreakdown = (components: TaxableBaseComponents, taxableAmount: number): string => {
  const { basic_salary, taxable_allowance_sum, exempt_amount } = components;
  const parts = [`Basic Salary (₨${basic_salary.toLocaleString()})`];
  if (taxable_allowance_sum > 0) {
    parts.push(`taxable allowances (₨${taxable_allowance_sum.toLocaleString()})`);
  }
  let line = `Taxable income = ${parts.join(" + ")}`;
  if (exempt_amount > 0) {
    line += ` − Exempt Amount (₨${exempt_amount.toLocaleString()})`;
  }
  line += ` = ₨${taxableAmount.toLocaleString()}.`;
  return line;
};

export interface TaxSlabForCalc {
  id: number;
  min_amount: number;
  max_amount: number | null;
  fixed_amount: number;
  tax_percent: number;
}

export interface TaxCalculationResult {
  tax_amount: number;
  matched_slab_id: number | null;
  // True only when slabs ARE configured for the fiscal year but none of
  // their ranges actually covers `taxableAmount` (a gap between slabs, or
  // the top slab's max_amount was set instead of left unbounded) — as
  // opposed to no slabs being configured at all, which is a normal,
  // expected state (e.g. a brand-new fiscal year) and not a warning.
  // Fixes audit finding #7 (P3): this case previously fell back to ₨0 tax
  // with no signal anywhere that anything was wrong.
  slab_gap_warning: boolean;
  // Plain-English "how was this number calculated" note, shown behind an
  // info icon next to the tax amount on the Salary Sheet/payslip (2026-08-22
  // enhancement, requested alongside the P-04 EOBI/EPF work). Null when
  // there's nothing to explain (taxable amount <= 0, or no slab matched).
  calculation_breakdown: string | null;
}

/**
 * FBR-style progressive tax: finds the single slab whose [min_amount,
 * max_amount] range contains `taxableAmount`, then applies
 *   tax = fixed_amount + (tax_percent / 100) * (taxableAmount - min_amount)
 * `fixed_amount` already bakes in the cumulative tax from lower slabs, so
 * this is NOT a sum across every slab below it — just the one matched slab.
 *
 * Slabs are expected pre-sorted or unsorted (this sorts by min_amount
 * itself). Returns tax_amount = 0, matched_slab_id = null when
 * taxableAmount <= 0 or no slab's range contains it (e.g. slabs haven't
 * been configured for that fiscal year yet — the caller falls back to
 * whatever tax_amount was manually entered in that case).
 */
export const calculateProgressiveTax = (
  taxableAmount: number,
  slabs: TaxSlabForCalc[],
  components?: TaxableBaseComponents
): TaxCalculationResult => {
  if (taxableAmount <= 0 || slabs.length === 0) {
    return { tax_amount: 0, matched_slab_id: null, slab_gap_warning: false, calculation_breakdown: null };
  }

  const sorted = [...slabs].sort((a, b) => a.min_amount - b.min_amount);

  const matched = sorted.find(
    (slab) =>
      taxableAmount >= slab.min_amount &&
      (slab.max_amount === null || taxableAmount <= slab.max_amount)
  );

  if (!matched) {
    return { tax_amount: 0, matched_slab_id: null, slab_gap_warning: true, calculation_breakdown: null };
  }

  const tax =
    matched.fixed_amount + (matched.tax_percent / 100) * (taxableAmount - matched.min_amount);
  const tax_amount = Math.max(0, Math.round(tax));

  const rangeLabel =
    matched.max_amount === null
      ? `above ₨${matched.min_amount.toLocaleString()}`
      : `₨${matched.min_amount.toLocaleString()}–₨${matched.max_amount.toLocaleString()}`;
  const baseLine = components ? `${buildTaxableBaseBreakdown(components, taxableAmount)} ` : "";
  const calculation_breakdown =
    baseLine +
    `Progressive income tax slab (as configured for this fiscal year, following the FBR-style ` +
    `slab structure used in Pakistan's salaried-individual tax tables): taxable income of ` +
    `₨${taxableAmount.toLocaleString()} falls in the ${rangeLabel} bracket, taxed at a fixed ` +
    `₨${matched.fixed_amount.toLocaleString()} plus ${matched.tax_percent}% of the amount over ` +
    `₨${matched.min_amount.toLocaleString()}. (₨${matched.fixed_amount.toLocaleString()} + ` +
    `${matched.tax_percent}% × (₨${taxableAmount.toLocaleString()} − ₨${matched.min_amount.toLocaleString()}) ` +
    `= ₨${tax_amount.toLocaleString()})`;

  return {
    tax_amount,
    matched_slab_id: matched.id,
    slab_gap_warning: false,
    calculation_breakdown,
  };
};

/** True if [aMin, aMax] and [bMin, bMax] overlap (null max = unbounded). */
export const rangesOverlap = (
  aMin: number,
  aMax: number | null,
  bMin: number,
  bMax: number | null
): boolean => {
  const aHigh = aMax === null ? Infinity : aMax;
  const bHigh = bMax === null ? Infinity : bMax;
  return aMin <= bHigh && bMin <= aHigh;
};

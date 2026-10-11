import type { CreateTaxSlabPayload, TaxSlab, TaxSlabFormValues, UpdateTaxSlabPayload } from "./taxSlab.types";

const isBlank = (value: string) => value.trim().length === 0;

export const validateTaxSlabForm = (values: TaxSlabFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (values.fiscal_year_id === "") errors.fiscal_year_id = "Fiscal year is required";

  if (isBlank(values.min_amount)) {
    errors.min_amount = "Minimum amount is required";
  } else if (Number.isNaN(Number(values.min_amount)) || Number(values.min_amount) < 0) {
    errors.min_amount = "Minimum amount must be a non-negative number";
  }

  if (!isBlank(values.max_amount)) {
    const max = Number(values.max_amount);
    if (Number.isNaN(max) || max < 0) errors.max_amount = "Maximum amount must be a non-negative number";
    else if (!errors.min_amount && max <= Number(values.min_amount)) errors.max_amount = "Maximum amount must be greater than minimum amount";
  }

  if (isBlank(values.fixed_amount)) {
    errors.fixed_amount = "Fixed amount is required";
  } else if (Number.isNaN(Number(values.fixed_amount)) || Number(values.fixed_amount) < 0) {
    errors.fixed_amount = "Fixed amount must be a non-negative number";
  }

  if (isBlank(values.tax_percent)) {
    errors.tax_percent = "Tax percent is required";
  } else {
    const pct = Number(values.tax_percent);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) errors.tax_percent = "Tax percent must be between 0 and 100";
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean => Object.keys(errors).length === 0;

export const toCreatePayload = (values: TaxSlabFormValues): CreateTaxSlabPayload => ({
  fiscal_year_id: Number(values.fiscal_year_id),
  min_amount: Number(values.min_amount),
  max_amount: isBlank(values.max_amount) ? null : Number(values.max_amount),
  fixed_amount: Number(values.fixed_amount),
  tax_percent: Number(values.tax_percent),
  status: values.status,
});

export const toUpdatePayload = (values: TaxSlabFormValues): UpdateTaxSlabPayload => toCreatePayload(values);

export const taxSlabToFormValues = (record: TaxSlab): TaxSlabFormValues => ({
  fiscal_year_id: record.fiscal_year_id,
  min_amount: String(record.min_amount),
  max_amount: record.max_amount === null ? "" : String(record.max_amount),
  fixed_amount: String(record.fixed_amount),
  tax_percent: String(record.tax_percent),
  status: record.status,
});

// ─── Live preview helper (used by EmployeeForm.tsx / SalaryFormModal) ──────
// Client-side mirror of the backend's calculateProgressiveTax (see
// backend/.../utils/tax-calculation.util.ts) — same FBR-style formula:
//   tax = fixed_amount + tax_percent% * (taxableAmount - min_amount)
// for the single slab whose [min_amount, max_amount] range contains the
// taxable amount. Purely an in-form estimate; the authoritative figure is
// always whatever the server computes and persists on save.
export const calculatePreviewTax = (taxableAmount: number, slabs: TaxSlab[]): number => {
  if (taxableAmount <= 0 || slabs.length === 0) return 0;

  const sorted = [...slabs].sort((a, b) => a.min_amount - b.min_amount);
  const matched = sorted.find(
    (slab) => taxableAmount >= slab.min_amount && (slab.max_amount === null || taxableAmount <= slab.max_amount)
  );
  if (!matched) return 0;

  const tax = matched.fixed_amount + (matched.tax_percent / 100) * (taxableAmount - matched.min_amount);
  return Math.max(0, Math.round(tax));
};

export interface TaxPreviewComponents {
  basic_salary: number;
  taxable_allowance_sum: number;
  exempt_amount: number;
}

// Mirrors backend/.../utils/tax-calculation.util.ts's buildTaxableBaseBreakdown
// + calculateProgressiveTax's breakdown text exactly, so what's shown while
// still filling in the Salary Sheet form matches what actually gets saved
// once submitted (see StatutoryAmountField's "Add manually" popover, which
// this feeds — same pattern already used for EOBI/EPF).
export const buildTaxPreviewBreakdown = (
  components: TaxPreviewComponents,
  slabs: TaxSlab[]
): { amount: number; breakdown: string | null } => {
  const { basic_salary, taxable_allowance_sum, exempt_amount } = components;
  const taxableAmount = Math.max(0, basic_salary + taxable_allowance_sum - exempt_amount);

  const baseParts = [`Basic Salary (₨${basic_salary.toLocaleString()})`];
  if (taxable_allowance_sum > 0) baseParts.push(`taxable allowances (₨${taxable_allowance_sum.toLocaleString()})`);
  let baseLine = `Taxable income = ${baseParts.join(" + ")}`;
  if (exempt_amount > 0) baseLine += ` − Exempt Amount (₨${exempt_amount.toLocaleString()})`;
  baseLine += ` = ₨${taxableAmount.toLocaleString()}.`;

  if (taxableAmount <= 0 || slabs.length === 0) {
    return { amount: 0, breakdown: taxableAmount > 0 ? null : baseLine };
  }

  const sorted = [...slabs].sort((a, b) => a.min_amount - b.min_amount);
  const matched = sorted.find(
    (slab) => taxableAmount >= slab.min_amount && (slab.max_amount === null || taxableAmount <= slab.max_amount)
  );
  if (!matched) {
    return { amount: 0, breakdown: `${baseLine} No configured tax slab covers this amount for the selected fiscal year.` };
  }

  const tax = matched.fixed_amount + (matched.tax_percent / 100) * (taxableAmount - matched.min_amount);
  const amount = Math.max(0, Math.round(tax));
  const rangeLabel =
    matched.max_amount === null
      ? `above ₨${matched.min_amount.toLocaleString()}`
      : `₨${matched.min_amount.toLocaleString()}–₨${matched.max_amount.toLocaleString()}`;
  const breakdown =
    `${baseLine} Progressive income tax slab (as configured for this fiscal year, following the ` +
    `FBR-style slab structure used in Pakistan's salaried-individual tax tables): taxable income of ` +
    `₨${taxableAmount.toLocaleString()} falls in the ${rangeLabel} bracket, taxed at a fixed ` +
    `₨${matched.fixed_amount.toLocaleString()} plus ${matched.tax_percent}% of the amount over ` +
    `₨${matched.min_amount.toLocaleString()}. (₨${matched.fixed_amount.toLocaleString()} + ` +
    `${matched.tax_percent}% × (₨${taxableAmount.toLocaleString()} − ₨${matched.min_amount.toLocaleString()}) ` +
    `= ₨${amount.toLocaleString()})`;

  return { amount, breakdown };
};

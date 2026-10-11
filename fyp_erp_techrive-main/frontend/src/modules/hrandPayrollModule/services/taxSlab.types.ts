// ─── Tax Slab — Types ─────────────────────────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/taxSlab.service.ts

export const TAX_SLAB_STATUS = { ACTIVE: 1, INACTIVE: 0 } as const;

export interface TaxSlab {
  id: number;
  fiscal_year_id: number;
  slab_order: number;
  min_amount: number;
  max_amount: number | null;
  fixed_amount: number;
  tax_percent: number;
  status: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateTaxSlabPayload {
  fiscal_year_id: number;
  slab_order?: number;
  min_amount: number;
  max_amount?: number | null;
  fixed_amount: number;
  tax_percent: number;
  status?: number;
}

export type UpdateTaxSlabPayload = Partial<CreateTaxSlabPayload>;

export interface TaxSlabFormValues {
  fiscal_year_id: number | "";
  min_amount: string;
  max_amount: string; // blank = "no upper bound" (top slab)
  fixed_amount: string;
  tax_percent: string;
  status: number;
}

export const EMPTY_TAX_SLAB_FORM_VALUES = (fiscalYearId?: number): TaxSlabFormValues => ({
  fiscal_year_id: fiscalYearId ?? "",
  min_amount: "",
  max_amount: "",
  fixed_amount: "",
  tax_percent: "",
  status: TAX_SLAB_STATUS.ACTIVE,
});

export interface ListTaxSlabsParams {
  page?: number;
  limit?: number;
  fiscal_year_id?: number;
  status?: number;
}

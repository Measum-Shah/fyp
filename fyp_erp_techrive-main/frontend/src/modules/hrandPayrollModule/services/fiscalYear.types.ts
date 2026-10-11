// ─── Fiscal Year — Types ──────────────────────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/fiscalYear.service.ts

export const FISCAL_YEAR_STATUS = { ACTIVE: 1, INACTIVE: 0 } as const;

export interface FiscalYear {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface FiscalYearLookupOption {
  id: number;
  name: string;
}

export interface CreateFiscalYearPayload {
  name: string;
  start_date: string;
  end_date: string;
  status?: number;
}

export type UpdateFiscalYearPayload = Partial<CreateFiscalYearPayload>;

export interface FiscalYearFormValues {
  name: string;
  start_date: string;
  end_date: string;
  status: number;
}

export const EMPTY_FISCAL_YEAR_FORM_VALUES: FiscalYearFormValues = {
  name: "",
  start_date: "",
  end_date: "",
  status: FISCAL_YEAR_STATUS.ACTIVE,
};

export interface ListFiscalYearsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
}

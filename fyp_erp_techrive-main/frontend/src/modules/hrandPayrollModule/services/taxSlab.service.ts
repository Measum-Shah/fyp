import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreateTaxSlabPayload,
  ListTaxSlabsParams,
  TaxSlab,
  UpdateTaxSlabPayload,
} from "./taxSlab.types";

// Fixes audit finding P-01: the by-fiscal-year endpoint also returns
// whether this fiscal year is missing an unbounded (max_amount = null) top
// slab — see backend taxSlab.service.ts's listTaxSlabsForFiscalYear.
export interface TaxSlabsForFiscalYearResponse {
  message: string;
  data: TaxSlab[];
  missing_unbounded_top_slab_warning: boolean;
}

export const taxSlabAPI = {
  list: (params: ListTaxSlabsParams = {}) =>
    API.get<PaginatedEnvelope<TaxSlab>>("/tax-slabs", { params }).then((res) => res.data),

  // Unpaginated, full ladder for one fiscal year — used by the Tax Slabs
  // page's ladder view and the Salary form's live tax preview.
  listForFiscalYear: (fiscalYearId: number) =>
    API.get<TaxSlabsForFiscalYearResponse>(`/tax-slabs/by-fiscal-year/${fiscalYearId}`).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<TaxSlab>>(`/tax-slabs/${id}`).then((res) => res.data),

  create: (payload: CreateTaxSlabPayload) =>
    API.post<ApiEnvelope<TaxSlab>>("/tax-slabs", payload).then((res) => res.data),

  update: (id: number, payload: UpdateTaxSlabPayload) =>
    API.put<ApiEnvelope<TaxSlab>>(`/tax-slabs/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/tax-slabs/${id}`).then((res) => res.data),
};

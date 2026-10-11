import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreateFiscalYearPayload,
  FiscalYear,
  FiscalYearLookupOption,
  ListFiscalYearsParams,
  UpdateFiscalYearPayload,
} from "./fiscalYear.types";

export const fiscalYearAPI = {
  list: (params: ListFiscalYearsParams = {}) =>
    API.get<PaginatedEnvelope<FiscalYear>>("/fiscal-years", { params }).then((res) => res.data),

  lookup: () =>
    API.get<ApiEnvelope<FiscalYearLookupOption[]>>("/fiscal-years/lookup").then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<FiscalYear>>(`/fiscal-years/${id}`).then((res) => res.data),

  create: (payload: CreateFiscalYearPayload) =>
    API.post<ApiEnvelope<FiscalYear>>("/fiscal-years", payload).then((res) => res.data),

  update: (id: number, payload: UpdateFiscalYearPayload) =>
    API.put<ApiEnvelope<FiscalYear>>(`/fiscal-years/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/fiscal-years/${id}`).then((res) => res.data),
};

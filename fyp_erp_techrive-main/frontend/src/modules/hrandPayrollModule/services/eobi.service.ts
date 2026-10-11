import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreateEobiEntryPayload,
  EobiEntry,
  ListEobiEntriesParams,
  UpdateEobiEntryPayload,
} from "./eobi.types";

export const eobiAPI = {
  list: (params: ListEobiEntriesParams = {}) =>
    API.get<PaginatedEnvelope<EobiEntry>>("/eobi-register", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<EobiEntry>>(`/eobi-register/${id}`).then((res) => res.data),

  create: (payload: CreateEobiEntryPayload) =>
    API.post<ApiEnvelope<EobiEntry>>("/eobi-register", payload).then((res) => res.data),

  update: (id: number, payload: UpdateEobiEntryPayload) =>
    API.put<ApiEnvelope<EobiEntry>>(`/eobi-register/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/eobi-register/${id}`).then((res) => res.data),
};
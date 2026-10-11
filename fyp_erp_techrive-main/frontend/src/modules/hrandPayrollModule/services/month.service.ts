import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type { CreateMonthPayload, ListMonthsParams, Month, UpdateMonthPayload } from "./month.types";

export const monthAPI = {
  list: (params: ListMonthsParams = {}) =>
    API.get<PaginatedEnvelope<Month>>("/months", { params }).then((res) => res.data),

  lookup: () => API.get<ApiEnvelope<Month[]>>("/months/lookup").then((res) => res.data),

  getById: (id: number) => API.get<ApiEnvelope<Month>>(`/months/${id}`).then((res) => res.data),

  create: (payload: CreateMonthPayload) =>
    API.post<ApiEnvelope<Month>>("/months", payload).then((res) => res.data),

  update: (id: number, payload: UpdateMonthPayload) =>
    API.put<ApiEnvelope<Month>>(`/months/${id}`, payload).then((res) => res.data),

  remove: (id: number) => API.delete<ApiEnvelope<null>>(`/months/${id}`).then((res) => res.data),
};

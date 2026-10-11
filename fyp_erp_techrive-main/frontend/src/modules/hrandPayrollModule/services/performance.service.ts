import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type { CreatePerformancePayload, ListPerformancesParams, Performance, UpdatePerformancePayload } from "./performance.types";

export const performanceAPI = {
  list: (params: ListPerformancesParams = {}) =>
    API.get<PaginatedEnvelope<Performance>>("/performances", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<Performance>>(`/performances/${id}`).then((res) => res.data),

  create: (payload: CreatePerformancePayload) =>
    API.post<ApiEnvelope<Performance>>("/performances", payload).then((res) => res.data),

  update: (id: number, payload: UpdatePerformancePayload) =>
    API.put<ApiEnvelope<Performance>>(`/performances/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/performances/${id}`).then((res) => res.data),
};

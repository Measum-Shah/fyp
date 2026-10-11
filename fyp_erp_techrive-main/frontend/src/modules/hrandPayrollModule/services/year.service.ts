import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type { CreateYearPayload, ListYearsParams, UpdateYearPayload, Year } from "./year.types";

export const yearAPI = {
  list: (params: ListYearsParams = {}) =>
    API.get<PaginatedEnvelope<Year>>("/years", { params }).then((res) => res.data),

  lookup: () => API.get<ApiEnvelope<Year[]>>("/years/lookup").then((res) => res.data),

  getById: (id: number) => API.get<ApiEnvelope<Year>>(`/years/${id}`).then((res) => res.data),

  create: (payload: CreateYearPayload) =>
    API.post<ApiEnvelope<Year>>("/years", payload).then((res) => res.data),

  update: (id: number, payload: UpdateYearPayload) =>
    API.put<ApiEnvelope<Year>>(`/years/${id}`, payload).then((res) => res.data),

  setCurrent: (id: number) =>
    API.patch<ApiEnvelope<Year>>(`/years/${id}/set-current`).then((res) => res.data),

  remove: (id: number) => API.delete<ApiEnvelope<null>>(`/years/${id}`).then((res) => res.data),
};

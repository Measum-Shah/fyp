import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type { CreateFamilyPayload, Family, ListFamiliesParams, UpdateFamilyPayload } from "./family.types";

export const familyAPI = {
  list: (params: ListFamiliesParams = {}) =>
    API.get<PaginatedEnvelope<Family>>("/families", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<Family>>(`/families/${id}`).then((res) => res.data),

  create: (payload: CreateFamilyPayload) =>
    API.post<ApiEnvelope<Family>>("/families", payload).then((res) => res.data),

  update: (id: number, payload: UpdateFamilyPayload) =>
    API.put<ApiEnvelope<Family>>(`/families/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/families/${id}`).then((res) => res.data),
};

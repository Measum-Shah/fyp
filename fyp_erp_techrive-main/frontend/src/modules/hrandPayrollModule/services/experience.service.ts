import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type { CreateExperiencePayload, Experience, ListExperiencesParams, UpdateExperiencePayload } from "./experience.types";

export const experienceAPI = {
  list: (params: ListExperiencesParams = {}) =>
    API.get<PaginatedEnvelope<Experience>>("/experiences", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<Experience>>(`/experiences/${id}`).then((res) => res.data),

  create: (payload: CreateExperiencePayload) =>
    API.post<ApiEnvelope<Experience>>("/experiences", payload).then((res) => res.data),

  update: (id: number, payload: UpdateExperiencePayload) =>
    API.put<ApiEnvelope<Experience>>(`/experiences/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/experiences/${id}`).then((res) => res.data),
};

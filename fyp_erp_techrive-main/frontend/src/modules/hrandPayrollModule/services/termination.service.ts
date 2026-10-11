import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type { CreateTerminationPayload, ListTerminationsParams, Termination, UpdateTerminationPayload } from "./termination.types";

export const terminationAPI = {
  list: (params: ListTerminationsParams = {}) =>
    API.get<PaginatedEnvelope<Termination>>("/terminations", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<Termination>>(`/terminations/${id}`).then((res) => res.data),

  create: (payload: CreateTerminationPayload) =>
    API.post<ApiEnvelope<Termination>>("/terminations", payload).then((res) => res.data),

  update: (id: number, payload: UpdateTerminationPayload) =>
    API.put<ApiEnvelope<Termination>>(`/terminations/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/terminations/${id}`).then((res) => res.data),
};

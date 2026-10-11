import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreateDesignationPayload,
  Designation,
  ListDesignationsParams,
  UpdateDesignationPayload,
} from "./designation.types";

// ─── Designation — API Service ────────────────────────────────────────────
export const designationAPI = {
  list: (params: ListDesignationsParams = {}) =>
    API.get<PaginatedEnvelope<Designation>>("/designations", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<Designation>>(`/designations/${id}`).then((res) => res.data),

  create: (payload: CreateDesignationPayload) =>
    API.post<ApiEnvelope<Designation>>("/designations", payload).then((res) => res.data),

  update: (id: number, payload: UpdateDesignationPayload) =>
    API.put<ApiEnvelope<Designation>>(`/designations/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/designations/${id}`).then((res) => res.data),
};

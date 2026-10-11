import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreateStaffTypePayload,
  ListStaffTypesParams,
  StaffType,
  UpdateStaffTypePayload,
} from "./staffType.types";

// ─── Staff Type — API Service ─────────────────────────────────────────────
export const staffTypeAPI = {
  list: (params: ListStaffTypesParams = {}) =>
    API.get<PaginatedEnvelope<StaffType>>("/staff-types", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<StaffType>>(`/staff-types/${id}`).then((res) => res.data),

  create: (payload: CreateStaffTypePayload) =>
    API.post<ApiEnvelope<StaffType>>("/staff-types", payload).then((res) => res.data),

  update: (id: number, payload: UpdateStaffTypePayload) =>
    API.put<ApiEnvelope<StaffType>>(`/staff-types/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/staff-types/${id}`).then((res) => res.data),
};

import API from "../../../api/api";
import type { ApiEnvelope, LookupOption, PaginatedEnvelope } from "./employee.types";
import type {
  CreateLeaveTypePayload,
  LeaveType,
  ListLeaveTypesParams,
  UpdateLeaveTypePayload,
} from "./leaveType.types";

// ─── Leave Type — API Service ────────────────────────────────────────────────
// Same shape as branchAPI/departmentAPI/companyAPI. getApiErrorMessage/
// getApiFieldErrors are imported directly from employee.service.ts by
// callers, not re-exported here.

export const leaveTypeAPI = {
  list: (params: ListLeaveTypesParams = {}) =>
    API.get<PaginatedEnvelope<LeaveType>>("/leave-types", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<LeaveType>>(`/leave-types/${id}`).then((res) => res.data),

  create: (payload: CreateLeaveTypePayload) =>
    API.post<ApiEnvelope<LeaveType>>("/leave-types", payload).then((res) => res.data),

  update: (id: number, payload: UpdateLeaveTypePayload) =>
    API.put<ApiEnvelope<LeaveType>>(`/leave-types/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/leave-types/${id}`).then((res) => res.data),

  lookup: () =>
    API.get<ApiEnvelope<LookupOption[]>>("/leave-types/lookup").then((res) => res.data),
};
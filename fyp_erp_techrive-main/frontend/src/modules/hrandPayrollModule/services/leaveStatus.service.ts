import API from "../../../api/api";
import type { ApiEnvelope, LookupOption, PaginatedEnvelope } from "./employee.types";
import type {
  CreateLeaveStatusPayload,
  LeaveStatus,
  ListLeaveStatusesParams,
  UpdateLeaveStatusPayload,
} from "./leaveStatus.types";

// ─── Leave Status — API Service ──────────────────────────────────────────────
export const leaveStatusAPI = {
  list: (params: ListLeaveStatusesParams = {}) =>
    API.get<PaginatedEnvelope<LeaveStatus>>("/leave-statuses", { params }).then(
      (res) => res.data
    ),

  getById: (id: number) =>
    API.get<ApiEnvelope<LeaveStatus>>(`/leave-statuses/${id}`).then((res) => res.data),

  create: (payload: CreateLeaveStatusPayload) =>
    API.post<ApiEnvelope<LeaveStatus>>("/leave-statuses", payload).then((res) => res.data),

  update: (id: number, payload: UpdateLeaveStatusPayload) =>
    API.put<ApiEnvelope<LeaveStatus>>(`/leave-statuses/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/leave-statuses/${id}`).then((res) => res.data),

  lookup: () =>
    API.get<ApiEnvelope<LookupOption[]>>("/leave-statuses/lookup").then((res) => res.data),
};
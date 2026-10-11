import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreateLeaveEntitlementPayload,
  LeaveEntitlement,
  ListLeaveEntitlementsParams,
  UpdateLeaveEntitlementPayload,
} from "./leaveEntitlement.types";

// ─── Leave Entitlement — API Service ─────────────────────────────────────────
export const leaveEntitlementAPI = {
  list: (params: ListLeaveEntitlementsParams = {}) =>
    API.get<PaginatedEnvelope<LeaveEntitlement>>("/leave-entitlements", { params }).then(
      (res) => res.data
    ),

  getById: (id: number) =>
    API.get<ApiEnvelope<LeaveEntitlement>>(`/leave-entitlements/${id}`).then((res) => res.data),

  create: (payload: CreateLeaveEntitlementPayload) =>
    API.post<ApiEnvelope<LeaveEntitlement>>("/leave-entitlements", payload).then(
      (res) => res.data
    ),

  update: (id: number, payload: UpdateLeaveEntitlementPayload) =>
    API.put<ApiEnvelope<LeaveEntitlement>>(`/leave-entitlements/${id}`, payload).then(
      (res) => res.data
    ),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/leave-entitlements/${id}`).then((res) => res.data),
};
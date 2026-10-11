import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreateWorkShiftPayload,
  ListWorkShiftsParams,
  UpdateWorkShiftPayload,
  WorkShift,
} from "./workShift.types";

// ─── Work Shift — API Service ────────────────────────────────────────────────
// Same shape as branchAPI/employeeAPI. getApiErrorMessage/getApiFieldErrors
// are imported directly from employee.service.ts by callers.

export const workShiftAPI = {
  list: (params: ListWorkShiftsParams = {}) =>
    API.get<PaginatedEnvelope<WorkShift>>("/work-shifts", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<WorkShift>>(`/work-shifts/${id}`).then((res) => res.data),

  create: (payload: CreateWorkShiftPayload) =>
    API.post<ApiEnvelope<WorkShift>>("/work-shifts", payload).then((res) => res.data),

  update: (id: number, payload: UpdateWorkShiftPayload) =>
    API.put<ApiEnvelope<WorkShift>>(`/work-shifts/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/work-shifts/${id}`).then((res) => res.data),
};
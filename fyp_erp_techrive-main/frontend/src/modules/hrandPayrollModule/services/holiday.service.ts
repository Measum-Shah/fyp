import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreateHolidayPayload,
  Holiday,
  ListHolidaysParams,
  UpdateHolidayPayload,
} from "./holiday.types";

// ─── Holiday — API Service ────────────────────────────────────────────────────
// Same shape as branchAPI/workShiftAPI. getApiErrorMessage/getApiFieldErrors
// are imported directly from employee.service.ts by callers.

export const holidayAPI = {
  list: (params: ListHolidaysParams = {}) =>
    API.get<PaginatedEnvelope<Holiday>>("/holidays", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<Holiday>>(`/holidays/${id}`).then((res) => res.data),

  create: (payload: CreateHolidayPayload) =>
    API.post<ApiEnvelope<Holiday>>("/holidays", payload).then((res) => res.data),

  update: (id: number, payload: UpdateHolidayPayload) =>
    API.put<ApiEnvelope<Holiday>>(`/holidays/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/holidays/${id}`).then((res) => res.data),
};
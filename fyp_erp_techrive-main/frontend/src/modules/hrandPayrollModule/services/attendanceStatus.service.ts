import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  AttendanceStatus,
  CreateAttendanceStatusPayload,
  ListAttendanceStatusesParams,
  UpdateAttendanceStatusPayload,
} from "./attendanceStatus.types";

// ─── Attendance Status — API Service ─────────────────────────────────────────
export const attendanceStatusAPI = {
  list: (params: ListAttendanceStatusesParams = {}) =>
    API.get<PaginatedEnvelope<AttendanceStatus>>("/attendance-statuses", { params }).then(
      (res) => res.data
    ),

  // Active-only, unpaginated — feeds the Attendance form's status dropdown.
  lookup: () =>
    API.get<ApiEnvelope<AttendanceStatus[]>>("/attendance-statuses/lookup").then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<AttendanceStatus>>(`/attendance-statuses/${id}`).then((res) => res.data),

  create: (payload: CreateAttendanceStatusPayload) =>
    API.post<ApiEnvelope<AttendanceStatus>>("/attendance-statuses", payload).then((res) => res.data),

  update: (id: number, payload: UpdateAttendanceStatusPayload) =>
    API.put<ApiEnvelope<AttendanceStatus>>(`/attendance-statuses/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/attendance-statuses/${id}`).then((res) => res.data),
};
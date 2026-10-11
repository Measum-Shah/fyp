import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  AttendanceRecord,
  CreateAttendancePayload,
  ListAttendanceParams,
  UpdateAttendancePayload,
} from "./attendance.types";

// ─── Employee Attendance — API Service ───────────────────────────────────────
export const attendanceAPI = {
  list: (params: ListAttendanceParams = {}) =>
    API.get<PaginatedEnvelope<AttendanceRecord>>("/attendance", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<AttendanceRecord>>(`/attendance/${id}`).then((res) => res.data),

  create: (payload: CreateAttendancePayload) =>
    API.post<ApiEnvelope<AttendanceRecord>>("/attendance", payload).then((res) => res.data),

  update: (id: number, payload: UpdateAttendancePayload) =>
    API.put<ApiEnvelope<AttendanceRecord>>(`/attendance/${id}`, payload).then((res) => res.data),

  setReviewStatus: (id: number, reviewed: boolean) =>
    API.patch<ApiEnvelope<AttendanceRecord>>(`/attendance/${id}/review-status`, { reviewed }).then(
      (res) => res.data
    ),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/attendance/${id}`).then((res) => res.data),
};
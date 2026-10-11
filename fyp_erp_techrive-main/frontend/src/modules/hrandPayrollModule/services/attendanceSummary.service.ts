import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  AttendanceSummary,
  AttendanceSummaryDetail,
  CreateAttendanceSummaryPayload,
  ListAttendanceSummariesParams,
  SetApprovalPayload,
  UpdateAttendanceSummaryPayload,
} from "./attendanceSummary.types";

export const attendanceSummaryAPI = {
  list: (params: ListAttendanceSummariesParams = {}) =>
    API.get<PaginatedEnvelope<AttendanceSummary>>("/attendance-summaries", { params }).then(
      (res) => res.data
    ),

  getById: (id: number) =>
    API.get<ApiEnvelope<AttendanceSummary>>(`/attendance-summaries/${id}`).then((res) => res.data),

  getDetail: (id: number) =>
    API.get<ApiEnvelope<AttendanceSummaryDetail>>(`/attendance-summaries/${id}/detail`).then(
      (res) => res.data
    ),

  create: (payload: CreateAttendanceSummaryPayload) =>
    API.post<ApiEnvelope<AttendanceSummary>>("/attendance-summaries", payload).then((res) => res.data),

  update: (id: number, payload: UpdateAttendanceSummaryPayload) =>
    API.put<ApiEnvelope<AttendanceSummary>>(`/attendance-summaries/${id}`, payload).then((res) => res.data),

  setApproval: (id: number, payload: SetApprovalPayload) =>
    API.patch<ApiEnvelope<AttendanceSummary>>(`/attendance-summaries/${id}/approval`, payload).then(
      (res) => res.data
    ),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/attendance-summaries/${id}`).then((res) => res.data),
};

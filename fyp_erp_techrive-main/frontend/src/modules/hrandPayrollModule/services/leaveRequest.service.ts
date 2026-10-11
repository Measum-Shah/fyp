import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  ChangeLeaveRequestStatusPayload,
  CreateLeaveRequestPayload,
  EmployeeLookupOption,
  LeaveRequest,
  ListLeaveRequestsParams,
  UpdateLeaveRequestPayload,
  UploadAttachmentResponseData,
} from "./leaveRequest.types";

// ─── Leave Request — API Service ─────────────────────────────────────────────
export const leaveRequestAPI = {
  list: (params: ListLeaveRequestsParams = {}) =>
    API.get<PaginatedEnvelope<LeaveRequest>>("/leave-requests", { params }).then(
      (res) => res.data
    ),

  getById: (id: number) =>
    API.get<ApiEnvelope<LeaveRequest>>(`/leave-requests/${id}`).then((res) => res.data),

  create: (payload: CreateLeaveRequestPayload) =>
    API.post<ApiEnvelope<LeaveRequest>>("/leave-requests", payload).then((res) => res.data),

  update: (id: number, payload: UpdateLeaveRequestPayload) =>
    API.put<ApiEnvelope<LeaveRequest>>(`/leave-requests/${id}`, payload).then((res) => res.data),

  changeStatus: (id: number, payload: ChangeLeaveRequestStatusPayload) =>
    API.patch<ApiEnvelope<LeaveRequest>>(`/leave-requests/${id}/status`, payload).then(
      (res) => res.data
    ),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/leave-requests/${id}`).then((res) => res.data),

  lookups: {
    employees: () =>
      API.get<ApiEnvelope<EmployeeLookupOption[]>>("/leave-requests/lookups/employees").then(
        (res) => res.data
      ),
  },

  // Uploads the file first; the returned `attachment` path is then sent as
  // a normal field on create()/update() above — same pattern as
  // staffQualification.service.ts's uploadAttachment().
  uploadAttachment: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return API.post<ApiEnvelope<UploadAttachmentResponseData>>(
      "/leave-requests/upload-attachment",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    ).then((res) => res.data);
  },
};

// Resolves a stored `attachment` path ("/uploads/leave-request-attachments/…")
// into a URL the browser can open directly — same convention as
// staffQualification.service.ts's resolveAttachmentUrl().
export const resolveAttachmentUrl = (attachment: string | null | undefined): string | null => {
  if (!attachment) return null;
  if (/^https?:\/\//i.test(attachment)) return attachment;
  const apiBase = API.defaults.baseURL ?? "";
  const serverOrigin = apiBase.replace(/\/api\/?$/, "");
  return `${serverOrigin}${attachment}`;
};
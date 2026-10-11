import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreateStaffQualificationPayload,
  ListStaffQualificationsParams,
  StaffQualification,
  UpdateStaffQualificationPayload,
  UploadAttachmentResponseData,
} from "./staffQualification.types";

export const staffQualificationAPI = {
  list: (params: ListStaffQualificationsParams = {}) =>
    API.get<PaginatedEnvelope<StaffQualification>>("/staff-qualifications", { params }).then(
      (res) => res.data
    ),

  getById: (id: number) =>
    API.get<ApiEnvelope<StaffQualification>>(`/staff-qualifications/${id}`).then((res) => res.data),

  create: (payload: CreateStaffQualificationPayload) =>
    API.post<ApiEnvelope<StaffQualification>>("/staff-qualifications", payload).then(
      (res) => res.data
    ),

  update: (id: number, payload: UpdateStaffQualificationPayload) =>
    API.put<ApiEnvelope<StaffQualification>>(`/staff-qualifications/${id}`, payload).then(
      (res) => res.data
    ),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/staff-qualifications/${id}`).then((res) => res.data),

  // Uploads the file first; the returned `attachment` path is then sent as
  // a normal field on create()/update() above — keeps those two calls plain
  // JSON, matching every other module in this codebase.
  uploadAttachment: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return API.post<ApiEnvelope<UploadAttachmentResponseData>>(
      "/staff-qualifications/upload-attachment",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    ).then((res) => res.data);
  },
};

// Resolves a stored `attachment` path ("/uploads/staff-qualifications/…")
// into a URL the browser can open directly, using the same host as the API
// (API.baseURL is ".../api", the static /uploads mount lives one level up).
export const resolveAttachmentUrl = (attachment: string | null | undefined): string | null => {
  if (!attachment) return null;
  if (/^https?:\/\//i.test(attachment)) return attachment;
  const apiBase = API.defaults.baseURL ?? "";
  const serverOrigin = apiBase.replace(/\/api\/?$/, "");
  return `${serverOrigin}${attachment}`;
};
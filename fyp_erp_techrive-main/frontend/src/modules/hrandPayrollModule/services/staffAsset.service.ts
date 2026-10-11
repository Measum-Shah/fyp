import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreateStaffAssetPayload,
  ListStaffAssetsParams,
  StaffAsset,
  UpdateStaffAssetPayload,
  UploadAttachmentResponseData,
} from "./staffAsset.types";

export const staffAssetAPI = {
  list: (params: ListStaffAssetsParams = {}) =>
    API.get<PaginatedEnvelope<StaffAsset>>("/staff-assets", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<StaffAsset>>(`/staff-assets/${id}`).then((res) => res.data),

  create: (payload: CreateStaffAssetPayload) =>
    API.post<ApiEnvelope<StaffAsset>>("/staff-assets", payload).then((res) => res.data),

  update: (id: number, payload: UpdateStaffAssetPayload) =>
    API.put<ApiEnvelope<StaffAsset>>(`/staff-assets/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/staff-assets/${id}`).then((res) => res.data),

  // Uploads the file first; the returned `attachment` path is then sent as
  // a normal field on create()/update() above — keeps those two calls plain
  // JSON, matching every other module in this codebase.
  uploadAttachment: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return API.post<ApiEnvelope<UploadAttachmentResponseData>>(
      "/staff-assets/upload-attachment",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    ).then((res) => res.data);
  },
};

// Resolves a stored `attachment` path ("/uploads/staff-assets/…") into a
// URL the browser can open directly, using the same host as the API
// (API.baseURL is ".../api", the static /uploads mount lives one level up).
export const resolveAttachmentUrl = (attachment: string | null | undefined): string | null => {
  if (!attachment) return null;
  if (/^https?:\/\//i.test(attachment)) return attachment;
  const apiBase = API.defaults.baseURL ?? "";
  const serverOrigin = apiBase.replace(/\/api\/?$/, "");
  return `${serverOrigin}${attachment}`;
};
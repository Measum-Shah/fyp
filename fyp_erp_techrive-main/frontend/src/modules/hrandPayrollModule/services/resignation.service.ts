import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreateResignationPayload,
  ListResignationsParams,
  Resignation,
  UpdateResignationApprovalPayload,
  UpdateResignationPayload,
} from "./resignation.types";

// Resolves a stored `experience_letter` path
// ("/uploads/resignation-experience-letters/…") into a URL the browser can
// open directly. Mirrors staffQualification.service.ts's
// resolveAttachmentUrl (API.baseURL is ".../api", the static /uploads mount
// lives one level up).
export const resolveExperienceLetterUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const apiBase = API.defaults.baseURL ?? "";
  const serverOrigin = apiBase.replace(/\/api\/?$/, "");
  return `${serverOrigin}${path}`;
};

export const resignationAPI = {
  list: (params: ListResignationsParams = {}) =>
    API.get<PaginatedEnvelope<Resignation>>("/resignations", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<Resignation>>(`/resignations/${id}`).then((res) => res.data),

  create: (payload: CreateResignationPayload) =>
    API.post<ApiEnvelope<Resignation>>("/resignations", payload).then((res) => res.data),

  update: (id: number, payload: UpdateResignationPayload) =>
    API.put<ApiEnvelope<Resignation>>(`/resignations/${id}`, payload).then((res) => res.data),

  updateApproval: (id: number, payload: UpdateResignationApprovalPayload) =>
    API.patch<ApiEnvelope<Resignation>>(`/resignations/${id}/approval`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/resignations/${id}`).then((res) => res.data),

  // Mirrors staffQualificationAPI's uploadAttachment — see
  // StaffQualificationFormModal.tsx for the click-to-upload UI pattern this
  // is paired with. Returns the public path to store as experience_letter.
  uploadExperienceLetter: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return API.post<ApiEnvelope<{ experience_letter: string }>>(
      "/resignations/upload-experience-letter",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    ).then((res) => res.data);
  },
};
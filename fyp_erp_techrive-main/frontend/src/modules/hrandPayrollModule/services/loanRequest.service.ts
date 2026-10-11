import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  ChangeLoanRequestStatusPayload,
  CreateLoanRequestPayload,
  EmployeeLookupOption,
  ListLoanRequestsParams,
  LoanRequest,
  UpdateLoanRequestPayload,
} from "./loanRequest.types";

// Resolves a stored `attachment_file` path
// ("/uploads/loan-request-attachments/…") into a URL the browser can open
// directly. Mirrors resignation.service.ts's resolveExperienceLetterUrl
// (API.baseURL is ".../api", the static /uploads mount lives one level up).
export const resolveLoanRequestAttachmentUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const apiBase = API.defaults.baseURL ?? "";
  const serverOrigin = apiBase.replace(/\/api\/?$/, "");
  return `${serverOrigin}${path}`;
};

// ─── Loan Request — API Service ──────────────────────────────────────────────
export const loanRequestAPI = {
  list: (params: ListLoanRequestsParams = {}) =>
    API.get<PaginatedEnvelope<LoanRequest>>("/loan-requests", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<LoanRequest>>(`/loan-requests/${id}`).then((res) => res.data),

  create: (payload: CreateLoanRequestPayload) =>
    API.post<ApiEnvelope<LoanRequest>>("/loan-requests", payload).then((res) => res.data),

  update: (id: number, payload: UpdateLoanRequestPayload) =>
    API.put<ApiEnvelope<LoanRequest>>(`/loan-requests/${id}`, payload).then((res) => res.data),

  changeStatus: (id: number, payload: ChangeLoanRequestStatusPayload) =>
    API.patch<ApiEnvelope<LoanRequest>>(`/loan-requests/${id}/status`, payload).then(
      (res) => res.data
    ),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/loan-requests/${id}`).then((res) => res.data),

  lookups: {
    employees: () =>
      API.get<ApiEnvelope<EmployeeLookupOption[]>>("/loan-requests/lookups/employees").then(
        (res) => res.data
      ),
  },

  // Mirrors resignationAPI.uploadExperienceLetter — see
  // LoanRequestFormModal.tsx for the click-to-upload UI pattern this is
  // paired with. Returns the public path to store as attachment_file.
  uploadAttachment: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return API.post<ApiEnvelope<{ attachment_file: string }>>(
      "/loan-requests/upload-attachment",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    ).then((res) => res.data);
  },
};
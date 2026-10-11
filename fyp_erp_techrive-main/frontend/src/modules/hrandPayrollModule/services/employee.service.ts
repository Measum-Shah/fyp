import type { AxiosError } from "axios";
import API from "../../../api/api";
import type {
  ApiEnvelope,
  ApiErrorResponse,
  CreateEmployeePayload,
  Employee,
  EmployeeSearchOption,
  ListEmployeesParams,
  LookupOption,
  PaginatedEnvelope,
  StaffLookupOption,
  UpdateEmployeePayload,
} from "./employee.types";

// ─── Employee Management — API Service ───────────────────────────────────────
// Follows the same shape as `authAPI` in frontend/src/api/api.ts: a plain
// object of named methods built on the shared `API` axios instance (which
// already attaches the JWT via its request interceptor). Nothing here
// creates a new axios instance or touches api/api.ts.

export const employeeAPI = {
  list: (params: ListEmployeesParams = {}) =>
    API.get<PaginatedEnvelope<Employee>>("/employees", { params }).then(
      (res) => res.data
    ),

  getById: (id: number) =>
    API.get<ApiEnvelope<Employee>>(`/employees/${id}`).then((res) => res.data),

  create: (payload: CreateEmployeePayload) =>
    API.post<ApiEnvelope<Employee>>("/employees", payload).then(
      (res) => res.data
    ),

  update: (id: number, payload: UpdateEmployeePayload) =>
    API.put<ApiEnvelope<Employee>>(`/employees/${id}`, payload).then(
      (res) => res.data
    ),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/employees/${id}`).then((res) => res.data),

  // Uploads the file first; the returned path is then sent as a normal field
  // on create()/update() above — keeps those two calls plain JSON, matching
  // Staff Qualifications' / Staff Assets' upload-attachment convention.
  uploadProfileImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return API.post<ApiEnvelope<{ staff_image: string }>>(
      "/employees/upload-profile-image",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    ).then((res) => res.data);
  },

  uploadCnicAttachment: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return API.post<ApiEnvelope<{ cnic_attachment: string }>>(
      "/employees/upload-cnic-attachment",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    ).then((res) => res.data);
  },

  lookups: {
    departments: (branch_id?: number) =>
      API.get<ApiEnvelope<LookupOption[]>>("/employees/lookups/departments", {
        params: branch_id != null ? { branch_id } : undefined,
      }).then((res) => res.data),
    branches: (company_id?: number) =>
      API.get<ApiEnvelope<LookupOption[]>>("/employees/lookups/branches", {
        params: company_id != null ? { company_id } : undefined,
      }).then((res) => res.data),
    designations: () =>
      API.get<ApiEnvelope<LookupOption[]>>(
        "/employees/lookups/designations"
      ).then((res) => res.data),
    staffTypes: () =>
      API.get<ApiEnvelope<LookupOption[]>>(
        "/employees/lookups/staff-types"
      ).then((res) => res.data),
    // Search-as-you-type — used by the Attendance module's employee picker
    // (see attendance.constants.ts for why this is a search endpoint rather
    // than a lookup dump).
    search: (query?: string) =>
      API.get<ApiEnvelope<EmployeeSearchOption[]>>("/employees/lookups/search", {
        params: query ? { q: query } : undefined,
      }).then((res) => res.data),
    // Shared "pick an employee" dropdown for the Payroll & Salary features
    // (Bank Accounts, Salary Sheet, Loans, Increments, EOBI/EPF Register)
    // — also used as the "Approver Name" dropdown for Resignation / Branch
    // Transfer / Attendance Summary approvals, which additionally rely on
    // each row's designation_id to auto-populate Approver Designation.
    staff: () =>
      API.get<ApiEnvelope<StaffLookupOption[]>>("/employees/lookups/staff").then(
        (res) => res.data
      ),
  },
};

// ─── Error helpers ────────────────────────────────────────────────────────────
// The backend returns { message } for generic failures and
// { message, errors: { field: "..." } } for 422/400/409s (see AppError and
// validate.middleware.ts). These helpers pull that apart consistently so
// every page/hook surfaces errors the same way.

export const getApiErrorMessage = (error: unknown): string => {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return (
    axiosError.response?.data?.message ||
    axiosError.message ||
    "Something went wrong. Please try again."
  );
};

export const getApiFieldErrors = (
  error: unknown
): Record<string, string> | undefined => {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.errors;
};

// Resolves a stored `staff_image` / `cnic_attachment` path
// ("/uploads/employee-profile-images/…") into a URL the browser can open
// directly. The underlying helper is generic (host-resolution only), already
// used the same way by Staff Qualifications — re-exported here under an
// Employee-friendly name rather than duplicated.
export { resolveAttachmentUrl as resolveEmployeeFileUrl } from "./staffQualification.service";
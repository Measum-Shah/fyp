import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  Company,
  CreateCompanyPayload,
  ListCompaniesParams,
  UpdateCompanyPayload,
} from "./company.types";

// ─── Company — API Service ───────────────────────────────────────────────────
// Same shape as branchAPI/departmentAPI/employeeAPI. getApiErrorMessage/
// getApiFieldErrors are imported directly from employee.service.ts by
// callers, not re-exported here — see department.service.ts for the same
// reasoning.
//
// No `lookups` sub-object here — the read-only companies lookup used by the
// Branch form's dropdown already lives on branchAPI.lookups.companies
// (branch.service.ts) and is left untouched.

export const companyAPI = {
  list: (params: ListCompaniesParams = {}) =>
    API.get<PaginatedEnvelope<Company>>("/companies", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<Company>>(`/companies/${id}`).then((res) => res.data),

  create: (payload: CreateCompanyPayload) =>
    API.post<ApiEnvelope<Company>>("/companies", payload).then((res) => res.data),

  update: (id: number, payload: UpdateCompanyPayload) =>
    API.put<ApiEnvelope<Company>>(`/companies/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/companies/${id}`).then((res) => res.data),
};
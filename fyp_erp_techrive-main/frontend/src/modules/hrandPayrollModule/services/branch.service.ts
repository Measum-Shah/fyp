import API from "../../../api/api";
import type { ApiEnvelope, LookupOption, PaginatedEnvelope } from "./employee.types";
import type {
  Branch,
  CreateBranchPayload,
  ListBranchesParams,
  UpdateBranchPayload,
} from "./branch.types";

// ─── Branch — API Service ────────────────────────────────────────────────────
// Same shape as employeeAPI/departmentAPI. getApiErrorMessage/getApiFieldErrors
// are imported directly from employee.service.ts by callers, not re-exported
// here — see department.service.ts for the same reasoning.

export const branchAPI = {
  list: (params: ListBranchesParams = {}) =>
    API.get<PaginatedEnvelope<Branch>>("/branches", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<Branch>>(`/branches/${id}`).then((res) => res.data),

  create: (payload: CreateBranchPayload) =>
    API.post<ApiEnvelope<Branch>>("/branches", payload).then((res) => res.data),

  update: (id: number, payload: UpdateBranchPayload) =>
    API.put<ApiEnvelope<Branch>>(`/branches/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/branches/${id}`).then((res) => res.data),

  lookups: {
    companies: () =>
      API.get<ApiEnvelope<LookupOption[]>>("/branches/lookups/companies").then(
        (res) => res.data
      ),
  },
};
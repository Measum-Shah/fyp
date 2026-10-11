import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreateDepartmentPayload,
  Department,
  ListDepartmentsParams,
  UpdateDepartmentPayload,
} from "./department.types";

// ─── Department — API Service ────────────────────────────────────────────────
// Same shape as employeeAPI: a plain object of named methods on the shared
// API axios instance. getApiErrorMessage/getApiFieldErrors are intentionally
// NOT re-exported here — they're generic (not employee-specific), so callers
// import them directly from employee.service.ts to avoid two import paths
// for the same functions.

export const departmentAPI = {
  list: (params: ListDepartmentsParams = {}) =>
    API.get<PaginatedEnvelope<Department>>("/departments", { params }).then(
      (res) => res.data
    ),

  getById: (id: number) =>
    API.get<ApiEnvelope<Department>>(`/departments/${id}`).then((res) => res.data),

  create: (payload: CreateDepartmentPayload) =>
    API.post<ApiEnvelope<Department>>("/departments", payload).then(
      (res) => res.data
    ),

  update: (id: number, payload: UpdateDepartmentPayload) =>
    API.put<ApiEnvelope<Department>>(`/departments/${id}`, payload).then(
      (res) => res.data
    ),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/departments/${id}`).then((res) => res.data),
};
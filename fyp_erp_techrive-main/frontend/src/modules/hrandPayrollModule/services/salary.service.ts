import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreateSalaryPayload,
  ListSalaryParams,
  SalarySheet,
  UpdateSalaryApprovalPayload,
  UpdateSalaryPayload,
} from "./salary.types";

// ─── Salary Sheet — API Service ──────────────────────────────────────────────
export const salaryAPI = {
  list: (params: ListSalaryParams = {}) =>
    API.get<PaginatedEnvelope<SalarySheet>>("/salary-sheets", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<SalarySheet>>(`/salary-sheets/${id}`).then((res) => res.data),

  create: (payload: CreateSalaryPayload) =>
    API.post<ApiEnvelope<SalarySheet>>("/salary-sheets", payload).then((res) => res.data),

  update: (id: number, payload: UpdateSalaryPayload) =>
    API.put<ApiEnvelope<SalarySheet>>(`/salary-sheets/${id}`, payload).then((res) => res.data),

  updateApproval: (id: number, payload: UpdateSalaryApprovalPayload) =>
    API.patch<ApiEnvelope<SalarySheet>>(`/salary-sheets/${id}/approval`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/salary-sheets/${id}`).then((res) => res.data),
};

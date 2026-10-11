import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreateIncrementPayload,
  Increment,
  ListIncrementsParams,
  StaffSalarySnapshot,
  UpdateIncrementPayload,
  UpdateIncrementStatusPayload,
} from "./increment.types";

export const incrementAPI = {
  list: (params: ListIncrementsParams = {}) =>
    API.get<PaginatedEnvelope<Increment>>("/increments", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<Increment>>(`/increments/${id}`).then((res) => res.data),

  // Employee's live salary snapshot (School, Campus, Current Basic Salary,
  // Previous Gross Salary) — powers the New Increment Request form's
  // auto-fill the moment an Employee is selected.
  getStaffSalarySnapshot: (staffId: number, branchId?: number) =>
    API.get<ApiEnvelope<StaffSalarySnapshot>>(`/increments/staff/${staffId}/salary-snapshot`, {
      params: branchId ? { branch_id: branchId } : undefined,
    }).then((res) => res.data),

  create: (payload: CreateIncrementPayload) =>
    API.post<ApiEnvelope<Increment>>("/increments", payload).then((res) => res.data),

  update: (id: number, payload: UpdateIncrementPayload) =>
    API.put<ApiEnvelope<Increment>>(`/increments/${id}`, payload).then((res) => res.data),

  updateStatus: (id: number, payload: UpdateIncrementStatusPayload) =>
    API.patch<ApiEnvelope<Increment>>(`/increments/${id}/status`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/increments/${id}`).then((res) => res.data),
};
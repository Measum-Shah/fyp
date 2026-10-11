import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  BankAccount,
  CreateBankAccountPayload,
  ListBankAccountsParams,
  UpdateBankAccountPayload,
} from "./bankAccount.types";

// ─── Bank Account — API Service ──────────────────────────────────────────────
// Same shape as branchAPI/employeeAPI. getApiErrorMessage/getApiFieldErrors
// are imported directly from employee.service.ts by callers.

export const bankAccountAPI = {
  list: (params: ListBankAccountsParams = {}) =>
    API.get<PaginatedEnvelope<BankAccount>>("/bank-accounts", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<BankAccount>>(`/bank-accounts/${id}`).then((res) => res.data),

  create: (payload: CreateBankAccountPayload) =>
    API.post<ApiEnvelope<BankAccount>>("/bank-accounts", payload).then((res) => res.data),

  update: (id: number, payload: UpdateBankAccountPayload) =>
    API.put<ApiEnvelope<BankAccount>>(`/bank-accounts/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/bank-accounts/${id}`).then((res) => res.data),
};

import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreateLoanTypePayload,
  ListLoanTypesParams,
  LoanType,
  LoanTypeLookupOption,
  UpdateLoanTypePayload,
} from "./loanType.types";

export const loanTypeAPI = {
  list: (params: ListLoanTypesParams = {}) =>
    API.get<PaginatedEnvelope<LoanType>>("/loan-types", { params }).then((res) => res.data),

  lookup: () =>
    API.get<ApiEnvelope<LoanTypeLookupOption[]>>("/loan-types/lookup").then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<LoanType>>(`/loan-types/${id}`).then((res) => res.data),

  create: (payload: CreateLoanTypePayload) =>
    API.post<ApiEnvelope<LoanType>>("/loan-types", payload).then((res) => res.data),

  update: (id: number, payload: UpdateLoanTypePayload) =>
    API.put<ApiEnvelope<LoanType>>(`/loan-types/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/loan-types/${id}`).then((res) => res.data),
};

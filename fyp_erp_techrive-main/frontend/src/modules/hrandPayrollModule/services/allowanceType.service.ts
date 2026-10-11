import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  AllowanceType,
  CreateAllowanceTypePayload,
  ListAllowanceTypesParams,
  UpdateAllowanceTypePayload,
} from "./allowanceType.types";

export const allowanceTypeAPI = {
  list: (params: ListAllowanceTypesParams = {}) =>
    API.get<PaginatedEnvelope<AllowanceType>>("/allowance-types", { params }).then((res) => res.data),

  lookup: () =>
    API.get<ApiEnvelope<AllowanceType[]>>("/allowance-types/lookup").then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<AllowanceType>>(`/allowance-types/${id}`).then((res) => res.data),

  create: (payload: CreateAllowanceTypePayload) =>
    API.post<ApiEnvelope<AllowanceType>>("/allowance-types", payload).then((res) => res.data),

  update: (id: number, payload: UpdateAllowanceTypePayload) =>
    API.put<ApiEnvelope<AllowanceType>>(`/allowance-types/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/allowance-types/${id}`).then((res) => res.data),
};

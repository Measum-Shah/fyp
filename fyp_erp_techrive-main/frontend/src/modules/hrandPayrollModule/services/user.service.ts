import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreateUserPayload,
  EmployeeLookupOption,
  ListUsersParams,
  UpdateUserPayload,
  User,
} from "./user.types";

export const userAPI = {
  list: (params: ListUsersParams = {}) =>
    API.get<PaginatedEnvelope<User>>("/users", { params }).then((res) => res.data),

  getById: (id: number) => API.get<ApiEnvelope<User>>(`/users/${id}`).then((res) => res.data),

  create: (payload: CreateUserPayload) =>
    API.post<ApiEnvelope<User>>("/users", payload).then((res) => res.data),

  update: (id: number, payload: UpdateUserPayload) =>
    API.put<ApiEnvelope<User>>(`/users/${id}`, payload).then((res) => res.data),

  resetPassword: (id: number, password: string) =>
    API.put<ApiEnvelope<null>>(`/users/${id}/reset-password`, { password }).then((res) => res.data),

  remove: (id: number) => API.delete<ApiEnvelope<null>>(`/users/${id}`).then((res) => res.data),

  lookups: {
    employees: () =>
      API.get<ApiEnvelope<EmployeeLookupOption[]>>("/users/lookups/employees").then((res) => res.data),
  },
};

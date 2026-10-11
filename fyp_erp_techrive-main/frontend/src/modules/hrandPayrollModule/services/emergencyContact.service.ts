import API from "../../../api/api";
import type { ApiEnvelope, PaginatedEnvelope } from "./employee.types";
import type {
  CreateEmergencyContactPayload,
  EmergencyContact,
  ListEmergencyContactsParams,
  UpdateEmergencyContactPayload,
} from "./emergencyContact.types";

export const emergencyContactAPI = {
  list: (params: ListEmergencyContactsParams = {}) =>
    API.get<PaginatedEnvelope<EmergencyContact>>("/emergency-contacts", { params }).then((res) => res.data),

  getById: (id: number) =>
    API.get<ApiEnvelope<EmergencyContact>>(`/emergency-contacts/${id}`).then((res) => res.data),

  create: (payload: CreateEmergencyContactPayload) =>
    API.post<ApiEnvelope<EmergencyContact>>("/emergency-contacts", payload).then((res) => res.data),

  update: (id: number, payload: UpdateEmergencyContactPayload) =>
    API.put<ApiEnvelope<EmergencyContact>>(`/emergency-contacts/${id}`, payload).then((res) => res.data),

  remove: (id: number) =>
    API.delete<ApiEnvelope<null>>(`/emergency-contacts/${id}`).then((res) => res.data),
};

import type { AxiosError } from "axios";
import API from "../../../api/api";
import type {
  ApiEnvelope,
  ApiErrorResponse,
  ListSessionsParams,
  PaginatedEnvelope,
  SessionsSummary,
  UserSession,
} from "./sessionLog.types";

// ─── Session Monitoring — API Service ────────────────────────────────────────
// Same shape as employeeAPI/designationService — a plain object of named
// methods on the shared `API` axios instance.

export const sessionLogAPI = {
  list: (params: ListSessionsParams = {}) =>
    API.get<PaginatedEnvelope<UserSession>>("/sessions", { params }).then(
      (res) => res.data
    ),

  summary: () =>
    API.get<ApiEnvelope<SessionsSummary>>("/sessions/summary").then(
      (res) => res.data
    ),

  forceLogout: (id: number) =>
    API.patch<ApiEnvelope<UserSession>>(`/sessions/${id}/force-logout`).then(
      (res) => res.data
    ),
};

export const getApiErrorMessage = (error: unknown): string => {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return (
    axiosError.response?.data?.message ||
    axiosError.message ||
    "Something went wrong. Please try again."
  );
};

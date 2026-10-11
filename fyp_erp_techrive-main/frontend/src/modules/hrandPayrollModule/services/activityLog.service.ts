import type { AxiosError } from "axios";
import API from "../../../api/api";
import type {
  ActivityLog,
  ApiErrorResponse,
  ListActivityLogsParams,
  PaginatedEnvelope,
} from "./activityLog.types";

// ─── Activity Log — API Service ──────────────────────────────────────────────
export const activityLogAPI = {
  list: (params: ListActivityLogsParams = {}) =>
    API.get<PaginatedEnvelope<ActivityLog>>("/activity-logs", { params }).then(
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

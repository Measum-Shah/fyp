// ─── Session Log — Types ─────────────────────────────────────────────────────
// Mirrors backend session.service.ts (sessionSelect) field-for-field, plus
// the `isOnline` flag computed server-side in listSessions().

export const LOGIN_STATUS = {
  SUCCESS: "success",
  FAILED: "failed",
} as const;

export type LoginStatus = (typeof LOGIN_STATUS)[keyof typeof LOGIN_STATUS];

export interface UserSession {
  id: number;
  user_id: number | null;
  user_name: string | null;
  user_email: string | null;
  role_id: number | null;
  branch_id: number | null;
  login_time: string | null;
  logout_time: string | null;
  session_duration_seconds: number | null;
  ip_address: string | null;
  user_agent: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  is_active: number; // 1 | 0 — matches project's SmallInt boolean-flag convention (see staff.disability)
  login_status: LoginStatus;
  failure_reason: string | null;
  logout_reason: string | null;
  last_activity_at: string | null;
  created_at: string | null;
  isOnline: boolean;
}

export interface SessionsSummary {
  activeCount: number;
  onlineCount: number;
}

export interface ListSessionsParams {
  page?: number;
  limit?: number;
  user_id?: number;
  is_active?: boolean;
  login_status?: LoginStatus;
  search?: string;
}

// ─── API envelope shapes ─────────────────────────────────────────────────────
// Same contract as employee.types.ts's ApiEnvelope/PaginatedEnvelope —
// duplicated locally (rather than imported cross-feature) to match this
// project's existing convention of each feature owning its own types file.
export interface ApiEnvelope<T> {
  message: string;
  data: T;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedEnvelope<T> {
  message: string;
  data: T[];
  meta: PaginationMeta;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string>;
}

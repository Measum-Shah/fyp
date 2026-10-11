// ─── Activity Log — Types ────────────────────────────────────────────────────
// Mirrors backend activityLog.service.ts (activityLogSelect) field-for-field.

export interface ActivityLog {
  id: string; // BigInt id serializes as a string over JSON — see activityLog.service.ts
  user_id: number | null;
  user_name: string | null;
  role_id: number | null;
  branch_id: number | null;
  module: string;
  action: string;
  record_type: string | null;
  record_id: string | null;
  previous_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  description: string | null;
  ip_address: string | null;
  user_agent: string | null;
  request_method: string | null;
  endpoint: string | null;
  created_at: string | null;
}

export interface ListActivityLogsParams {
  page?: number;
  limit?: number;
  user_id?: number;
  module?: string;
  action?: string;
  record_type?: string;
  record_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// ─── API envelope shapes ───────────────────────────────────────────────────
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

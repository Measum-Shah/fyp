// ─── Holiday — Types ──────────────────────────────────────────────────────────
// Reuses ApiEnvelope/PaginatedEnvelope/PaginationMeta from employee.types.ts,
// same pattern as branch.types.ts/workShift.types.ts.

export interface Holiday {
  id: number;
  holiday_name: string;
  start_date: string | null; // ISO date string; optional per the simplified form
  end_date: string | null; // ISO date string; optional per the simplified form
  days: number; // derived server-side from the dates when present, otherwise the submitted Number of Days
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateHolidayPayload {
  holiday_name: string;
  days: number;
  start_date?: string; // "YYYY-MM-DD"
  end_date?: string; // "YYYY-MM-DD"
}

export type UpdateHolidayPayload = Partial<CreateHolidayPayload>;

export interface HolidayFormValues {
  holiday_name: string;
  days: string;
  start_date: string;
  end_date: string;
}

export const EMPTY_HOLIDAY_FORM_VALUES: HolidayFormValues = {
  holiday_name: "",
  days: "",
  start_date: "",
  end_date: "",
};

export interface ListHolidaysParams {
  page?: number;
  limit?: number;
  search?: string;
  year?: number;
}
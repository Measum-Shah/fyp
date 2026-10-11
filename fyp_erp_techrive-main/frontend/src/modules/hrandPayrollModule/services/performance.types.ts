export const PERFORMANCE_RATING = {
  EXCELLENT: "Excellent",
  GOOD: "Good",
  AVERAGE: "Average",
  POOR: "Poor",
} as const;

export const PERFORMANCE_STATUS = { ACTIVE: "Active", INACTIVE: "Inactive" } as const;

export const MONTH_OPTIONS = [
  { value: "01", label: "January" }, { value: "02", label: "February" },
  { value: "03", label: "March" }, { value: "04", label: "April" },
  { value: "05", label: "May" }, { value: "06", label: "June" },
  { value: "07", label: "July" }, { value: "08", label: "August" },
  { value: "09", label: "September" }, { value: "10", label: "October" },
  { value: "11", label: "November" }, { value: "12", label: "December" },
] as const;

export interface Performance {
  id: number;
  user_id: number | null;
  // `performance` is the single rating captured by the simplified form.
  // Records created before this change won't have it set — fall back to
  // `student_feedback` (one of the legacy rating columns) when displaying.
  performance: string | null;
  lecture_deliver: string | null;
  confidence: string | null;
  punctuality: string | null;
  moral_values: string | null;
  student_feedback: string | null;
  date: string | null;
  month: string | null;
  status: string | null;
  created_by: number | null;
  updated_by: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreatePerformancePayload {
  staff_id: number;
  month: string;
  date: string;
  performance: string;
}

export type UpdatePerformancePayload = Partial<CreatePerformancePayload>;

export interface PerformanceFormValues {
  staff_id: string;
  month: string;
  date: string;
  performance: string;
}

export const EMPTY_PERFORMANCE_FORM_VALUES: PerformanceFormValues = {
  staff_id: "",
  month: String(new Date().getMonth() + 1).padStart(2, "0"),
  date: new Date().toISOString().slice(0, 10),
  performance: PERFORMANCE_RATING.GOOD,
};

export interface ListPerformancesParams {
  page?: number;
  limit?: number;
  staff_id?: number;
  month?: string;
}
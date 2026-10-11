// ─── Work Shift — Types ───────────────────────────────────────────────────────
// Reuses ApiEnvelope/PaginatedEnvelope/PaginationMeta from employee.types.ts,
// same pattern as branch.types.ts.

import { WORK_SHIFT_STATUS } from "./workShift.constants";

export { WORK_SHIFT_STATUS };

export interface WorkWeekDay {
  day: number;
  on_off: number;
  start_time: string | null; // "HH:mm", null when on_off is OFF
  end_time: string | null; // "HH:mm", null when on_off is OFF
}

export interface WorkShift {
  id: number;
  name: string;
  branch_id: number | null;
  grace_in: number | null; // minutes
  grace_out: number | null; // minutes
  status: number;
  created_at: string | null;
  updated_at: string | null;
  week: WorkWeekDay[];
}

export interface WorkWeekDayPayload {
  day: number;
  on_off: number;
  start_time?: string;
  end_time?: string;
}

export interface CreateWorkShiftPayload {
  name: string;
  branch_id?: number | null;
  grace_in?: number | null;
  grace_out?: number | null;
  status?: number;
  week: WorkWeekDayPayload[];
}

export type UpdateWorkShiftPayload = Partial<Omit<CreateWorkShiftPayload, "week">> & {
  week?: WorkWeekDayPayload[];
};

// ─── Form values (all strings — inputs are controlled as text) ──────────────
export interface WorkWeekDayFormValues {
  day: number;
  on_off: boolean;
  start_time: string;
  end_time: string;
}

export interface WorkShiftFormValues {
  name: string;
  branch_id: string;
  grace_in: string;
  grace_out: string;
  status: string;
  week: WorkWeekDayFormValues[];
}

export const EMPTY_WORK_WEEK: WorkWeekDayFormValues[] = [1, 2, 3, 4, 5, 6, 7].map((day) => ({
  day,
  on_off: day >= 1 && day <= 5, // Mon-Fri on by default, weekend off
  start_time: "09:00",
  end_time: "17:00",
}));

export const EMPTY_WORK_SHIFT_FORM_VALUES: WorkShiftFormValues = {
  name: "",
  branch_id: "",
  grace_in: "",
  grace_out: "",
  status: String(WORK_SHIFT_STATUS.ACTIVE),
  week: EMPTY_WORK_WEEK,
};

export interface ListWorkShiftsParams {
  page?: number;
  limit?: number;
  search?: string;
  branch_id?: number;
  status?: number;
}
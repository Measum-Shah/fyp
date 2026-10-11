// ─── Termination — Types ──────────────────────────────────────────────────────
export const ACKNOWLEDGE_STATUS = { NO: "no", YES: "yes" } as const;

export interface Termination {
  id: number;
  user_id: number;
  reason: string;
  warnings: string;
  acknowledge: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateTerminationPayload {
  staff_id: number;
  reason: string;
  warnings: string;
  acknowledge?: string;
}

export type UpdateTerminationPayload = Partial<CreateTerminationPayload>;

export interface TerminationFormValues {
  staff_id: string;
  reason: string;
  warnings: string;
  acknowledge: string;
}

export const EMPTY_TERMINATION_FORM_VALUES: TerminationFormValues = {
  staff_id: "",
  reason: "",
  warnings: "",
  acknowledge: ACKNOWLEDGE_STATUS.NO,
};

export interface ListTerminationsParams {
  page?: number;
  limit?: number;
  search?: string;
  staff_id?: number;
}

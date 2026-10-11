import { MONTH_STATUS } from "./month.constants";

export { MONTH_STATUS };

export interface Month {
  id: number;
  title: string;
  status: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateMonthPayload {
  title: string;
  status?: number;
}

export type UpdateMonthPayload = Partial<CreateMonthPayload>;

export interface MonthFormValues {
  title: string;
  status: string;
}

export const EMPTY_MONTH_FORM_VALUES: MonthFormValues = {
  title: "",
  status: String(MONTH_STATUS.ACTIVE),
};

export interface ListMonthsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
}

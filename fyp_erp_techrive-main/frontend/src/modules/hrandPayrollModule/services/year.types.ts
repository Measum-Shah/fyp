import { YEAR_ACTIVE_STATUS, YEAR_STATUS } from "./year.constants";

export { YEAR_STATUS, YEAR_ACTIVE_STATUS };

export interface Year {
  id: number;
  title: string;
  active_status: number;
  status: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateYearPayload {
  year: number;
  status?: number;
}

export interface UpdateYearPayload {
  status?: number;
}

export interface YearFormValues {
  year: string;
  status: string;
}

export const EMPTY_YEAR_FORM_VALUES: YearFormValues = {
  year: "",
  status: String(YEAR_STATUS.ACTIVE),
};

export interface ListYearsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
}

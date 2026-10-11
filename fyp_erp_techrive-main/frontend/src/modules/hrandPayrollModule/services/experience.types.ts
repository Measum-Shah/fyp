export interface Experience {
  id: number;
  staff_id: number | null;
  staff_bi_id: number | null;
  name: string;
  designation: string;
  from_date: string | null;
  to_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateExperiencePayload {
  staff_id: number;
  name: string;
  designation: string;
  from_date: string;
  to_date: string;
}

export type UpdateExperiencePayload = Partial<CreateExperiencePayload>;

export interface ExperienceFormValues {
  staff_id: string;
  name: string;
  designation: string;
  from_date: string;
  to_date: string;
}

export const EMPTY_EXPERIENCE_FORM_VALUES: ExperienceFormValues = {
  staff_id: "",
  name: "",
  designation: "",
  from_date: "",
  to_date: "",
};

export interface ListExperiencesParams {
  page?: number;
  limit?: number;
  search?: string;
  staff_id?: number;
}

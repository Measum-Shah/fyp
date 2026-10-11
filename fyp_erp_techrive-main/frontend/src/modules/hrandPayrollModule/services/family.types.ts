export interface Family {
  id: number;
  staff_id: number | null;
  staff_bi_id: number | null;
  name: string;
  relation: string;
  phone: string;
  gender: string;
  cnic: string;
  workplace: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateFamilyPayload {
  staff_id: number;
  name: string;
  relation: string;
  phone: string;
  gender?: string;
  cnic?: string;
  workplace?: string;
}

export type UpdateFamilyPayload = Partial<CreateFamilyPayload>;

export interface FamilyFormValues {
  staff_id: string;
  name: string;
  relation: string;
  phone: string;
  gender: string;
  cnic: string;
  workplace: string;
}

export const EMPTY_FAMILY_FORM_VALUES: FamilyFormValues = {
  staff_id: "",
  name: "",
  relation: "",
  phone: "",
  gender: "",
  cnic: "",
  workplace: "",
};

export interface ListFamiliesParams {
  page?: number;
  limit?: number;
  search?: string;
  staff_id?: number;
}
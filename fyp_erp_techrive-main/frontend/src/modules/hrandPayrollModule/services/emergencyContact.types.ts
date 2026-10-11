export interface EmergencyContact {
  id: number;
  staff_id: number | null;
  staff_bi_id: number | null;
  name: string;
  relation: string;
  phone: string;
  email: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateEmergencyContactPayload {
  staff_id: number;
  name: string;
  relation: string;
  phone: string;
  email: string;
}

export type UpdateEmergencyContactPayload = Partial<CreateEmergencyContactPayload>;

export interface EmergencyContactFormValues {
  staff_id: string;
  name: string;
  relation: string;
  phone: string;
  email: string;
}

export const EMPTY_EMERGENCY_CONTACT_FORM_VALUES: EmergencyContactFormValues = {
  staff_id: "",
  name: "",
  relation: "",
  phone: "",
  email: "",
};

export interface ListEmergencyContactsParams {
  page?: number;
  limit?: number;
  search?: string;
  staff_id?: number;
}

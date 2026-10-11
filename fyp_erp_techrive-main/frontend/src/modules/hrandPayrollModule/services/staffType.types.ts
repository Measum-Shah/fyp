// ─── Staff Type — Types ──────────────────────────────────────────────────────
// Mirrors backend staffType.service.ts (staffTypeSelect) and
// validators/staffType.validator.ts field-for-field.

export interface StaffType {
  id: number;
  name: string;
  staff_type_code: string;
  description: string | null;
  sequence_id: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateStaffTypePayload {
  name: string;
  staff_type_code: string;
  description?: string;
  sequence_id?: number;
}

export type UpdateStaffTypePayload = Partial<CreateStaffTypePayload>;

export interface StaffTypeFormValues {
  name: string;
  staff_type_code: string;
  description: string;
}

export const EMPTY_STAFF_TYPE_FORM_VALUES: StaffTypeFormValues = {
  name: "",
  staff_type_code: "",
  description: "",
};

export interface ListStaffTypesParams {
  page?: number;
  limit?: number;
  search?: string;
}

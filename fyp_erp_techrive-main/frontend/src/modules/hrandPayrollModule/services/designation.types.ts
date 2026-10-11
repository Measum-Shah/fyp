// ─── Designation — Types ─────────────────────────────────────────────────────
// Mirrors backend designation.service.ts (designationSelect) and
// validators/designation.validator.ts field-for-field.
//
// Parent Designation (former `parent_id`) has been removed — see
// backend/src/prisma/migrations_manual/2026082401_designation_experience_letter_approvals.sql.

export interface Designation {
  id: number;
  name: string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateDesignationPayload {
  name: string;
  description?: string;
}

export type UpdateDesignationPayload = Partial<CreateDesignationPayload>;

export interface DesignationFormValues {
  name: string;
  description: string;
}

export const EMPTY_DESIGNATION_FORM_VALUES: DesignationFormValues = {
  name: "",
  description: "",
};

export interface ListDesignationsParams {
  page?: number;
  limit?: number;
  search?: string;
}
// ─── Department — Types ──────────────────────────────────────────────────────
// Reuses ApiEnvelope/PaginatedEnvelope/PaginationMeta/ApiErrorResponse from
// employee.types.ts rather than redefining them — those are already generic,
// not employee-specific.

export interface Department {
  id: number;
  name: string;
  description: string | null;
  company_id?: number | null;
  branch_id?: number | null;
  university_name?: string | null;
  campus_name?: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateDepartmentPayload {
  name: string;
  description?: string;
  company_id?: number;
  branch_id?: number;
}

export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload>;

export interface DepartmentFormValues {
  name: string;
  description: string;
  company_id: string;
  branch_id: string;
}

export const EMPTY_DEPARTMENT_FORM_VALUES: DepartmentFormValues = {
  name: "",
  description: "",
  company_id: "",
  branch_id: "",
};

export interface ListDepartmentsParams {
  page?: number;
  limit?: number;
  search?: string;
}
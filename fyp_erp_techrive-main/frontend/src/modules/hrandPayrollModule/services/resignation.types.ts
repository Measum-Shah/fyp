// ─── Resignation — Types ──────────────────────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/resignation.service.ts

export const APPROVAL_STATUS = { PENDING: "Pending", APPROVED: "Approved", REJECTED: "Rejected" } as const;

export interface Resignation {
  id: number;
  staff_id: number;
  reason: string;
  join_date: string | null;
  notice_period: string;
  experience_letter: string | null;
  approved_by_ceo: string | null;
  approved_by_ceo_employee_id: number | null;
  approved_by_ceo_designation_id: number | null;
  approved_by_hr_head: string | null;
  approved_by_hr_head_employee_id: number | null;
  approved_by_hr_head_designation_id: number | null;
  class: string | null;
  subject: string | null;
  last_day_of_work: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  branch_id: number;
  role_id: number;
}

export interface CreateResignationPayload {
  staff_id: number;
  branch_id: number;
  role_id: number;
  reason: string;
  notice_period: string;
  last_day_of_work: string;
  join_date?: string;
  experience_letter?: string;
  class?: string;
  subject?: string;
}

export type UpdateResignationPayload = Partial<CreateResignationPayload>;

export interface UpdateResignationApprovalPayload {
  approved_by_ceo?: string;
  approved_by_ceo_employee_id?: number;
  approved_by_ceo_designation_id?: number;
  approved_by_hr_head?: string;
  approved_by_hr_head_employee_id?: number;
  approved_by_hr_head_designation_id?: number;
}

export interface ResignationFormValues {
  staff_id: string;
  branch_id: string;
  role_id: string;
  reason: string;
  notice_period: string;
  last_day_of_work: string;
  join_date: string;
  experience_letter: string;
  class: string;
  subject: string;
}

export const EMPTY_RESIGNATION_FORM_VALUES: ResignationFormValues = {
  staff_id: "",
  branch_id: "",
  role_id: "",
  reason: "",
  notice_period: "",
  last_day_of_work: "",
  join_date: "",
  experience_letter: "",
  class: "",
  subject: "",
};

export interface ListResignationsParams {
  page?: number;
  limit?: number;
  search?: string;
  staff_id?: number;
  branch_id?: number;
  status?: string;
}
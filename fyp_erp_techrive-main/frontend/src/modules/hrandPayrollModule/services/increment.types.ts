// ─── Increment — Types ────────────────────────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/increment.service.ts
// and validators/increment.validator.ts. Field names/casing (New_salary_increment,
// Amount) are kept exactly as they are in the database.
//
// The old dual CEO/Principal Approval workflow is now a single Status field
// (Pending / Approved / Rejected) — see increment-status-schema-alter.sql.
//
// "Company"/"Branch" are labeled "School"/"Campus" throughout this feature's
// UI (the underlying staff_id/branch_id relationships are unchanged).

export const INCREMENT_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

export interface Increment {
  id: number;
  role_id: string | null;
  staff_type: string | null;
  user_id: number | null;
  reason: string | null;
  basic_salary: number | null;
  New_salary_increment: number | null;
  Amount: number | null;
  increment_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  previous_gross_salary: number | null;
  status: string | null;
  branch_id: number | null;
  created_by: number | null;
  staff_id: number | null;
}

export interface CreateIncrementPayload {
  staff_id: number;
  branch_id: number;
  reason: string;
  increment_date: string;
  basic_salary: number;
  previous_gross_salary: number;
  New_salary_increment: number;
  Amount: number;
  staff_type?: string;
  role_id?: string;
}

export type UpdateIncrementPayload = Partial<CreateIncrementPayload>;

export interface UpdateIncrementStatusPayload {
  status: string;
}

// Returned by GET /increments/staff/:staffId/salary-snapshot — feeds the
// New Increment Request form's auto-fill (School, Campus, Current Basic
// Salary, Previous Gross Salary) the moment an Employee is selected.
export interface StaffSalarySnapshot {
  staff_id: number;
  branch_id: number | null;
  company_id: number | null;
  basic_salary: number;
  previous_gross_salary: number;
}

export interface IncrementFormValues {
  staff_id: string;
  branch_id: string;
  reason: string;
  increment_date: string;
  basic_salary: string;
  previous_gross_salary: string;
  new_salary_increment: string;
  amount: string;
}

export const EMPTY_INCREMENT_FORM_VALUES: IncrementFormValues = {
  staff_id: "",
  branch_id: "",
  reason: "",
  increment_date: new Date().toISOString().slice(0, 10),
  basic_salary: "",
  previous_gross_salary: "",
  new_salary_increment: "",
  amount: "",
};

export interface ListIncrementsParams {
  page?: number;
  limit?: number;
  search?: string;
  staff_id?: number;
  branch_id?: number;
}
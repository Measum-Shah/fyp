// ─── Employee Management — Shared Types ─────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/employee.service.ts
// (employeeSelect) and validators/employee.validator.ts field-for-field, so
// there is a single, correct contract between the two sides.

import type { SalaryAllowanceFormEntry } from "./salary.types";

// Re-exported so employee.validation.ts / EmployeeForm.tsx don't need to
// import directly from the Salary module — the shape is identical (see
// salary.types.ts), just applied to an employee's default Salary
// Structure instead of one specific monthly sheet.
export type EmployeeAllowanceFormEntry = SalaryAllowanceFormEntry;

// Mirrors backend employee.service.ts's AppliedStaffAllowanceView.
export interface AppliedStaffAllowance {
  id: number;
  allowance_type_id: number;
  name: string;
  amount: number;
  is_taxable: boolean;
}

export const EMPLOYEE_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
} as const;

export type EmployeeStatus = (typeof EMPLOYEE_STATUS)[keyof typeof EMPLOYEE_STATUS];

export const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;
export type Gender = (typeof GENDER_OPTIONS)[number];

// staff.payment_type — Permanent staff use a fixed monthly Salary Structure
// (basic + allowances); Visiting Faculty are paid per teaching hour
// (rate/hour x hours worked). Drives which fields the Salary tab shows.
// NOTE: these two values are the actual data stored on `staff.payment_type`
// and are kept unchanged on purpose so existing records/API/data flow are
// not affected. Only their user-facing display names have changed — see
// PAYMENT_TYPE_LABELS below ("Permanent" is shown as "Fixed Salary" and
// "Visiting Faculty" is shown as "Per Hour Salary").
export const PAYMENT_TYPE = {
  PERMANENT: "Permanent",
  VISITING_FACULTY: "Visiting Faculty",
} as const;
export const PAYMENT_TYPE_OPTIONS = [PAYMENT_TYPE.PERMANENT, PAYMENT_TYPE.VISITING_FACULTY] as const;
export type PaymentType = (typeof PAYMENT_TYPE_OPTIONS)[number];

// Display-only labels for the Payment Type options — the underlying stored
// value (PAYMENT_TYPE.PERMANENT / PAYMENT_TYPE.VISITING_FACULTY) is never
// changed, only what the user sees in the dropdown.
export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  [PAYMENT_TYPE.PERMANENT]: "Fixed Salary",
  [PAYMENT_TYPE.VISITING_FACULTY]: "Per Hour Salary",
};

// staff.disability — real SmallInt (NOT NULL, default 0), boolean-shaped
export const DISABILITY_STATUS = {
  NO: 0,
  YES: 1,
} as const;

// ─── API envelope shapes ─────────────────────────────────────────────────────
// Every backend response follows { message, data } or { message, data, meta }.
export interface ApiEnvelope<T> {
  message: string;
  data: T;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedEnvelope<T> {
  message: string;
  data: T[];
  meta: PaginationMeta;
}

// 422 validation / 400 / 409 error responses carry a field-level breakdown
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string>;
}

// ─── Employee record (as returned by the API — dates are ISO strings) ───────
export interface Employee {
  id: number;
  reg_no: string | null;
  branch_id: number;
  user_id: number;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  father_name: string | null;
  email: string;
  mobile_1: string | null;
  mobile_2: string | null;
  gender: string | null;
  cnic: string;
  cnic_attachment: string | null;
  cnic_issue_date: string | null;
  cnic_expiry_date: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  qualification: string | null;
  staff_type: string;
  designation: string | null;
  department_id: number | null;
  join_date: string | null;
  status: string | null;

  mother_name: string | null;
  date_of_birth: string | null;
  marital_status: string | null;
  blood_group: string | null;
  nationality: string | null;
  mother_tongue: string | null;
  disability: number;
  disability_description: string | null;

  home_phone: string | null;
  pemail: string | null;
  temp_address: string | null;
  state: string | null;
  temp_state: string | null;
  temp_country: string | null;

  ntn: string | null;
  staff_image: string | null;
  skill: string | null;
  experience: string | null;
  other_info: string | null;
  job_status: string | null;
  probation: string | null;
  start_day_contract: string | null;
  end_day_contract: string | null;
  expiry_date: string | null;
  first_registration_code: string | null;
  reports_to: number | null;
  replaced_by: number | null;

  // ─── Salary Structure ───────────────────────────────────────────────────
  payment_type: string | null;
  basic_salary: number | null;
  conveyance: string | null;
  house_rent: string | null;
  medical_allowances: string | null;
  tax_percentage: number | null;
  epf_amount: number | null;
  eobi_amount: number | null;
  bank_account: string | null;
  salary_per_hour: string | null;
  hours_worked: number | null;
  // Manual slice of the taxable base shielded from tax entirely — added
  // 2026-08-16, mirrors SalarySheet.exempt_amount.
  exempt_amount: number | null;
  // Default allowances (hr_staff_allowances) — added 2026-08-15, see
  // EmployeeAllowanceFormEntry above.
  allowances: AppliedStaffAllowance[];

  created_at: string | null;
  updated_at: string | null;
}

// ─── Create / Update payloads ────────────────────────────────────────────────
// Mirrors createEmployeeSchema in employee.validator.ts
export interface CreateEmployeePayload {
  // Not sent by the Add Employee form — auto-generated server-side (see
  // employee.constants.ts's EMPLOYEE_ID_PREFIX note). Stays optional here
  // only so UpdateEmployeePayload (Partial<CreateEmployeePayload>) can
  // still carry a manual correction from the Edit form.
  reg_no?: string;
  first_name: string;
  last_name?: string;
  father_name?: string;
  email: string;
  mobile_1: string;
  mobile_2?: string;
  department_id: number;
  designation: string;
  join_date: string; // YYYY-MM-DD
  branch_id: number;
  staff_type: string;
  cnic: string;
  cnic_attachment?: string;
  cnic_issue_date?: string; // YYYY-MM-DD
  cnic_expiry_date?: string; // YYYY-MM-DD
  gender?: Gender;
  address?: string;
  city?: string;
  country?: string;
  qualification?: string;
  status?: EmployeeStatus;

  mother_name?: string;
  date_of_birth?: string;
  marital_status?: string;
  blood_group?: string;
  nationality?: string;
  mother_tongue?: string;
  disability?: number;
  disability_description?: string;

  home_phone?: string;
  pemail?: string;
  temp_address?: string;
  state?: string;
  temp_state?: string;
  temp_country?: string;

  ntn?: string;
  staff_image?: string;
  skill?: string;
  experience?: string;
  other_info?: string;
  job_status?: string;
  probation?: string;
  start_day_contract?: string;
  end_day_contract?: string;
  expiry_date?: string; // YYYY-MM-DD
  first_registration_code?: string;
  reports_to?: number;
  replaced_by?: number;

  // ─── Salary Structure ───────────────────────────────────────────────────
  payment_type?: PaymentType;
  basic_salary?: number;
  conveyance?: number;
  house_rent?: number;
  medical_allowances?: number;
  tax_percentage?: number;
  epf_amount?: number;
  eobi_amount?: number;
  bank_account?: string;
  salary_per_hour?: number;
  hours_worked?: number;
  exempt_amount?: number;
  // Optional default allowances — picked from the reusable Allowance
  // Types master list, see EmployeeAllowanceFormEntry above.
  allowances?: { allowance_type_id: number; amount?: number }[];
}

// Mirrors updateEmployeeSchema (createEmployeeSchema.partial())
export type UpdateEmployeePayload = Partial<CreateEmployeePayload>;

// ─── List query params ───────────────────────────────────────────────────────
export interface ListEmployeesParams {
  page?: number;
  limit?: number;
  search?: string;
  department_id?: number;
  status?: EmployeeStatus;
}

// ─── Lookup option (Department / Branch / Designation / Staff Type) ─────────
export interface LookupOption {
  id: number;
  name: string;
}

// Mirrors backend lookup.service.ts's StaffLookupOption — the /lookups/staff
// endpoint now also returns each employee's designation_id (kept in sync
// with their free-text Designation on every save), so an Approver Name
// selection can auto-populate Approver Designation. See
// hooks/useStaffLookup.ts and components/ApproverFields.tsx.
export interface StaffLookupOption extends LookupOption {
  designation_id: number | null;
}

// Feeds the Attendance module's employee search picker — see
// employeeAPI.lookups.search in employee.service.ts and
// GET /employees/lookups/search on the backend.
export interface EmployeeSearchOption extends LookupOption {
  reg_no: string | null;
  branch_id: number;
}
// ─── Form values ──────────────────────────────────────────────────────────────
// Every field is a plain string, matching what <input>/<select> elements
// naturally produce — including the numeric ones (department_id,
// branch_id), which are parsed to numbers only at submit time. This is the
// shape EmployeeForm (shared by Add/Edit) operates on; conversion to/from
// CreateEmployeePayload / Employee happens in employee.validation.ts.
// (No user_id/password here — Account Access was removed from this form;
// linking a login is done exclusively via the Users page. See
// employee.service.ts's createEmployee for how the backend still
// satisfies staff.user_id/password's NOT NULL columns without this form's
// help.)
export interface EmployeeFormValues {
  reg_no: string;
  first_name: string;
  last_name: string;
  father_name: string;
  email: string;
  mobile_1: string;
  mobile_2: string;
  // UI-only — the `staff` table has no company column (a Company only
  // relates to an employee indirectly, through branch.company_id), so this
  // never appears in CreateEmployeePayload/UpdateEmployeePayload and is
  // never read back in employeeToFormValues. It exists purely so the
  // Employment Details "Company" dropdown (used to narrow which
  // Department/Branch make sense to pick) has somewhere to live in form
  // state, the same way every other <select> here does.
  company_id: string;
  department_id: string;
  designation: string;
  join_date: string;
  branch_id: string;
  staff_type: string;
  cnic: string;
  cnic_attachment: string;
  cnic_issue_date: string;
  cnic_expiry_date: string;
  gender: string;
  address: string;
  city: string;
  country: string;
  qualification: string;
  status: string;

  mother_name: string;
  date_of_birth: string;
  marital_status: string;
  blood_group: string;
  nationality: string;
  mother_tongue: string;
  disability: string;
  disability_description: string;

  home_phone: string;
  pemail: string;
  temp_address: string;
  state: string;
  temp_state: string;
  temp_country: string;

  ntn: string;
  staff_image: string;
  skill: string;
  experience: string;
  other_info: string;
  job_status: string;
  probation: string;
  start_day_contract: string;
  end_day_contract: string;
  expiry_date: string;
  first_registration_code: string;
  reports_to: string;

  // ─── Salary Structure ───────────────────────────────────────────────────
  payment_type: string;
  basic_salary: string;
  conveyance: string;
  house_rent: string;
  medical_allowances: string;
  tax_percentage: string;
  epf_amount: string;
  eobi_amount: string;
  bank_account: string;
  salary_per_hour: string;
  hours_worked: string;
  exempt_amount: string;
  // Default allowances for this employee's Salary Structure — same shape
  // as the Salary Sheet form's picker, see EmployeeAllowanceFormEntry.
  allowances: EmployeeAllowanceFormEntry[];
}

export const EMPTY_EMPLOYEE_FORM_VALUES: EmployeeFormValues = {
  reg_no: "",
  first_name: "",
  last_name: "",
  father_name: "",
  email: "",
  mobile_1: "",
  mobile_2: "",
  company_id: "",
  department_id: "",
  designation: "",
  join_date: "",
  branch_id: "",
  staff_type: "",
  cnic: "",
  cnic_attachment: "",
  cnic_issue_date: "",
  cnic_expiry_date: "",
  gender: "",
  address: "",
  city: "",
  country: "",
  qualification: "",
  status: "",

  mother_name: "",
  date_of_birth: "",
  marital_status: "",
  blood_group: "",
  nationality: "",
  mother_tongue: "",
  disability: String(DISABILITY_STATUS.NO),
  disability_description: "",

  home_phone: "",
  pemail: "",
  temp_address: "",
  state: "",
  temp_state: "",
  temp_country: "",

  ntn: "",
  staff_image: "",
  skill: "",
  experience: "",
  other_info: "",
  job_status: "",
  probation: "",
  start_day_contract: "",
  end_day_contract: "",
  expiry_date: "",
  first_registration_code: "",
  reports_to: "",

  payment_type: PAYMENT_TYPE.PERMANENT,
  basic_salary: "",
  conveyance: "",
  house_rent: "",
  medical_allowances: "",
  tax_percentage: "",
  epf_amount: "",
  eobi_amount: "",
  bank_account: "",
  salary_per_hour: "",
  hours_worked: "",
  exempt_amount: "",
  allowances: [],
};
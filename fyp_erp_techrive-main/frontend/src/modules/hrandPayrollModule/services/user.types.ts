// ─── User Account Management — Types ─────────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/user.service.ts
// (userSelect / UserWithLookups) and validators/user.validator.ts field-for-field.
// Reuses ApiEnvelope/PaginatedEnvelope/PaginationMeta from employee.types.ts.
//
// role_id/role_name have been removed — the Roles & Permissions system
// they belonged to is gone. Access to the HR & Payroll module is now
// decided entirely by user_type (see backend's hrAccess.middleware.ts and
// App.tsx's ProtectedRoute adminOnly flag): "admin" and "hr" get in,
// everything else is routed to its own portal elsewhere in the app.

export const USER_TYPE_OPTIONS = ["staff", "admin"] as const;
export type UserType = (typeof USER_TYPE_OPTIONS)[number];

export interface User {
  id: number;
  name: string;
  email: string;
  branch_id: number | null;
  branch_name: string | null;
  employee_id: number | null;
  employee_name: string | null;
  user_type: string | null;
  active: number;
  status: number | null;
  last_login_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface EmployeeLookupOption {
  id: number;
  name: string;
  reg_no: string | null;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  branch_id?: number | null;
  employee_id?: number | null;
  user_type?: UserType;
  active?: number;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  branch_id?: number | null;
  employee_id?: number | null;
  user_type?: UserType;
  active?: number;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface UserFormValues {
  name: string;
  email: string;
  password: string;
  branch_id: string; // "" = no branch
  employee_id: string; // "" = not linked to an employee record
  user_type: UserType;
}

export const EMPTY_USER_FORM_VALUES: UserFormValues = {
  name: "",
  email: "",
  password: "",
  branch_id: "",
  employee_id: "",
  user_type: "staff",
};

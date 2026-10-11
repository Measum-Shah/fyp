// ─── Leave Type — Types ──────────────────────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/leaveType.service.ts
// (leaveTypeSelect) and validators/leaveType.validator.ts field-for-field.
// Reuses ApiEnvelope/PaginatedEnvelope/PaginationMeta/ApiErrorResponse/
// LookupOption from employee.types.ts, same as department.types.ts does.

export const LEAVE_TYPE_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

// pay_type (2026-08-22, fixes audit finding #3): mirrors backend
// LEAVE_TYPE_PAY_TYPE — whether days of this leave type reduce net salary
// via the automated Payroll Run. Defaults to PAID.
export const LEAVE_TYPE_PAY_TYPE = {
  PAID: 0,
  UNPAID: 1,
} as const;

export interface LeaveType {
  id: number;
  name: string;
  permitted_days: number;
  year: number;
  parent_id: number | null;
  type: string | null;
  start_date: string | null;
  end_date: string | null;
  pay_type: number;
  status: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateLeaveTypePayload {
  name: string;
  permitted_days?: number;
  year?: number;
  parent_id?: number | null;
  type?: string;
  start_date?: string;
  end_date?: string;
  pay_type?: number;
  status?: number;
}

export type UpdateLeaveTypePayload = Partial<CreateLeaveTypePayload>;

export interface LeaveTypeFormValues {
  name: string;
  permitted_days: string;
  year: string;
  parent_id: string;
  type: string;
  start_date: string;
  end_date: string;
  pay_type: number;
  status: number;
}

export const EMPTY_LEAVE_TYPE_FORM_VALUES: LeaveTypeFormValues = {
  name: "",
  permitted_days: "",
  year: String(new Date().getFullYear()),
  parent_id: "",
  type: "",
  start_date: "",
  end_date: "",
  pay_type: LEAVE_TYPE_PAY_TYPE.PAID,
  status: LEAVE_TYPE_STATUS.ACTIVE,
};

export interface ListLeaveTypesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
}
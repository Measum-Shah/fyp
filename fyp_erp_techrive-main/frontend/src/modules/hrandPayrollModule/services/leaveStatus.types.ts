// ─── Leave Status — Types ────────────────────────────────────────────────────
// Mirrors backend leaveStatus.service.ts (leaveStatusSelect) and
// validators/leaveStatus.validator.ts field-for-field.

export const LEAVE_STATUS_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

// counts_as_approved (2026-08-22, fixes audit finding #3): mirrors backend
// LEAVE_STATUS_APPROVAL_FLAG. Since this table is free-text/admin-named,
// this flag is how HR tells the automated Payroll Run which status row(s)
// mean "Approved" for leave-deduction purposes.
export const LEAVE_STATUS_APPROVAL_FLAG = {
  COUNTS_AS_APPROVED: 1,
  DOES_NOT_COUNT: 0,
} as const;

export interface LeaveStatus {
  id: number;
  name: string;
  counts_as_approved: number;
  status: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateLeaveStatusPayload {
  name: string;
  counts_as_approved?: 0 | 1;
  status?: number;
}

export type UpdateLeaveStatusPayload = Partial<CreateLeaveStatusPayload>;

export interface LeaveStatusFormValues {
  name: string;
  counts_as_approved: 0 | 1;
  status: number;
}

export const EMPTY_LEAVE_STATUS_FORM_VALUES: LeaveStatusFormValues = {
  name: "",
  counts_as_approved: LEAVE_STATUS_APPROVAL_FLAG.DOES_NOT_COUNT,
  status: LEAVE_STATUS_STATUS.ACTIVE,
};

export interface ListLeaveStatusesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: number;
}
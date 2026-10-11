// ─── Leave Entitlement — Types ───────────────────────────────────────────────
// Mirrors backend leaveEntitlement.service.ts (leaveEntitlementSelect) and
// validators/leaveEntitlement.validator.ts field-for-field.

export const LEAVE_ENTITLEMENT_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

export interface LeaveEntitlement {
  id: number;
  employee_id: number;
  leave_type_id: number;
  no_of_days: number;
  days_used: number;
  start_date: string | null;
  end_date: string | null;
  credited_date: string | null;
  status: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateLeaveEntitlementPayload {
  employee_id: number;
  leave_type_id: number;
  no_of_days: number;
  days_used?: number;
  start_date?: string;
  end_date?: string;
  credited_date?: string;
  status?: number;
}

export type UpdateLeaveEntitlementPayload = Partial<CreateLeaveEntitlementPayload>;

export interface LeaveEntitlementFormValues {
  employee_id: string;
  leave_type_id: string;
  no_of_days: string;
  days_used: string;
  start_date: string;
  end_date: string;
  credited_date: string;
  status: number;
}

export const EMPTY_LEAVE_ENTITLEMENT_FORM_VALUES: LeaveEntitlementFormValues = {
  employee_id: "",
  leave_type_id: "",
  no_of_days: "",
  days_used: "0",
  start_date: "",
  end_date: "",
  credited_date: "",
  status: LEAVE_ENTITLEMENT_STATUS.ACTIVE,
};

export interface ListLeaveEntitlementsParams {
  page?: number;
  limit?: number;
  employee_id?: number;
  leave_type_id?: number;
  status?: number;
}
// ─── Leave Entitlement Module Constants ─────────────────────────────────────
// erp_hrm_leave_entitlements: id, employee_id, no_of_days, days_used,
// start_date, end_date, credited_date, leave_type_id, status, created_by,
// updated_by, deleted_by, created_at, updated_at, deleted_at.
//
// This is the leave *balance ledger* — how many days an employee has been
// granted for a leave type, and how many they've used. It is intentionally
// NOT auto-adjusted when a Leave Request is approved (see
// leaveRequest.service.ts's approveLeaveRequest for the full reasoning):
// there's no DB constraint tying the two together, and an employee can have
// more than one entitlement row per leave type (e.g. across policy years),
// so guessing which row to decrement risks silently corrupting HR's balance
// data. `days_used` is exposed as a normal editable field so HR keeps it
// accurate the same way they'd adjust `no_of_days` when granting new leave.

export const LEAVE_ENTITLEMENT_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;
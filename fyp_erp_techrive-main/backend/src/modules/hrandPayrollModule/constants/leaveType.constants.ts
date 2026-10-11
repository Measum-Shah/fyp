// ─── Leave Type Module Constants ────────────────────────────────────────────
// erp_hrm_leave_types: id, name, permitted_days, year, parent_id, type,
// start_date, end_date, status, created_by, updated_by, deleted_by,
// created_at, updated_at, deleted_at (confirmed against the raw SQL — no
// unique constraint on `name`, same pattern as departments/companies).

export const LEAVE_TYPE_NAME_MAX_LENGTH = 255; // matches "name" varchar(255)
export const LEAVE_TYPE_TYPE_MAX_LENGTH = 20; // matches "type" varchar(20)

export const LEAVE_TYPE_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

// pay_type (2026-08-22, fixes audit finding #3): drives whether payroll's
// automated leave deduction (payrollRun.service.ts's computeLeaveDeduction)
// counts a day of this leave type as a deductible day. PAID is the default
// so every pre-existing leave type keeps behaving exactly as before —
// HR must explicitly opt a type into UNPAID.
export const LEAVE_TYPE_PAY_TYPE = {
  PAID: 0,
  UNPAID: 1,
} as const;

// `parent_id` (INTEGER DEFAULT 0) lets a leave type reference another leave
// type as its "parent" (e.g. a sub-type of a broader category). There's no
// self-referencing FK constraint in the schema and no dedicated picker UI
// built for it yet — exposed as a plain optional numeric id, same honest
// treatment as staff.reports_to/replaced_by in employee.constants.ts.
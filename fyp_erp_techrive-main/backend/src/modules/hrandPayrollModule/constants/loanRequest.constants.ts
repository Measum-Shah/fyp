// ─── Loan Request Module Constants ──────────────────────────────────────────
// request_loan_employee: id, staff_id, branch_id, attachment_file,
// effective_from, type, amount, installments, monthly_installment, reason,
// remarks, status, approved_by_ceo, created_by, updated_by, created_at,
// updated_at (confirmed against the raw SQL).
//
// This is the ONLY complete, usable employee-loan table in the dump:
//   - erp_loans / erp_loan_plans are stub tables — no primary key, no
//     employee reference, just 2-3 free-text columns. Not real entities.
//   - the legacy `loans` table references a `loan_request_id` with unclear,
//     undocumented ties back to this table, plus overlapping/duplicate
//     columns (its own `type`, `employee_id`). Building on top of it would
//     mean guessing at a relationship the schema doesn't actually define.
// request_loan_employee is self-contained and matches the shape of a real
// "apply → review → decide" loan/advance request, same spirit as
// erp_hrm_leave_requests.
//
// request_loan_employee originally shipped with NO deleted_at/deleted_by
// columns — no soft-delete support at all, unlike every other HR entity
// built so far. deleted_at (TIMESTAMP DEFAULT NULL) and deleted_by
// (INTEGER DEFAULT NULL) were added via a migration (see the ALTER TABLE
// statement shipped alongside this change) to bring it in line with the
// rest of the module. Delete is now a normal soft-delete — see
// loanRequest.service.ts's deleteLoanRequest, which behaves the same as
// leaveRequest.service.ts's deleteLeaveRequest.

export const LOAN_REQUEST_TYPE_MAX_LENGTH = 100; // matches "type" varchar(100)
export const LOAN_REQUEST_ATTACHMENT_MAX_LENGTH = 255; // matches "attachment_file" varchar(255)
export const LOAN_REQUEST_REASON_MAX_LENGTH = 2000;
export const LOAN_REQUEST_REMARKS_MAX_LENGTH = 2000;

// installments/amount are plain INTEGER columns with no documented ceiling —
// these caps just catch obvious data-entry mistakes.
export const LOAN_REQUEST_MAX_AMOUNT = 100_000_000;
export const LOAN_REQUEST_MAX_INSTALLMENTS = 120; // 10 years of monthly installments

// `status` (SMALLINT, DB default 0) has no companion lookup table the way
// erp_hrm_leave_requests.leave_status does — no admin-managed set of
// statuses exists for loans in this schema. DEFAULT 0 strongly signals a
// fixed Pending/Approved/Rejected workflow (the standard Laravel convention
// this codebase's other DEFAULT 0 SMALLINT columns follow), so this is
// modeled as a fixed enum rather than an open admin-managed lookup.
// COMPLETED (2026-08-22) is a new terminal status added to fix a P0 payroll
// bug: once a loan's balance reached 0, computeLoanDeduction() (in
// payrollRun.service.ts) had no way to know the loan was finished — nothing
// ever moved it out of APPROVED — so it fell back to the original principal
// and started deducting the whole loan again, forever. COMPLETED is set
// automatically by the payroll run itself when a loan's remaining balance
// hits 0 (see payrollRun.service.ts's markLoansCompletedIfPaidOff); it is
// never accepted as user input on create/update/change-status (see
// loanRequest.validator.ts, unchanged) — this is a system-set state, not
// something HR/CEO approve into directly. No schema/migration change is
// needed: `status` is a plain, unconstrained SMALLINT column, so this new
// enum value is purely additive at the application layer.
export const LOAN_REQUEST_STATUS = {
  PENDING: 0,
  APPROVED: 1,
  REJECTED: 2,
  COMPLETED: 3,
} as const;

export const LOAN_REQUEST_STATUS_LABELS: Record<number, string> = {
  [LOAN_REQUEST_STATUS.PENDING]: "Pending",
  [LOAN_REQUEST_STATUS.APPROVED]: "Approved",
  [LOAN_REQUEST_STATUS.REJECTED]: "Rejected",
  [LOAN_REQUEST_STATUS.COMPLETED]: "Completed",
};

// approved_by_ceo (SMALLINT, DB default 0) still exists as a column on
// request_loan_employee, but is no longer used anywhere in the
// application — it was a second-tier approval gate on top of `status`
// that had no reachable UI control, silently blocking payroll deduction
// for every loan regardless of status. Removed at the user's request; see
// payrollRun.service.ts's computeLoanDeduction, which now checks `status`
// only.

// A handful of common loan/advance types to suggest via an HTML5 datalist —
// `type` is plain free text in the schema (no lookup table), same treatment
// as staff.designation on the Employee form.
export const LOAN_REQUEST_TYPE_SUGGESTIONS = [
  "Salary Advance",
  "Personal Loan",
  "Emergency Loan",
  "Medical Loan",
  "Education Loan",
];

// attachment_file stores the public upload path (e.g.
// "/uploads/loan-request-attachments/171999_abc_receipt.pdf"), same storage
// convention as Resignation's experience_letter / Staff Qualifications'
// attachment column — see middlewares/upload.middleware.ts's
// createUploader/toPublicUploadPath.
export const LOAN_REQUEST_ATTACHMENT_UPLOAD_SUBDIR = "loan-request-attachments";
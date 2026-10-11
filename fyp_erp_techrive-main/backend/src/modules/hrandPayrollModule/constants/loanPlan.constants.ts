// ─── Loan Plan Constants ──────────────────────────────────────────────────────
// Table: erp_loan_plans — a small master list of repayment plans (e.g.
// "6 installments, extra 2% fee"). Same schema quirk as erp_loans: loan_plan_id
// is `Int @id` with no autoincrement, computed here as MAX(loan_plan_id) + 1
// (see loanPlan.service.ts) — same small race-condition caveat applies.
//
// loan_installment/tenure/extra_pay are all free-text VARCHAR columns in the
// actual schema (not numeric), so they're kept as strings end-to-end rather
// than forced into numbers that might not parse cleanly (e.g. tenure could be
// "6 Months" rather than a bare "6").
//
// Like Loan Types, nothing in request_loan_employee has an FK to this table —
// selecting a plan on the Loan Request form is a convenience that can prefill
// the Installments field, not an enforced relationship.

export const LOAN_PLAN_FIELD_MAX_LENGTH = 255;

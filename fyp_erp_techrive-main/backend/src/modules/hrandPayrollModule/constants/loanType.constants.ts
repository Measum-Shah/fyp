// ─── Loan Type Constants ──────────────────────────────────────────────────────
// Table: erp_loans — a small master/reference list of loan type names (e.g.
// "Advance Salary", "Personal Loan"), used to populate the "Loan Type"
// dropdown on the Employee Loans form instead of free text.
//
// IMPORTANT SCHEMA QUIRK: loan_id is `Int @id` with NO @default(autoincrement()).
// Postgres will not generate this id for you — it must be supplied on every
// insert. This service computes it as MAX(loan_id) + 1 (see loanType.service.ts).
// That has a small race-condition window under concurrent creates, which is an
// acceptable tradeoff for a low-traffic admin-only master table, but is not
// safe for anything high-concurrency.
//
// request_loan_employee.type (the column this feeds) is a plain free-text
// VARCHAR — there is no FK from Loans to erp_loans anywhere in this schema.
// The dropdown is therefore a UX convenience (pick from a known list) rather
// than an enforced constraint, same relationship as designation/staff_type
// have with the Employee form.

export const LOAN_TYPE_NAME_MAX_LENGTH = 255;
export const LOAN_TYPE_DESCRIPTION_MAX_LENGTH = 255;

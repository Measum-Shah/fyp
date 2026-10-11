// ─── Termination Constants ────────────────────────────────────────────────────
// Table: terminations. Much simpler than Resigns — no branch/role, no
// two-stage approval chain, just reason + warnings + an acknowledgement flag.
//
// REAL LOGIC: unlike a resignation (employee-initiated, needs approval before
// anything changes), a termination is HR/management deciding unilaterally —
// so staff.status is flipped to Inactive immediately on creation, not behind
// an approval step. See termination.service.ts.
//
// acknowledge is a free String defaulting to "no" in the DB (not a real
// boolean) — kept as "yes"/"no" string values to match exactly.

export const ACKNOWLEDGE_STATUS = {
  NO: "no",
  YES: "yes",
} as const;

export const TERMINATION_REASON_MAX_LENGTH = 191;

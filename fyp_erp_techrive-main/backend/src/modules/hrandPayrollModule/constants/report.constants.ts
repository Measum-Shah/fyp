// ─── Reports Module Constants ───────────────────────────────────────────────

// Reports return the full filtered result set (not paginated) so the
// frontend can render + CSV-export exactly what's on screen. This cap exists
// only as a safety net against an unfiltered query on a very large dataset —
// it is far above any realistic single-institution headcount.
export const REPORT_MAX_ROWS = 5000;

// CNIC Expiry / Contract & Probation Expiry reports default to "what's
// coming up" rather than an arbitrary historical range — when the caller
// omits from/to we show everything expiring between today and today +
// EXPIRY_DEFAULT_WINDOW_DAYS. 90 days mirrors the lead time HR typically
// needs to renew a CNIC or decide on a contract/probation outcome.
export const EXPIRY_DEFAULT_WINDOW_DAYS = 90;
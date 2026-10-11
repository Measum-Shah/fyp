export const PAY_STATUS_OPTIONS = ["Unpaid", "Processing", "Paid", "Hold"] as const;
export type PayStatus = (typeof PAY_STATUS_OPTIONS)[number];

export const APPROVED_STATUS_OPTIONS = ["Pending", "Approved", "Rejected"] as const;
export type ApprovedStatus = (typeof APPROVED_STATUS_OPTIONS)[number];

export const APPROVED_BY_MAX_LENGTH = 255;
export const REMARKS_MAX_LENGTH = 1000;
export const TOTAL_ABSENTS_MIN = 0;
export const TOTAL_ABSENTS_MAX = 31;

// Reuses the .hr-badge-* classes already defined for Attendance Status
// badges (see employee-module.css, Phase 3) — no new CSS needed.
export const PAY_STATUS_BADGE_CLASS: Record<PayStatus, string> = {
  Unpaid: "hr-badge-danger",
  Processing: "hr-badge-warning",
  Paid: "hr-badge-success",
  Hold: "hr-badge-neutral",
};

export const APPROVED_STATUS_BADGE_CLASS: Record<ApprovedStatus, string> = {
  Pending: "hr-badge-warning",
  Approved: "hr-badge-success",
  Rejected: "hr-badge-danger",
};

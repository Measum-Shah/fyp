/** Stored in existing payment_settings.identity (varchar 15) — no new tables */
export const LATE_FEE_SETTINGS_IDENTITY = "LATE_FEE";

export const LATE_FEE_CALC_TYPES = {
  FIXED: "FIXED",
  PERCENT: "PERCENT",
  PER_DAY: "PER_DAY",
} as const;

export type LateFeeCalculationType =
  (typeof LATE_FEE_CALC_TYPES)[keyof typeof LATE_FEE_CALC_TYPES];

export const LATE_FEE_RULE_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
} as const;

export type LateFeeRuleStatus =
  (typeof LATE_FEE_RULE_STATUS)[keyof typeof LATE_FEE_RULE_STATUS];

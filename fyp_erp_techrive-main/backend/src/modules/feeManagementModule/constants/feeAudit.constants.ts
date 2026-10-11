/** Fee Management audit constants — written to existing erp_activity_logs */
export const FEE_AUDIT_MODULE = "Fee Management";

export const FEE_AUDIT_ACTIONS = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  STATUS_CHANGE: "STATUS_CHANGE",
  PAYMENT: "PAYMENT",
  DISCOUNT: "DISCOUNT",
  LATE_FEE: "LATE_FEE",
  NOTIFICATION: "NOTIFICATION",
  CONFIG: "CONFIG",
  VIEW: "VIEW",
} as const;

export type FeeAuditAction =
  (typeof FEE_AUDIT_ACTIONS)[keyof typeof FEE_AUDIT_ACTIONS];

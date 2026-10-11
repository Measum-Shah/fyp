/**
 * Student Enrollment (admission) — status conventions for this feature only.
 *
 * Existing seed data uses admission_status = "Admitted".
 * This feature does not rewrite those values.
 *
 * Lifecycle for NEW enrollments created by this feature:
 *   Walk-in  → fee verification → Registered
 */
export const ADMISSION_STATUS = {
  WALK_IN: "Walk-in",
  REGISTERED: "Registered",
} as const;

export type AdmissionStatusValue =
  (typeof ADMISSION_STATUS)[keyof typeof ADMISSION_STATUS];

/** Fee payment outcomes derived from existing fee tables (read-only). */
export const FEE_PAYMENT_STATUS = {
  PAID: "Paid",
  PARTIAL: "Partial",
  UNPAID: "Unpaid",
  OVERDUE: "Overdue",
  NO_RECORD: "No Record",
} as const;

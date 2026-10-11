// ─── Staff Performance Constants ─────────────────────────────────────────────
// Table: staff_performances. The 5 rating columns (lecture_deliver,
// confidence, punctuality, moral_values, student_feedback) are plain VARCHAR
// in the DB, not an enum — constrained here to a fixed rating scale for data
// consistency (so reports aren't stuck reconciling "Good"/"good"/"GOOD"),
// same reasoning as EOBI's status field.

export const PERFORMANCE_RATING = {
  EXCELLENT: "Excellent",
  GOOD: "Good",
  AVERAGE: "Average",
  POOR: "Poor",
} as const;

export const PERFORMANCE_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
} as const;

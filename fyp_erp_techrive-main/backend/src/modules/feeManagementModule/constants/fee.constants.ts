/** Standard fee cycle labels stored in fee_terms.term_title */
export const FEE_CYCLE_PRESETS = [
  "Monthly",
  "Quarterly",
  "Semester-wise",
  "Annual",
  "Custom",
] as const;

export type FeeCyclePreset = (typeof FEE_CYCLE_PRESETS)[number];

/** Common fee type titles for guidance (users can still create custom titles) */
export const FEE_TYPE_SUGGESTIONS = [
  "Tuition",
  "Library",
  "Lab",
  "Transport",
  "Hostel",
  "Exam",
  "Admission",
  "Registration",
  "Annual",
  "ID Card",
  "Computer",
  "Safety",
  "Security",
  "LMS",
] as const;

export const ACTIVE_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

export const ACTIVE_STATUS_STRING = {
  ACTIVE: "1",
  INACTIVE: "0",
} as const;

/** fee_master_basics.fee_type: how the structure is assigned */
export const ASSIGNMENT_FEE_TYPE = {
  CLASS: 1,
  GROUP: 2,
  STUDENT: 3,
} as const;

export type AssignmentScope = "class" | "group" | "student";

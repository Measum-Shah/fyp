/**
 * Fee Management Module 8 — permission capabilities.
 * Maps existing erp_users.user_type values (admin/staff/parent/teacher…)
 * onto Fee Management capabilities. No new roles tables.
 */

export const FEE_CAPABILITIES = {
  VIEW_ADMIN_DASHBOARD: "VIEW_ADMIN_DASHBOARD",
  VIEW_STUDENT_RECORDS: "VIEW_STUDENT_RECORDS",
  MANAGE_FEE_SETUP: "MANAGE_FEE_SETUP",
  MANAGE_ASSIGNMENTS: "MANAGE_ASSIGNMENTS",
  PROCESS_PAYMENTS: "PROCESS_PAYMENTS",
  MANAGE_DISCOUNTS: "MANAGE_DISCOUNTS",
  MANAGE_LATE_FEES: "MANAGE_LATE_FEES",
  MANAGE_NOTIFICATIONS: "MANAGE_NOTIFICATIONS",
  VIEW_REPORTS: "VIEW_REPORTS",
  VIEW_DEFAULTERS: "VIEW_DEFAULTERS",
  VIEW_AUDIT: "VIEW_AUDIT",
  VIEW_OWN_FEES: "VIEW_OWN_FEES",
  PAY_OWN_FEES: "PAY_OWN_FEES",
} as const;

export type FeeCapability =
  (typeof FEE_CAPABILITIES)[keyof typeof FEE_CAPABILITIES];

export type FeeAccessRole =
  | "admin"
  | "accountant"
  | "teacher"
  | "parent"
  | "student"
  | "denied";

const ALL_ADMIN: FeeCapability[] = [
  FEE_CAPABILITIES.VIEW_ADMIN_DASHBOARD,
  FEE_CAPABILITIES.VIEW_STUDENT_RECORDS,
  FEE_CAPABILITIES.MANAGE_FEE_SETUP,
  FEE_CAPABILITIES.MANAGE_ASSIGNMENTS,
  FEE_CAPABILITIES.PROCESS_PAYMENTS,
  FEE_CAPABILITIES.MANAGE_DISCOUNTS,
  FEE_CAPABILITIES.MANAGE_LATE_FEES,
  FEE_CAPABILITIES.MANAGE_NOTIFICATIONS,
  FEE_CAPABILITIES.VIEW_REPORTS,
  FEE_CAPABILITIES.VIEW_DEFAULTERS,
  FEE_CAPABILITIES.VIEW_AUDIT,
];

const TEACHER_CAPS: FeeCapability[] = [
  FEE_CAPABILITIES.VIEW_ADMIN_DASHBOARD,
  FEE_CAPABILITIES.VIEW_DEFAULTERS,
];

const PARENT_CAPS: FeeCapability[] = [
  FEE_CAPABILITIES.VIEW_OWN_FEES,
  FEE_CAPABILITIES.PAY_OWN_FEES,
];

const STUDENT_CAPS: FeeCapability[] = [
  FEE_CAPABILITIES.VIEW_OWN_FEES,
  FEE_CAPABILITIES.PAY_OWN_FEES,
];

export const FEE_ROLE_CAPABILITIES: Record<FeeAccessRole, FeeCapability[]> = {
  admin: ALL_ADMIN,
  accountant: ALL_ADMIN,
  teacher: TEACHER_CAPS,
  parent: PARENT_CAPS,
  student: STUDENT_CAPS,
  denied: [],
};

export const isTeacherStaffType = (staffType?: string | null) =>
  !!staffType &&
  /teacher|faculty|trainer|lecturer|instructor/i.test(staffType);

export const mapUserTypeToFeeRole = (
  userType?: string | null,
  staffType?: string | null
): FeeAccessRole => {
  const t = (userType || "").toLowerCase().trim();
  if (t === "admin" || t === "administrator") return "admin";
  if (t === "accountant") return "accountant";
  if (t === "parent") return "parent";
  if (t === "student" || t === "learner") return "student";
  if (
    t === "teacher" ||
    t === "faculty" ||
    t === "trainer" ||
    t === "lecturer"
  ) {
    return "teacher";
  }
  if (t === "staff") {
    return isTeacherStaffType(staffType) ? "teacher" : "accountant";
  }
  return "denied";
};

export const roleHasCapability = (
  role: FeeAccessRole,
  capability: FeeCapability
) => FEE_ROLE_CAPABILITIES[role]?.includes(capability) ?? false;

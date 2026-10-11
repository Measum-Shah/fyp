// ─── Employee Module Constants ─────────────────────────────────────────────

// Employee ID (staff.reg_no) — alphanumeric, dashes/underscores/slashes allowed
export const EMPLOYEE_ID_REGEX = /^[A-Za-z0-9\-_/]{2,50}$/;

// reg_no is auto-generated on create (see employee.service.ts's
// generateNextRegNo) as "TR-{year}-{sequential, zero-padded to 3 digits}",
// e.g. "TR-2026-001" — matches the format already used by every seeded
// employee, just rolled forward to the current year. It stays editable on
// update only, for correcting a genuine typo/import mismatch after the
// fact; the create form no longer collects it at all.
export const EMPLOYEE_ID_PREFIX = "TR";

// Pakistani CNIC — accepts "12345-1234567-1" or plain 13 digits
export const CNIC_REGEX = /^\d{5}-?\d{7}-?\d{1}$/;

// Phone/mobile — digits, spaces, +, -, () — 7 to 20 characters
export const PHONE_REGEX = /^[0-9+\-\s()]{7,20}$/;

// Joining date — strict YYYY-MM-DD
export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const EMPLOYEE_STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
} as const;

// staff.payment_type — how this employee's salary is structured. Permanent
// staff (shown to the user as "Fixed Salary") are paid a fixed monthly
// Salary Structure (basic + allowances); Visiting Faculty (shown to the
// user as "Per Hour Salary") are paid per teaching hour
// (staff.salary_per_hour x staff.hours_worked, plus allowances). Drives
// which Salary tab fields employee.service.ts reads when computing the
// legacy `salary` gross-total fallback column. These two stored values are
// intentionally unchanged from before — only their frontend display names
// changed, see PAYMENT_TYPE_LABELS in the frontend's employee.types.ts.
export const PAYMENT_TYPE = {
  PERMANENT: "Permanent",
  VISITING_FACULTY: "Visiting Faculty",
} as const;

// Default bcrypt salt rounds — matches authModule convention
export const PASSWORD_SALT_ROUNDS = 12;

// Fields that must never be returned to API consumers
export const EMPLOYEE_SENSITIVE_FIELDS = ["password"] as const;

// ─── Extended personal/professional profile fields ───────────────────────────
// staff.disability is a real SmallInt (NOT NULL, default 0) — a boolean-shaped
// flag stored as an int, exposed here as Yes/No.
export const DISABILITY_STATUS = {
  NO: 0,
  YES: 1,
} as const;

// Generic max length for the many nullable `String? @db.VarChar(191)` /
// unconstrained TEXT columns on staff added in this pass (mother_name,
// nationality, skill, job_status, etc.) — 191 matches the VarChar(191)
// columns exactly; the handful of TEXT-typed ones (marital_status,
// job_status) have no DB length limit but are capped here for sane form UX.
export const EMPLOYEE_PROFILE_FIELD_MAX_LENGTH = 191;
export const EMPLOYEE_DISABILITY_DESCRIPTION_MAX_LENGTH = 255;
export const EMPLOYEE_FIRST_REGISTRATION_CODE_MAX_LENGTH = 250;
export const EMPLOYEE_PERSONAL_EMAIL_MAX_LENGTH = 1000;

// reports_to / replaced_by are self-referencing staff ids with no FK
// constraint in the schema, and there's no dedicated "pick a manager"
// employee-search UI built yet — same honest treatment as Branch's
// city_id/bank_id: exposed as plain numeric id inputs, not a lookup dropdown.

// ─── File uploads ───────────────────────────────────────────────────────────
// Disk subdirectories (under backend/uploads/) + public URL prefixes used for
// the Employee profile picture (staff.staff_image) and CNIC attachment
// (staff.cnic_attachment) uploads — same createUploader() convention as
// Staff Qualifications / Staff Assets. See middlewares/upload.middleware.ts
// and controllers/employee.controller.ts.
export const EMPLOYEE_PROFILE_IMAGE_UPLOAD_SUBDIR = "employee-profile-images";
export const EMPLOYEE_CNIC_ATTACHMENT_UPLOAD_SUBDIR = "employee-cnic-attachments";
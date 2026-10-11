// ─── Staff Qualifications — Shared Types ─────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/staffQualification.service.ts
// (staffQualificationSelect) and validators/staffQualification.validator.ts
// field-for-field. Embedded inside the Employee Management module (see
// StaffQualificationsPanel.tsx / EmployeeDetailsPage.tsx) rather than a
// standalone page — every record always belongs to one employee.

export const STAFF_QUALIFICATION_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

export interface StaffQualification {
  id: number;
  staff_id: number;
  degree: string;
  institute: string | null;
  board_or_university: string | null;
  passing_year: number | null;
  grade_or_cgpa: string | null;
  attachment: string | null;
  status: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateStaffQualificationPayload {
  staff_id: number;
  degree: string;
  institute?: string;
  board_or_university?: string;
  passing_year?: number;
  grade_or_cgpa?: string;
  attachment?: string;
  status?: number;
}

export type UpdateStaffQualificationPayload = Partial<CreateStaffQualificationPayload>;

export interface ListStaffQualificationsParams {
  page?: number;
  limit?: number;
  search?: string;
  staff_id?: number;
  status?: number;
}

// ─── Form values (all strings — inputs are uncontrolled otherwise) ──────────
export interface StaffQualificationFormValues {
  degree: string;
  institute: string;
  board_or_university: string;
  passing_year: string;
  grade_or_cgpa: string;
  attachment: string; // populated by the upload endpoint, holds the public path
}

export const EMPTY_STAFF_QUALIFICATION_FORM_VALUES: StaffQualificationFormValues = {
  degree: "",
  institute: "",
  board_or_university: "",
  passing_year: "",
  grade_or_cgpa: "",
  attachment: "",
};

export interface UploadAttachmentResponseData {
  attachment: string;
}
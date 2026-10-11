// ─── Staff Qualification Module Constants ────────────────────────────────────
// Table: staff_qualifications (new table, created in this phase — did not
// exist before). Child record of `staff`, multiple qualifications per
// employee. The table itself is entirely optional per employee — nothing
// on `staff` requires a qualification row to exist.

export const STAFF_QUALIFICATION_DEGREE_MAX_LENGTH = 191;
export const STAFF_QUALIFICATION_INSTITUTE_MAX_LENGTH = 191;
export const STAFF_QUALIFICATION_BOARD_MAX_LENGTH = 191;
export const STAFF_QUALIFICATION_GRADE_MAX_LENGTH = 50;
export const STAFF_QUALIFICATION_ATTACHMENT_MAX_LENGTH = 255;

export const STAFF_QUALIFICATION_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

// Disk subdirectory (under backend/uploads/) + public URL prefix used for
// qualification attachment uploads — see middlewares/upload.middleware.ts
// and controllers/staffQualification.controller.ts#uploadStaffQualificationAttachment.
export const STAFF_QUALIFICATION_UPLOAD_SUBDIR = "staff-qualifications";
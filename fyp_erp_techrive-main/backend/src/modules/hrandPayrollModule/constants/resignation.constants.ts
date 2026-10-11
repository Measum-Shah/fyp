// ─── Resignation Constants ────────────────────────────────────────────────────
// Table: resigns. user_id is BigInt in the DB (unusual for this schema, where
// everything else uses Int) but is treated the same way as staff_id elsewhere
// — it's the employee who's resigning, just stored as a wider integer type.
//
// role_id (required Int, no FK anywhere in this schema) looks like it once
// referenced a `roles`/permissions table — kept as a plain required integer,
// same treatment as ledger_id on Salary Sheet.
//
// class/subject are legacy fields from this ERP's school/teaching-staff
// origins — kept as optional free text, not required for non-teaching staff.
//
// REAL LOGIC: overall `status` is computed, not settable directly — it's
// derived from approved_by_ceo + approved_by_hr_head (see
// resignation.service.ts). Once BOTH reach Approved, the employee's
// staff.status is automatically flipped to Inactive — the whole point of
// building this screen instead of leaving it as free-text notes.

export const APPROVAL_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;

export const RESIGN_REASON_MAX_LENGTH = 500;
export const RESIGN_NOTICE_PERIOD_MAX_LENGTH = 191;

// experience_letter stores the public upload path (e.g.
// "/uploads/resignation-experience-letters/171999_abc_letter.pdf"), same
// storage convention as Staff Qualifications' `attachment` column — see
// middlewares/upload.middleware.ts's createUploader/toPublicUploadPath.
export const RESIGNATION_EXPERIENCE_LETTER_UPLOAD_SUBDIR = "resignation-experience-letters";
export const EXPERIENCE_LETTER_MAX_LENGTH = 191; // matches "experience_letter" varchar(191)
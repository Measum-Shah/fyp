// ─── Leave Request Module Constants ─────────────────────────────────────────
// erp_hrm_leave_requests has ~34 columns. The columns implemented here cover
// the core apply → review → decide workflow plus single-day partial-leave
// (half day / hourly) support. Deliberately OUT of scope, left NULL:
//   work_shift_data, partial_days, all_days_*, starting_*, ending_*
// — these back a much more elaborate "different half-day pattern on the
// first vs. last day of a multi-day leave" flow from the source Laravel HRM
// admin panel. There's no way to infer the intended UI/business rules for
// that from the schema alone, and building it speculatively risks getting it
// wrong. Same treatment as branch.constants.ts declining to guess at
// city_name. Can be added later if the business defines the actual rules.

export const LEAVE_REQUEST_COMMENTS_MAX_LENGTH = 2000;
export const LEAVE_REQUEST_REMARKS_MAX_LENGTH = 2000;
export const LEAVE_REQUEST_ATTACHMENT_MAX_LENGTH = 500;

// Upload destination for the Apply for Leave form's Attachment file picker —
// same createUploader/toPublicUploadPath pattern as Staff Qualifications and
// Staff Assets (see upload.middleware.ts).
export const LEAVE_REQUEST_UPLOAD_SUBDIR = "leave-request-attachments";

// total_days is a SMALLINT — plenty of headroom, but capped here to catch
// obvious data-entry mistakes (e.g. a typo'd end_date years in the future).
export const LEAVE_REQUEST_MAX_TOTAL_DAYS = 366;

export const LEAVE_REQUEST_SINGLE_DURATION = {
  FULL_DAY: "Full Day",
  FIRST_HALF: "First Half",
  SECOND_HALF: "Second Half",
  HOURLY: "Hourly",
} as const;

// erp_hrm_leave_requests.status (SMALLINT, DB default 0) is a generic
// record-active flag — distinct from `leave_status`, which is the actual
// Pending/Approved/Rejected workflow reference (FK -> erp_hrm_leave_statuses).
// Defaulted to ACTIVE=1 explicitly at create time, same convention as
// Company/Branch's `status` (never relying on the raw DB default).
export const LEAVE_REQUEST_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;
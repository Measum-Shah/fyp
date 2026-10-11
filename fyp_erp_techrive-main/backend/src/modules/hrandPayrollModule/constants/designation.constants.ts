// ─── Designation Module Constants ───────────────────────────────────────────
// designation table: id, name, description (optional), created_by/updated_by
// (both required, no default — every write here MUST carry an actor id),
// deleted_by/deleted_at (soft delete).
//
// This is the master table behind the Employee form's "Designation" field
// — but staff.designation is stored as a free-text string (same pattern as
// staff.staff_type), not a foreign key to designation.id. Deleting a
// designation here is therefore always safe: it just removes that name
// from the Employee form's suggestion list going forward, it can never
// orphan or corrupt an existing employee record. Note that a SEPARATE
// real foreign key, staff.designation_id, also exists and is what the
// Resignation/Branch Transfer/Attendance Summary "Approver Designation"
// auto-populate feature relies on (see lookup.service.ts#listStaff).
//
// Parent Designation (the former `parent_id` self-reference column) was
// removed from this table entirely — see
// backend/src/prisma/migrations_manual/2026082401_designation_experience_letter_approvals.sql.
// It was confirmed unused by any other module before being dropped.

export const DESIGNATION_NAME_MAX_LENGTH = 255; // matches "name" varchar(255)
export const DESIGNATION_DESCRIPTION_MAX_LENGTH = 1000; // matches "description" varchar(1000)
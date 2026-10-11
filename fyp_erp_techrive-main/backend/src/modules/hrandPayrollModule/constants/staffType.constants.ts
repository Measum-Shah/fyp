// ─── Staff Type Module Constants ────────────────────────────────────────────
// staff_type table: id, name, staff_type_code, description, sequence_id,
// created_at, updated_at, deleted_at (soft delete — confirmed against the
// raw SQL/Prisma schema).
//
// This is the master table behind the Employee form's "Staff Type" field —
// but staff.staff_type is stored as a free-text string (same as
// staff.designation), not a foreign key to staff_type.id. Deleting a staff
// type here is therefore always safe: it just removes that name from the
// Employee form's suggestion list going forward, it can never orphan or
// corrupt an existing employee record the way deleting a Department can
// (which does have a real FK and is blocked while in use).

export const STAFF_TYPE_NAME_MAX_LENGTH = 255; // matches "name" varchar(255)
export const STAFF_TYPE_CODE_MAX_LENGTH = 255; // matches "staff_type_code" varchar(255)
export const STAFF_TYPE_DESCRIPTION_MAX_LENGTH = 191; // matches "description" varchar(191)

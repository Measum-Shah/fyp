// ─── Department Module Constants ────────────────────────────────────────────
// departments table: id, name, description, created_at, updated_at
// (confirmed against the raw SQL — no soft-delete/status columns exist).

export const DEPARTMENT_NAME_MAX_LENGTH = 191; // matches "name" varchar(191)
export const DEPARTMENT_DESCRIPTION_MAX_LENGTH = 191; // matches "description" varchar(191)
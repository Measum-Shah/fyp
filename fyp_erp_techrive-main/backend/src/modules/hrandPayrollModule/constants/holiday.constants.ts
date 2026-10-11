// ─── Holiday — Backend Constants ────────────────────────────────────────────
// Attendance module, Phase 2: erp_holidays — the company holiday calendar,
// used later (Phase 4/5) to exclude holiday dates from absence/attendance
// summary calculations.

export const HOLIDAY_NAME_MAX_LENGTH = 255;

// erp_holidays has no deleted_at column (unlike every other table this
// codebase has soft-deleted so far — branch, company, department, work
// shift). It only has a required, non-nullable `deleted_by Int`, with no
// paired timestamp to make a real soft-delete/filter/restore flow possible.
// Faking a soft delete off `deleted_by` alone (e.g. treating "0" as
// "not deleted") would misrepresent what's actually an audit-trail column,
// so holidays are hard-deleted — see holiday.service.ts.
//
// deleted_by is still required by the DB on every insert (Prisma has no way
// to omit a non-nullable column with no default), so it's stamped with this
// placeholder on create, same pattern as BRANCH_LEGACY_DEFAULTS in
// branch.constants.ts.
export const HOLIDAY_LEGACY_DEFAULTS = {
  deleted_by: 0,
} as const;
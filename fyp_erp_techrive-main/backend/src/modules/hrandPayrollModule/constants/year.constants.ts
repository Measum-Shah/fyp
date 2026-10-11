// ─── Years — Backend Constants ──────────────────────────────────────────────
// Attendance module, Phase 4a: years — a real, empty lookup table that
// attendance_summary.year_id conceptually references. Unlike every other
// table in this codebase, years.id has NO @default(autoincrement()) — the
// id IS the year number itself (a natural key), confirmed against the raw
// SQL export. title is therefore always derived as String(id) server-side
// rather than accepted as separate input, so id/title can never disagree.
//
// years also carries two independent flags: `status` (the usual
// active/inactive enable-disable, same as every other master table) and
// `active_status` (this codebase's interpretation: which single year is the
// organization's "current" payroll year — mutually exclusive across rows,
// set via the dedicated setCurrentYear endpoint rather than the general
// update endpoint, since setting one year current must un-set all others in
// the same transaction).

export const YEAR_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

export const YEAR_ACTIVE_STATUS = {
  CURRENT: 1,
  NOT_CURRENT: 0,
} as const;

export const YEAR_MIN = 1900;
export const YEAR_MAX = 2200;

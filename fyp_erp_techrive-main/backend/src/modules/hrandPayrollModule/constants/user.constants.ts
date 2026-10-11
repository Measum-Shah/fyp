// ─── User Account Management — Module Constants ─────────────────────────────
// erp_users table — see backend/src/prisma/schema.prisma's ErpUsers model.
//
// This is the "login account" table — DISTINCT from `staff`/`employees`
// (the HR record), though a login can optionally be linked to one via
// employee_id. Access to the HR & Payroll module is decided by user_type
// (see middlewares/hrAccess.middleware.ts) — admin/hr get in, everything
// else doesn't.

export const USER_NAME_MAX_LENGTH = 191; // matches "name" varchar(191)
export const USER_EMAIL_MAX_LENGTH = 191; // matches "email" varchar(191)
export const USER_PASSWORD_MIN_LENGTH = 6;

// `user_type` is a free-text varchar column (no CHECK constraint at the DB
// level — confirmed against the raw SQL), but every existing write path
// (register(), seedAdmin()) only ever uses these two values, so the create/
// update forms are constrained to them for consistency. Not exhaustive by
// the DB's own rules — just this module's convention.
export const USER_TYPE_OPTIONS = ["staff", "admin"] as const;
export type UserType = (typeof USER_TYPE_OPTIONS)[number];

// erp_users.active is a SmallInt (0/1), separate from `status` (also
// nullable Int, unused elsewhere in the app today). `active` is what this
// module's "Deactivate / Reactivate" action toggles, and — as of this
// delivery — what auth.controller.ts's login() now checks before issuing a
// session (previously unchecked; see login() for the fix).
export const USER_ACTIVE = { ACTIVE: 1, INACTIVE: 0 } as const;

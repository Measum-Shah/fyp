// ─── Staff Asset Module Constants ────────────────────────────────────────────
// Table: staff_assets (new table, created in this phase — did not exist
// before). Tracks company property assigned to an employee (laptop, phone,
// vehicle, access card, etc). `asset_id` is a soft reference to the
// pre-existing inventory `assets` table (Procurement/Inventory module,
// out of HR & Payroll scope) — optional, no FK constraint, matching this
// schema's convention. An assignment doesn't require a matching inventory
// row to exist; asset_name/asset_type/serial_number alone are sufficient.

export const STAFF_ASSET_NAME_MAX_LENGTH = 191;
export const STAFF_ASSET_TYPE_MAX_LENGTH = 100;
export const STAFF_ASSET_SERIAL_MAX_LENGTH = 191;
export const STAFF_ASSET_CODE_MAX_LENGTH = 100;
export const STAFF_ASSET_CONDITION_MAX_LENGTH = 50;

// `attachment` (proof-of-issue photo/receipt/handover slip) — added via the
// migration in prisma/migrations/ alongside this feature; see schema.prisma.
export const STAFF_ASSET_ATTACHMENT_MAX_LENGTH = 255;

// Disk subdirectory (under backend/uploads/) + public URL prefix used for
// asset attachment uploads — see middlewares/upload.middleware.ts and
// controllers/staffAsset.controller.ts#uploadStaffAssetAttachment.
export const STAFF_ASSET_UPLOAD_SUBDIR = "staff-assets";

export const STAFF_ASSET_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

// Suggested asset types for the UI — asset_type is plain varchar(100) with
// no CHECK constraint, so these are suggestions, not an enforced enum.
export const STAFF_ASSET_TYPE_SUGGESTIONS = [
  "Laptop",
  "Desktop",
  "Phone",
  "Vehicle",
  "SIM Card",
  "Access Card",
  "Other",
] as const;

// Suggested condition values — same caveat, plain varchar(50), not enforced.
export const STAFF_ASSET_CONDITION_SUGGESTIONS = ["New", "Good", "Fair", "Damaged"] as const;
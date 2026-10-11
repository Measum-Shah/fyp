import { z } from "zod";
import { DATE_REGEX } from "../constants/employee.constants";
import {
  STAFF_ASSET_ATTACHMENT_MAX_LENGTH,
  STAFF_ASSET_CODE_MAX_LENGTH,
  STAFF_ASSET_CONDITION_MAX_LENGTH,
  STAFF_ASSET_NAME_MAX_LENGTH,
  STAFF_ASSET_SERIAL_MAX_LENGTH,
  STAFF_ASSET_STATUS,
  STAFF_ASSET_TYPE_MAX_LENGTH,
} from "../constants/staffAsset.constants";

const optionalDate = z
  .string()
  .trim()
  .regex(DATE_REGEX, "Date must be in YYYY-MM-DD format")
  .refine((val) => !Number.isNaN(new Date(val).getTime()), {
    message: "Date must be a valid calendar date",
  })
  .optional();

// ─── Shared field shape ──────────────────────────────────────────────────────
const staffAssetBaseSchema = z.object({
  staff_id: z.coerce
    .number({ error: "Employee is required" })
    .int("Employee id must be a valid integer")
    .positive("Employee id must be a valid integer"),
  // Soft reference to the inventory assets table — no FK constraint, so
  // just validated as a positive integer if provided at all.
  asset_id: z.coerce.number().int().positive().optional(),
  asset_name: z
    .string({ error: "Asset name is required" })
    .trim()
    .min(1, "Asset name is required")
    .max(STAFF_ASSET_NAME_MAX_LENGTH),
  asset_type: z.string().trim().max(STAFF_ASSET_TYPE_MAX_LENGTH).optional(),
  serial_number: z.string().trim().max(STAFF_ASSET_SERIAL_MAX_LENGTH).optional(),
  asset_code: z.string().trim().max(STAFF_ASSET_CODE_MAX_LENGTH).optional(),
  issue_date: optionalDate,
  return_date: optionalDate,
  condition: z.string().trim().max(STAFF_ASSET_CONDITION_MAX_LENGTH).optional(),
  remarks: z.string().trim().max(2000).optional(),
  attachment: z.string().trim().max(STAFF_ASSET_ATTACHMENT_MAX_LENGTH).optional(),
  status: z
    .union([z.literal(STAFF_ASSET_STATUS.ACTIVE), z.literal(STAFF_ASSET_STATUS.INACTIVE)])
    .optional(),
});

const dateOrderRefinement = (data: { issue_date?: string; return_date?: string }) =>
  !data.issue_date || !data.return_date || new Date(data.return_date) >= new Date(data.issue_date);

// ─── Create Staff Asset ─────────────────────────────────────────────────────
export const createStaffAssetSchema = staffAssetBaseSchema.refine(dateOrderRefinement, {
  message: "Return date cannot be before the issue date",
  path: ["return_date"],
});

export type CreateStaffAssetInput = z.infer<typeof createStaffAssetSchema>;

// ─── Update Staff Asset ──────────────────────────────────────────────────────
export const updateStaffAssetSchema = staffAssetBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the asset",
  })
  .refine(dateOrderRefinement, {
    message: "Return date cannot be before the issue date",
    path: ["return_date"],
  });

export type UpdateStaffAssetInput = z.infer<typeof updateStaffAssetSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const staffAssetIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Asset id must be a number" })
    .int("Asset id must be a valid integer")
    .positive("Asset id must be a valid integer"),
});

// ─── GET /staff-assets query params ─────────────────────────────────────────
export const listStaffAssetsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  staff_id: z.coerce.number().int().positive().optional(),
  status: z.coerce.number().int().optional(),
});
// ─── Staff Assets — Shared Types ─────────────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/staffAsset.service.ts
// (staffAssetSelect) and validators/staffAsset.validator.ts field-for-field.
// Embedded inside the Employee Management module (see StaffAssetsPanel.tsx /
// EmployeeDetailsPage.tsx) rather than a standalone page — every record
// always belongs to one employee.
//
// `asset_id` (a soft reference to the Procurement/Inventory module's
// `assets` table, out of HR & Payroll scope) is intentionally not exposed
// in the UI here — there's no inventory lookup available from this module,
// and it's optional/unenforced on the backend.

export const STAFF_ASSET_STATUS = {
  ACTIVE: 1,
  INACTIVE: 0,
} as const;

export const STAFF_ASSET_TYPE_SUGGESTIONS = [
  "Laptop",
  "Desktop",
  "Phone",
  "Vehicle",
  "SIM Card",
  "Access Card",
  "Other",
] as const;

export const STAFF_ASSET_CONDITION_SUGGESTIONS = ["New", "Good", "Fair", "Damaged"] as const;

export interface StaffAsset {
  id: number;
  staff_id: number;
  asset_id: number | null;
  asset_name: string;
  asset_type: string | null;
  serial_number: string | null;
  asset_code: string | null;
  issue_date: string | null;
  return_date: string | null;
  condition: string | null;
  remarks: string | null;
  attachment: string | null;
  status: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface CreateStaffAssetPayload {
  staff_id: number;
  asset_name: string;
  asset_type?: string;
  serial_number?: string;
  asset_code?: string;
  issue_date?: string;
  return_date?: string;
  condition?: string;
  remarks?: string;
  attachment?: string;
  status?: number;
}

export type UpdateStaffAssetPayload = Partial<CreateStaffAssetPayload>;

export interface ListStaffAssetsParams {
  page?: number;
  limit?: number;
  search?: string;
  staff_id?: number;
  status?: number;
}

// ─── Form values (all strings — inputs are uncontrolled otherwise) ──────────
export interface StaffAssetFormValues {
  asset_name: string;
  asset_type: string;
  serial_number: string;
  asset_code: string;
  issue_date: string;
  return_date: string;
  condition: string;
  remarks: string;
  attachment: string; // populated by the upload endpoint, holds the public path
}

export const EMPTY_STAFF_ASSET_FORM_VALUES: StaffAssetFormValues = {
  asset_name: "",
  asset_type: "",
  serial_number: "",
  asset_code: "",
  issue_date: "",
  return_date: "",
  condition: "",
  remarks: "",
  attachment: "",
};

export interface UploadAttachmentResponseData {
  attachment: string;
}
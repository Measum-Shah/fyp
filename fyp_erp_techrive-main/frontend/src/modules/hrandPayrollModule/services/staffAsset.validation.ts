import { DATE_REGEX } from "./employee.constants";
import type {
  CreateStaffAssetPayload,
  StaffAsset,
  StaffAssetFormValues,
  UpdateStaffAssetPayload,
} from "./staffAsset.types";

const isBlank = (value: string) => value.trim().length === 0;

export const validateStaffAssetForm = (values: StaffAssetFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.asset_name)) {
    errors.asset_name = "Asset name is required";
  }

  if (!isBlank(values.issue_date) && !DATE_REGEX.test(values.issue_date.trim())) {
    errors.issue_date = "Must be in YYYY-MM-DD format";
  }

  if (!isBlank(values.return_date)) {
    if (!DATE_REGEX.test(values.return_date.trim())) {
      errors.return_date = "Must be in YYYY-MM-DD format";
    } else if (
      !isBlank(values.issue_date) &&
      DATE_REGEX.test(values.issue_date.trim()) &&
      new Date(values.return_date) < new Date(values.issue_date)
    ) {
      errors.return_date = "Return date cannot be before the issue date";
    }
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

export const toCreatePayload = (
  staffId: number,
  values: StaffAssetFormValues
): CreateStaffAssetPayload => ({
  staff_id: staffId,
  asset_name: values.asset_name.trim(),
  asset_type: values.asset_type.trim() || undefined,
  serial_number: values.serial_number.trim() || undefined,
  asset_code: values.asset_code.trim() || undefined,
  issue_date: values.issue_date.trim() || undefined,
  return_date: values.return_date.trim() || undefined,
  condition: values.condition.trim() || undefined,
  remarks: values.remarks.trim() || undefined,
  attachment: values.attachment.trim() || undefined,
});

export const toUpdatePayload = (
  staffId: number,
  values: StaffAssetFormValues
): UpdateStaffAssetPayload => toCreatePayload(staffId, values);

export const staffAssetToFormValues = (record: StaffAsset): StaffAssetFormValues => ({
  asset_name: record.asset_name,
  asset_type: record.asset_type ?? "",
  serial_number: record.serial_number ?? "",
  asset_code: record.asset_code ?? "",
  issue_date: record.issue_date ? record.issue_date.slice(0, 10) : "",
  return_date: record.return_date ? record.return_date.slice(0, 10) : "",
  condition: record.condition ?? "",
  remarks: record.remarks ?? "",
  attachment: record.attachment ?? "",
});
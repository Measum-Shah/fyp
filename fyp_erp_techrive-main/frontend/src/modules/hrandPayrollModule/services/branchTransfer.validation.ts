import { DATE_REGEX } from "./employee.constants";
import type {
  BranchTransfer,
  BranchTransferFormValues,
  CreateBranchTransferPayload,
  UpdateBranchTransferPayload,
} from "./branchTransfer.types";

const isBlank = (value: string) => value.trim().length === 0;

export const validateBranchTransferForm = (values: BranchTransferFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};
  if (isBlank(values.staff_id)) errors.staff_id = "Employee is required";
  if (isBlank(values.to_branch)) errors.to_branch = "Destination campus is required";
  if (isBlank(values.reason)) errors.reason = "Reason is required";
  if (isBlank(values.date)) {
    errors.date = "Date is required";
  } else if (!DATE_REGEX.test(values.date.trim())) {
    errors.date = "Must be in YYYY-MM-DD format";
  }
  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean => Object.keys(errors).length === 0;

export const toCreatePayload = (values: BranchTransferFormValues): CreateBranchTransferPayload => ({
  staff_id: Number(values.staff_id),
  to_branch: Number(values.to_branch),
  date: values.date.trim(),
  reason: values.reason.trim(),
});

export const toUpdatePayload = (values: BranchTransferFormValues): UpdateBranchTransferPayload => toCreatePayload(values);

export const branchTransferToFormValues = (record: BranchTransfer): BranchTransferFormValues => ({
  staff_id: String(record.staff_id),
  to_branch: String(record.to_branch),
  date: record.date ? record.date.slice(0, 10) : "",
  reason: record.reason,
});
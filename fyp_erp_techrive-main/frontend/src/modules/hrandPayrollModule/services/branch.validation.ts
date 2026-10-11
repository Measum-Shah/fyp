import { PHONE_REGEX } from "./employee.constants";
import {
  BRANCH_ADDRESS_MAX_LENGTH,
  BRANCH_CAMBRIDGE_ACC_MAX_LENGTH,
  BRANCH_CODE_MAX_LENGTH,
  BRANCH_EXAM_CENTER_NO_MAX_LENGTH,
  BRANCH_IP_MAX_LENGTH,
  BRANCH_LOGO_MAX_LENGTH,
  BRANCH_NAME_MAX_LENGTH,
  BRANCH_ONE_BILL_PREFIX_MAX_LENGTH,
  BRANCH_OPTIONAL_ACC_MAX_LENGTH,
  BRANCH_PORT_MAX_LENGTH,
  BRANCH_SHORT_NAME_MAX_LENGTH,
  BRANCH_WEBSITE_MAX_LENGTH,
} from "./branch.constants";
import type {
  Branch,
  BranchFormValues,
  CreateBranchPayload,
  UpdateBranchPayload,
} from "./branch.types";

// ─── Branch Form — Validation & Conversion ───────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/validators/branch.validator.ts

const isBlank = (value: string) => value.trim().length === 0;
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
const isValidPositiveInt = (value: string) => /^\d+$/.test(value.trim());

const validateOptionalId = (
  errors: Record<string, string>,
  field: keyof BranchFormValues,
  value: string,
  label: string
) => {
  if (!isBlank(value) && !isValidPositiveInt(value)) {
    errors[field] = `${label} must be a valid whole number`;
  }
};

export const validateBranchForm = (values: BranchFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.name)) {
    errors.name = "Campus name is required";
  } else if (values.name.trim().length > BRANCH_NAME_MAX_LENGTH) {
    errors.name = `Campus name must be at most ${BRANCH_NAME_MAX_LENGTH} characters`;
  }

  if (isBlank(values.company_id)) {
    errors.company_id = "School / University is required";
  }

  if (isBlank(values.phone)) {
    errors.phone = "Phone is required";
  } else if (!PHONE_REGEX.test(values.phone.trim())) {
    errors.phone = "Phone number format is invalid";
  }

  if (isBlank(values.cell)) {
    errors.cell = "Mobile/Cell number is required";
  } else if (!PHONE_REGEX.test(values.cell.trim())) {
    errors.cell = "Mobile/Cell number format is invalid";
  }

  if (isBlank(values.email)) {
    errors.email = "Email is required";
  } else if (!isValidEmail(values.email)) {
    errors.email = "A valid email address is required";
  }

  if (values.address.trim().length > BRANCH_ADDRESS_MAX_LENGTH) {
    errors.address = `Address must be at most ${BRANCH_ADDRESS_MAX_LENGTH} characters`;
  }

  if (values.website.trim().length > BRANCH_WEBSITE_MAX_LENGTH) {
    errors.website = `Website must be at most ${BRANCH_WEBSITE_MAX_LENGTH} characters`;
  }

  if (values.branch_code.trim().length > BRANCH_CODE_MAX_LENGTH) {
    errors.branch_code = `Campus code must be at most ${BRANCH_CODE_MAX_LENGTH} characters`;
  }

  if (values.short_name.trim().length > BRANCH_SHORT_NAME_MAX_LENGTH) {
    errors.short_name = `Short name must be at most ${BRANCH_SHORT_NAME_MAX_LENGTH} characters`;
  }

  if (values.logo.trim().length > BRANCH_LOGO_MAX_LENGTH) {
    errors.logo = `Logo must be at most ${BRANCH_LOGO_MAX_LENGTH} characters`;
  }

  if (values.ip.trim().length > BRANCH_IP_MAX_LENGTH) {
    errors.ip = `IP must be at most ${BRANCH_IP_MAX_LENGTH} characters`;
  }

  if (values.port.trim().length > BRANCH_PORT_MAX_LENGTH) {
    errors.port = `Port must be at most ${BRANCH_PORT_MAX_LENGTH} characters`;
  }

  if (values.cambridge_acc.trim().length > BRANCH_CAMBRIDGE_ACC_MAX_LENGTH) {
    errors.cambridge_acc = `Cambridge account must be at most ${BRANCH_CAMBRIDGE_ACC_MAX_LENGTH} characters`;
  }

  if (values.optional_acc.trim().length > BRANCH_OPTIONAL_ACC_MAX_LENGTH) {
    errors.optional_acc = `Optional account must be at most ${BRANCH_OPTIONAL_ACC_MAX_LENGTH} characters`;
  }

  if (values.one_bill_prefix.trim().length > BRANCH_ONE_BILL_PREFIX_MAX_LENGTH) {
    errors.one_bill_prefix = `Bill prefix must be at most ${BRANCH_ONE_BILL_PREFIX_MAX_LENGTH} characters`;
  }

  if (values.exam_center_no.trim().length > BRANCH_EXAM_CENTER_NO_MAX_LENGTH) {
    errors.exam_center_no = `Exam center no. must be at most ${BRANCH_EXAM_CENTER_NO_MAX_LENGTH} characters`;
  }

  validateOptionalId(errors, "fax", values.fax, "Fax");
  validateOptionalId(errors, "city_id", values.city_id, "City ID");
  validateOptionalId(errors, "country_id", values.country_id, "Country ID");
  validateOptionalId(errors, "bank_id", values.bank_id, "Bank ID");
  validateOptionalId(errors, "other_bank", values.other_bank, "Other bank ID");
  validateOptionalId(errors, "voucher_id", values.voucher_id, "Voucher ID");

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

const trimOrUndefined = (value: string): string | undefined =>
  value.trim() === "" ? undefined : value.trim();

const numberOrUndefined = (value: string): number | undefined =>
  value.trim() === "" ? undefined : Number(value.trim());

export const toCreatePayload = (values: BranchFormValues): CreateBranchPayload => ({
  name: values.name.trim(),
  company_id: Number(values.company_id),
  phone: values.phone.trim(),
  cell: values.cell.trim(),
  email: values.email.trim(),
  address: trimOrUndefined(values.address),
  website: trimOrUndefined(values.website),
  status: values.status !== "" ? Number(values.status) : undefined,
  branch_code: trimOrUndefined(values.branch_code),
  short_name: trimOrUndefined(values.short_name),
  fax: numberOrUndefined(values.fax),
  city_id: numberOrUndefined(values.city_id),
  country_id: numberOrUndefined(values.country_id),
  bank_id: numberOrUndefined(values.bank_id),
  other_bank: numberOrUndefined(values.other_bank),
  voucher_id: numberOrUndefined(values.voucher_id),
  logo: trimOrUndefined(values.logo),
  ip: trimOrUndefined(values.ip),
  port: trimOrUndefined(values.port),
  cambridge_acc: trimOrUndefined(values.cambridge_acc),
  optional_acc: trimOrUndefined(values.optional_acc),
  one_bill_prefix: trimOrUndefined(values.one_bill_prefix),
  exam_center_no: trimOrUndefined(values.exam_center_no),
});

export const toUpdatePayload = (values: BranchFormValues): UpdateBranchPayload =>
  toCreatePayload(values);

export const branchToFormValues = (branch: Branch): BranchFormValues => ({
  name: branch.name,
  company_id: String(branch.company_id),
  phone: branch.phone,
  cell: branch.cell,
  email: branch.email,
  address: branch.address ?? "",
  website: branch.website ?? "",
  status: String(branch.status),
  branch_code: branch.branch_code ?? "",
  short_name: branch.short_name ?? "",
  fax: branch.fax != null ? String(branch.fax) : "",
  city_id: branch.city_id != null ? String(branch.city_id) : "",
  country_id: branch.country_id != null ? String(branch.country_id) : "",
  bank_id: branch.bank_id != null ? String(branch.bank_id) : "",
  other_bank: branch.other_bank != null ? String(branch.other_bank) : "",
  voucher_id: branch.voucher_id != null ? String(branch.voucher_id) : "",
  logo: branch.logo ?? "",
  ip: branch.ip ?? "",
  port: branch.port ?? "",
  cambridge_acc: branch.cambridge_acc ?? "",
  optional_acc: branch.optional_acc ?? "",
  one_bill_prefix: branch.one_bill_prefix ?? "",
  exam_center_no: branch.exam_center_no ?? "",
});
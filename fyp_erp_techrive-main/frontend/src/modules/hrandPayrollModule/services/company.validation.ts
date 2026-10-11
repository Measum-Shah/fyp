import { PHONE_REGEX } from "./employee.constants";
import {
  COMPANY_ADDRESS_MAX_LENGTH,
  COMPANY_DESCRIPTION_MAX_LENGTH,
  COMPANY_FAX_MAX_LENGTH,
  COMPANY_GST_MAX_LENGTH,
  COMPANY_GST_TYPE_MAX_LENGTH,
  COMPANY_LOGO_MAX_LENGTH,
  COMPANY_NAME_MAX_LENGTH,
  COMPANY_NTN_MAX_LENGTH,
  COMPANY_PHONE_MAX_LENGTH,
  COMPANY_VAT_MAX_LENGTH,
} from "./company.constants";
import type {
  Company,
  CompanyFormValues,
  CreateCompanyPayload,
  UpdateCompanyPayload,
} from "./company.types";

// ─── Company Form — Validation & Conversion ──────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/validators/company.validator.ts
// Unlike Branch, phone/fax are optional here — the regex only applies when a
// value is actually provided.

const isBlank = (value: string) => value.trim().length === 0;

export const validateCompanyForm = (values: CompanyFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.name)) {
    errors.name = "School / University name is required";
  } else if (values.name.trim().length > COMPANY_NAME_MAX_LENGTH) {
    errors.name = `School / University name must be at most ${COMPANY_NAME_MAX_LENGTH} characters`;
  }

  if (values.description.trim().length > COMPANY_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be at most ${COMPANY_DESCRIPTION_MAX_LENGTH} characters`;
  }

  if (values.ntn.trim().length > COMPANY_NTN_MAX_LENGTH) {
    errors.ntn = `NTN must be at most ${COMPANY_NTN_MAX_LENGTH} characters`;
  }

  if (values.gst.trim().length > COMPANY_GST_MAX_LENGTH) {
    errors.gst = `GST must be at most ${COMPANY_GST_MAX_LENGTH} characters`;
  }

  if (values.gst_type.trim().length > COMPANY_GST_TYPE_MAX_LENGTH) {
    errors.gst_type = `GST type must be at most ${COMPANY_GST_TYPE_MAX_LENGTH} characters`;
  }

  if (values.vat.trim().length > COMPANY_VAT_MAX_LENGTH) {
    errors.vat = `VAT must be at most ${COMPANY_VAT_MAX_LENGTH} characters`;
  }

  if (!isBlank(values.phone)) {
    if (values.phone.trim().length > COMPANY_PHONE_MAX_LENGTH) {
      errors.phone = `Phone must be at most ${COMPANY_PHONE_MAX_LENGTH} characters`;
    } else if (!PHONE_REGEX.test(values.phone.trim())) {
      errors.phone = "Phone number format is invalid";
    }
  }

  if (!isBlank(values.fax)) {
    if (values.fax.trim().length > COMPANY_FAX_MAX_LENGTH) {
      errors.fax = `Fax must be at most ${COMPANY_FAX_MAX_LENGTH} characters`;
    } else if (!PHONE_REGEX.test(values.fax.trim())) {
      errors.fax = "Fax number format is invalid";
    }
  }

  if (values.address.trim().length > COMPANY_ADDRESS_MAX_LENGTH) {
    errors.address = `Address must be at most ${COMPANY_ADDRESS_MAX_LENGTH} characters`;
  }

  if (values.logo.trim().length > COMPANY_LOGO_MAX_LENGTH) {
    errors.logo = `Logo must be at most ${COMPANY_LOGO_MAX_LENGTH} characters`;
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

const trimOrUndefined = (value: string): string | undefined =>
  value.trim() === "" ? undefined : value.trim();

export const toCreatePayload = (values: CompanyFormValues): CreateCompanyPayload => ({
  name: values.name.trim(),
  description: trimOrUndefined(values.description),
  ntn: trimOrUndefined(values.ntn),
  gst: trimOrUndefined(values.gst),
  gst_type: trimOrUndefined(values.gst_type),
  vat: trimOrUndefined(values.vat),
  phone: trimOrUndefined(values.phone),
  fax: trimOrUndefined(values.fax),
  address: trimOrUndefined(values.address),
  logo: trimOrUndefined(values.logo),
  status: values.status !== "" ? Number(values.status) : undefined,
});

export const toUpdatePayload = (values: CompanyFormValues): UpdateCompanyPayload =>
  toCreatePayload(values);

export const companyToFormValues = (company: Company): CompanyFormValues => ({
  name: company.name,
  description: company.description ?? "",
  ntn: company.ntn ?? "",
  gst: company.gst ?? "",
  gst_type: company.gst_type ?? "",
  vat: company.vat ?? "",
  phone: company.phone ?? "",
  fax: company.fax ?? "",
  address: company.address ?? "",
  logo: company.logo ?? "",
  status: String(company.status),
});
import {
  CNIC_REGEX,
  DATE_REGEX,
  EMPLOYEE_ID_REGEX,
  PHONE_REGEX,
} from "./employee.constants";
import { DISABILITY_STATUS, PAYMENT_TYPE } from "./employee.types";
import type {
  CreateEmployeePayload,
  Employee,
  EmployeeFormValues,
  UpdateEmployeePayload,
} from "./employee.types";

// ─── Employee Form — Validation & Conversion ─────────────────────────────────
export type FormMode = "create" | "edit";

const isBlank = (value: string) => value.trim().length === 0;

export const validateEmployeeForm = (
  values: EmployeeFormValues,
  mode: FormMode
): Record<string, string> => {
  const errors: Record<string, string> = {};

  // reg_no is auto-generated server-side on create (see
  // employee.constants.ts's EMPLOYEE_ID_PREFIX note) — the Add Employee
  // form doesn't collect it at all. On edit, it's still an editable field
  // for a manual correction, so it's validated there as before.
  if (mode === "edit") {
    if (isBlank(values.reg_no)) {
      errors.reg_no = "Employee ID is required";
    } else if (!EMPLOYEE_ID_REGEX.test(values.reg_no.trim())) {
      errors.reg_no =
        "Employee ID may only contain letters, numbers, '-', '_' or '/' (2-50 characters)";
    }
  }

  if (isBlank(values.first_name)) {
    errors.first_name = "First name is required";
  }

  if (isBlank(values.email)) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "A valid email address is required";
  }

  if (isBlank(values.mobile_1)) {
    errors.mobile_1 = "Phone is required";
  } else if (!PHONE_REGEX.test(values.mobile_1.trim())) {
    errors.mobile_1 = "Phone number format is invalid";
  }

  if (values.mobile_2 && !PHONE_REGEX.test(values.mobile_2.trim())) {
    errors.mobile_2 = "Secondary phone number format is invalid";
  }

  if (isBlank(values.department_id)) {
    errors.department_id = "Department is required";
  }

  if (isBlank(values.designation)) {
    errors.designation = "Designation is required";
  }

  if (isBlank(values.join_date)) {
    errors.join_date = "Joining date is required";
  } else if (!DATE_REGEX.test(values.join_date)) {
    errors.join_date = "Joining date must be a valid date";
  }

  if (isBlank(values.branch_id)) {
    errors.branch_id = "Campus is required";
  }

  if (isBlank(values.staff_type)) {
    errors.staff_type = "Staff type is required";
  }

  if (isBlank(values.cnic)) {
    errors.cnic = "CNIC is required";
  } else if (!CNIC_REGEX.test(values.cnic.trim())) {
    errors.cnic = "CNIC must be in the format 12345-1234567-1";
  }

  if (values.cnic_issue_date && !DATE_REGEX.test(values.cnic_issue_date)) {
    errors.cnic_issue_date = "CNIC issue date must be a valid date";
  }

  if (values.cnic_expiry_date && !DATE_REGEX.test(values.cnic_expiry_date)) {
    errors.cnic_expiry_date = "CNIC expiry date must be a valid date";
  }

  if (
    values.cnic_issue_date &&
    values.cnic_expiry_date &&
    DATE_REGEX.test(values.cnic_issue_date) &&
    DATE_REGEX.test(values.cnic_expiry_date) &&
    values.cnic_expiry_date <= values.cnic_issue_date
  ) {
    errors.cnic_expiry_date = "CNIC expiry date must be after the issue date";
  }

  if (values.home_phone && !PHONE_REGEX.test(values.home_phone.trim())) {
    errors.home_phone = "Home phone format is invalid";
  }

  if (values.pemail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.pemail.trim())) {
    errors.pemail = "A valid personal email address is required";
  }

  if (values.expiry_date && !DATE_REGEX.test(values.expiry_date)) {
    errors.expiry_date = "Expiry date must be a valid date";
  }

  if (values.reports_to && !/^\d+$/.test(values.reports_to.trim())) {
    errors.reports_to = "Reports To must be a valid employee id";
  }

  // ─── Salary Structure ─────────────────────────────────────────────────
  const nonNegativeNumberField = (value: string, label: string, key: string) => {
    if (value.trim() === "") return;
    if (Number.isNaN(Number(value)) || Number(value) < 0) {
      errors[key] = `${label} must be a valid non-negative number`;
    }
  };

  if (values.payment_type === PAYMENT_TYPE.VISITING_FACULTY) {
    nonNegativeNumberField(values.salary_per_hour, "Rate per hour", "salary_per_hour");
    nonNegativeNumberField(values.hours_worked, "Hours worked", "hours_worked");
  } else {
    nonNegativeNumberField(values.basic_salary, "Basic salary", "basic_salary");
    nonNegativeNumberField(values.conveyance, "Conveyance allowance", "conveyance");
    nonNegativeNumberField(values.house_rent, "House rent allowance", "house_rent");
    nonNegativeNumberField(values.medical_allowances, "Medical allowance", "medical_allowances");
  }
  nonNegativeNumberField(values.epf_amount, "EPF amount", "epf_amount");
  nonNegativeNumberField(values.eobi_amount, "EOBI amount", "eobi_amount");
  nonNegativeNumberField(values.exempt_amount, "Exempt amount", "exempt_amount");
  if (values.tax_percentage.trim() !== "") {
    const tax = Number(values.tax_percentage);
    if (Number.isNaN(tax) || tax < 0 || tax > 100) {
      errors.tax_percentage = "Tax percentage must be between 0 and 100";
    }
  }

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

// ─── EmployeeFormValues -> API payload ───────────────────────────────────────
const trimOrUndefined = (value: string): string | undefined =>
  value.trim() === "" ? undefined : value.trim();

const toAllowanceEntries = (allowances: EmployeeFormValues["allowances"]) =>
  allowances.map((a) => ({
    allowance_type_id: Number(a.allowance_type_id),
    amount: a.amount.trim() === "" ? undefined : Number(a.amount.trim()),
  }));

// reg_no is intentionally NOT part of this payload — it's auto-generated
// server-side on create. toUpdatePayload adds it back in separately, since
// edit still allows correcting it.
export const toCreatePayload = (values: EmployeeFormValues): CreateEmployeePayload => ({
  first_name: values.first_name.trim(),
  last_name: trimOrUndefined(values.last_name),
  father_name: trimOrUndefined(values.father_name),
  email: values.email.trim(),
  mobile_1: values.mobile_1.trim(),
  mobile_2: trimOrUndefined(values.mobile_2),
  department_id: Number(values.department_id),
  designation: values.designation.trim(),
  join_date: values.join_date,
  branch_id: Number(values.branch_id),
  staff_type: values.staff_type.trim(),
  cnic: values.cnic.trim(),
  cnic_attachment: trimOrUndefined(values.cnic_attachment),
  cnic_issue_date: trimOrUndefined(values.cnic_issue_date),
  cnic_expiry_date: trimOrUndefined(values.cnic_expiry_date),
  gender: values.gender ? (values.gender as CreateEmployeePayload["gender"]) : undefined,
  address: trimOrUndefined(values.address),
  city: trimOrUndefined(values.city),
  country: trimOrUndefined(values.country),
  qualification: trimOrUndefined(values.qualification),
  status: values.status ? (values.status as CreateEmployeePayload["status"]) : undefined,

  mother_name: trimOrUndefined(values.mother_name),
  date_of_birth: trimOrUndefined(values.date_of_birth),
  marital_status: trimOrUndefined(values.marital_status),
  blood_group: trimOrUndefined(values.blood_group),
  nationality: trimOrUndefined(values.nationality),
  mother_tongue: trimOrUndefined(values.mother_tongue),
  disability: values.disability !== "" ? Number(values.disability) : undefined,
  disability_description: trimOrUndefined(values.disability_description),

  home_phone: trimOrUndefined(values.home_phone),
  pemail: trimOrUndefined(values.pemail),
  temp_address: trimOrUndefined(values.temp_address),
  state: trimOrUndefined(values.state),
  temp_state: trimOrUndefined(values.temp_state),
  temp_country: trimOrUndefined(values.temp_country),

  ntn: trimOrUndefined(values.ntn),
  staff_image: trimOrUndefined(values.staff_image),
  skill: trimOrUndefined(values.skill),
  experience: trimOrUndefined(values.experience),
  other_info: trimOrUndefined(values.other_info),
  job_status: trimOrUndefined(values.job_status),
  probation: trimOrUndefined(values.probation),
  start_day_contract: trimOrUndefined(values.start_day_contract),
  end_day_contract: trimOrUndefined(values.end_day_contract),
  expiry_date: trimOrUndefined(values.expiry_date),
  first_registration_code: trimOrUndefined(values.first_registration_code),
  reports_to: values.reports_to.trim() !== "" ? Number(values.reports_to) : undefined,

  payment_type: values.payment_type
    ? (values.payment_type as CreateEmployeePayload["payment_type"])
    : undefined,
  basic_salary: values.basic_salary.trim() !== "" ? Number(values.basic_salary) : undefined,
  conveyance: values.conveyance.trim() !== "" ? Number(values.conveyance) : undefined,
  house_rent: values.house_rent.trim() !== "" ? Number(values.house_rent) : undefined,
  medical_allowances:
    values.medical_allowances.trim() !== "" ? Number(values.medical_allowances) : undefined,
  tax_percentage: values.tax_percentage.trim() !== "" ? Number(values.tax_percentage) : undefined,
  epf_amount: values.epf_amount.trim() !== "" ? Number(values.epf_amount) : undefined,
  eobi_amount: values.eobi_amount.trim() !== "" ? Number(values.eobi_amount) : undefined,
  bank_account: trimOrUndefined(values.bank_account),
  salary_per_hour: values.salary_per_hour.trim() !== "" ? Number(values.salary_per_hour) : undefined,
  hours_worked: values.hours_worked.trim() !== "" ? Number(values.hours_worked) : undefined,
  exempt_amount: values.exempt_amount.trim() !== "" ? Number(values.exempt_amount) : undefined,
  allowances: toAllowanceEntries(values.allowances),
});

export const toUpdatePayload = (values: EmployeeFormValues): UpdateEmployeePayload => {
  const payload = toCreatePayload(values) as UpdateEmployeePayload;
  // reg_no is editable on the Edit form only — added back in here since
  // toCreatePayload deliberately omits it (see the comment above it).
  payload.reg_no = values.reg_no.trim();
  return payload;
};

// ─── Employee (API record) -> EmployeeFormValues (for prefilling Edit) ──────
export const employeeToFormValues = (employee: Employee): EmployeeFormValues => ({
  reg_no: employee.reg_no ?? "",
  first_name: employee.first_name ?? "",
  last_name: employee.last_name ?? "",
  father_name: employee.father_name ?? "",
  email: employee.email,
  mobile_1: employee.mobile_1 ?? "",
  mobile_2: employee.mobile_2 ?? "",
  // Not stored on the employee record (see EmployeeFormValues.company_id) —
  // always starts blank in Edit mode, same as any other field the backend
  // doesn't return.
  company_id: "",
  department_id: employee.department_id != null ? String(employee.department_id) : "",
  designation: employee.designation ?? "",
  join_date: employee.join_date ? employee.join_date.slice(0, 10) : "",
  branch_id: String(employee.branch_id),
  staff_type: employee.staff_type,
  cnic: employee.cnic,
  cnic_attachment: employee.cnic_attachment ?? "",
  cnic_issue_date: employee.cnic_issue_date ? employee.cnic_issue_date.slice(0, 10) : "",
  cnic_expiry_date: employee.cnic_expiry_date ? employee.cnic_expiry_date.slice(0, 10) : "",
  gender: employee.gender ?? "",
  address: employee.address ?? "",
  city: employee.city ?? "",
  country: employee.country ?? "",
  qualification: employee.qualification ?? "",
  status: employee.status ?? "",

  mother_name: employee.mother_name ?? "",
  date_of_birth: employee.date_of_birth ?? "",
  marital_status: employee.marital_status ?? "",
  blood_group: employee.blood_group ?? "",
  nationality: employee.nationality ?? "",
  mother_tongue: employee.mother_tongue ?? "",
  disability: String(employee.disability ?? DISABILITY_STATUS.NO),
  disability_description: employee.disability_description ?? "",

  home_phone: employee.home_phone ?? "",
  pemail: employee.pemail ?? "",
  temp_address: employee.temp_address ?? "",
  state: employee.state ?? "",
  temp_state: employee.temp_state ?? "",
  temp_country: employee.temp_country ?? "",

  ntn: employee.ntn ?? "",
  staff_image: employee.staff_image ?? "",
  skill: employee.skill ?? "",
  experience: employee.experience ?? "",
  other_info: employee.other_info ?? "",
  job_status: employee.job_status ?? "",
  probation: employee.probation ?? "",
  start_day_contract: employee.start_day_contract ?? "",
  end_day_contract: employee.end_day_contract ?? "",
  expiry_date: employee.expiry_date ? employee.expiry_date.slice(0, 10) : "",
  first_registration_code: employee.first_registration_code ?? "",
  reports_to: employee.reports_to != null ? String(employee.reports_to) : "",

  payment_type: employee.payment_type ?? PAYMENT_TYPE.PERMANENT,
  basic_salary: employee.basic_salary != null ? String(employee.basic_salary) : "",
  conveyance: employee.conveyance ?? "",
  house_rent: employee.house_rent ?? "",
  medical_allowances: employee.medical_allowances ?? "",
  tax_percentage: employee.tax_percentage != null ? String(employee.tax_percentage) : "",
  epf_amount: employee.epf_amount != null ? String(employee.epf_amount) : "",
  eobi_amount: employee.eobi_amount != null ? String(employee.eobi_amount) : "",
  bank_account: employee.bank_account ?? "",
  salary_per_hour: employee.salary_per_hour ?? "",
  hours_worked: employee.hours_worked != null ? String(employee.hours_worked) : "",
  exempt_amount: employee.exempt_amount != null ? String(employee.exempt_amount) : "",
  allowances: employee.allowances.map((a) => ({
    allowance_type_id: String(a.allowance_type_id),
    name: a.name,
    calculation_type: "FIXED",
    is_taxable: a.is_taxable,
    amount: String(a.amount),
  })),
});
import { z } from "zod";
import {
  CNIC_REGEX,
  DATE_REGEX,
  DISABILITY_STATUS,
  EMPLOYEE_DISABILITY_DESCRIPTION_MAX_LENGTH,
  EMPLOYEE_FIRST_REGISTRATION_CODE_MAX_LENGTH,
  EMPLOYEE_ID_REGEX,
  EMPLOYEE_PERSONAL_EMAIL_MAX_LENGTH,
  EMPLOYEE_PROFILE_FIELD_MAX_LENGTH,
  EMPLOYEE_STATUS,
  PAYMENT_TYPE,
  PHONE_REGEX,
} from "../constants/employee.constants";

const profileTextField = z.string().trim().max(EMPLOYEE_PROFILE_FIELD_MAX_LENGTH).optional();
const optionalStaffId = z.coerce.number().int().positive().nullable().optional();

// ─── Default allowances (optional) ──────────────────────────────────────────
// One entry per hr_allowance_types row this employee's default Salary
// Structure should carry — see allowance-picker note in the "Salary
// Structure" section of createEmployeeSchema below. Mirrors
// salaryAllowanceInputSchema in salary.validator.ts exactly.
const staffAllowanceInputSchema = z.object({
  allowance_type_id: z.coerce.number({ error: "Allowance type is required" }).int().positive("Allowance type must be a valid id"),
  amount: z.coerce.number().min(0).optional(),
});

// ─── Shared field schemas ───────────────────────────────────────────────────
const employeeIdField = z
  .string({ error: "Employee ID is required" })
  .trim()
  .min(1, "Employee ID is required")
  .regex(
    EMPLOYEE_ID_REGEX,
    "Employee ID may only contain letters, numbers, '-', '_' or '/' (2-50 characters)"
  );

const emailField = z
  .string({ error: "Email is required" })
  .trim()
  .min(1, "Email is required")
  .email("A valid email address is required");

const phoneField = z
  .string({ error: "Phone is required" })
  .trim()
  .min(1, "Phone is required")
  .regex(PHONE_REGEX, "Phone number format is invalid");

const departmentIdField = z.coerce
  .number({ error: "Department is required" })
  .int("Department must reference a valid department id")
  .positive("Department must reference a valid department id");

const designationField = z
  .string({ error: "Designation is required" })
  .trim()
  .min(1, "Designation is required")
  .max(191, "Designation must be at most 191 characters");

const joinDateField = z
  .string({ error: "Joining date is required" })
  .trim()
  .regex(DATE_REGEX, "Joining date must be in YYYY-MM-DD format")
  .refine((val) => !Number.isNaN(new Date(val).getTime()), {
    message: "Joining date must be a valid calendar date",
  });

const cnicField = z
  .string({ error: "CNIC is required" })
  .trim()
  .regex(CNIC_REGEX, "CNIC must be in the format 12345-1234567-1");

const branchIdField = z.coerce
  .number({ error: "Campus is required" })
  .int("Campus must reference a valid campus id")
  .positive("Campus must reference a valid campus id");

const staffTypeField = z
  .string({ error: "Staff type is required" })
  .trim()
  .min(1, "Staff type is required")
  .max(191, "Staff type must be at most 191 characters");

// ─── Create Employee ────────────────────────────────────────────────────────
// reg_no is NOT required here — it's auto-generated server-side on create
// (see employee.service.ts's generateNextRegNo). It stays part of this
// schema (optional) purely so updateEmployeeSchema, which is
// createEmployeeSchema.partial(), can still accept it for a later manual
// correction; the create form itself never sends it.
export const createEmployeeSchema = z.object({
  reg_no: employeeIdField.optional(),
  first_name: z
    .string({ error: "First name is required" })
    .trim()
    .min(1, "First name is required")
    .max(191, "First name must be at most 191 characters"),
  last_name: z.string().trim().max(191).optional(),
  father_name: z.string().trim().max(191).optional(),
  email: emailField,
  mobile_1: phoneField,
  mobile_2: z.string().trim().regex(PHONE_REGEX, "Secondary phone number format is invalid").optional(),
  department_id: departmentIdField,
  designation: designationField,
  join_date: joinDateField,
  branch_id: branchIdField,
  // No user_id/password fields here anymore — Account Access was removed
  // from this form entirely. Linking a login (or resetting its password)
  // is done exclusively via the Users page (Sessions & Activity), which
  // keeps staff.user_id in sync automatically when a link is made/changed/
  // removed — see user.service.ts's createUser/updateUser/deleteUser.
  // employee.service.ts's createEmployee fills both NOT NULL columns with
  // harmless placeholders (user_id: 0 = "not linked yet") since nothing
  // client-supplied belongs in them anymore.
  staff_type: staffTypeField,
  cnic: cnicField,
  cnic_attachment: z.string().trim().max(255).optional(),
  cnic_issue_date: z
    .string()
    .trim()
    .regex(DATE_REGEX, "CNIC issue date must be in YYYY-MM-DD format")
    .refine((val) => !Number.isNaN(new Date(val).getTime()), {
      message: "CNIC issue date must be a valid calendar date",
    })
    .optional(),
  cnic_expiry_date: z
    .string()
    .trim()
    .regex(DATE_REGEX, "CNIC expiry date must be in YYYY-MM-DD format")
    .refine((val) => !Number.isNaN(new Date(val).getTime()), {
      message: "CNIC expiry date must be a valid calendar date",
    })
    .optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  address: z.string().trim().max(191).optional(),
  city: z.string().trim().max(191).optional(),
  country: z.string().trim().max(191).optional(),
  qualification: z.string().trim().max(191).optional(),
  status: z.enum([EMPLOYEE_STATUS.ACTIVE, EMPLOYEE_STATUS.INACTIVE]).optional(),

  // ─── Personal Details ───────────────────────────────────────────────────
  mother_name: profileTextField,
  date_of_birth: profileTextField, // staff.date_of_birth is VarChar, not a real DATE column — kept freeform
  marital_status: profileTextField,
  blood_group: profileTextField,
  nationality: profileTextField,
  mother_tongue: profileTextField,
  disability: z.union([z.literal(DISABILITY_STATUS.YES), z.literal(DISABILITY_STATUS.NO)]).optional(),
  disability_description: z.string().trim().max(EMPLOYEE_DISABILITY_DESCRIPTION_MAX_LENGTH).optional(),

  // ─── Additional Contact ─────────────────────────────────────────────────
  home_phone: z.string().trim().regex(PHONE_REGEX, "Home phone format is invalid").optional(),
  pemail: z
    .string()
    .trim()
    .max(EMPLOYEE_PERSONAL_EMAIL_MAX_LENGTH)
    .email("A valid personal email address is required")
    .optional(),
  temp_address: profileTextField,
  state: profileTextField,
  temp_state: profileTextField,
  temp_country: profileTextField,

  // ─── Professional Profile ────────────────────────────────────────────────
  ntn: profileTextField,
  staff_image: profileTextField,
  skill: profileTextField,
  experience: profileTextField,
  other_info: profileTextField,
  job_status: profileTextField,
  probation: profileTextField,
  start_day_contract: profileTextField,
  end_day_contract: profileTextField,
  expiry_date: z
    .string()
    .trim()
    .regex(DATE_REGEX, "Expiry date must be in YYYY-MM-DD format")
    .refine((val) => !Number.isNaN(new Date(val).getTime()), {
      message: "Expiry date must be a valid calendar date",
    })
    .optional(),
  first_registration_code: z.string().trim().max(EMPLOYEE_FIRST_REGISTRATION_CODE_MAX_LENGTH).optional(),
  reports_to: optionalStaffId,
  replaced_by: optionalStaffId,

  // ─── Salary Structure ────────────────────────────────────────────────────
  // These live directly on `staff` (legacy columns) rather than a separate
  // table, and are what Payroll Run (payrollRun.service.ts) reads to
  // compute a salary sheet for an employee — without them a run silently
  // produces a ₨0 sheet instead of failing loudly.
  //
  // `payment_type` picks which of the two groups below apply (displayed to
  // the user as "Fixed Salary" and "Per Hour Salary" respectively — the
  // stored values themselves are unchanged):
  //  - Permanent ("Fixed Salary"):    basic_salary + conveyance + house_rent + medical_allowances
  //  - Visiting Faculty ("Per Hour Salary"): salary_per_hour x hours_worked
  // Both groups also share tax_percentage / epf_amount / eobi_amount /
  // bank_account / allowances, which apply regardless of payment type.
  payment_type: z.enum([PAYMENT_TYPE.PERMANENT, PAYMENT_TYPE.VISITING_FACULTY]).optional(),
  basic_salary: z.coerce.number().int().nonnegative("Basic salary cannot be negative").optional(),
  conveyance: z.coerce.number().nonnegative("Conveyance allowance cannot be negative").optional(),
  house_rent: z.coerce.number().nonnegative("House rent allowance cannot be negative").optional(),
  medical_allowances: z.coerce.number().nonnegative("Medical allowance cannot be negative").optional(),
  tax_percentage: z.coerce.number().min(0, "Tax percentage cannot be negative").max(100, "Tax percentage cannot exceed 100").optional(),
  epf_amount: z.coerce.number().int().nonnegative("EPF amount cannot be negative").optional(),
  eobi_amount: z.coerce.number().int().nonnegative("EOBI amount cannot be negative").optional(),
  bank_account: z.string().trim().max(191).optional(),

  // ─── Visiting Faculty pay (only meaningful when payment_type is
  // "Visiting Faculty", but left unconditional here — same optional/free
  // pattern as the Permanent salary fields above — so a partial update can
  // still tweak just one of the two without re-sending payment_type).
  salary_per_hour: z.coerce.number().nonnegative("Rate per hour cannot be negative").optional(),
  hours_worked: z.coerce.number().nonnegative("Hours worked cannot be negative").optional(),

  // Manual slice of the taxable base shielded from tax entirely — mirrors
  // erp_staff_salaries.exempt_amount, see salary.constants.ts's "Allowances
  // & Auto Tax Calculation" note for the identical Salary Sheet behaviour.
  exempt_amount: z.coerce.number().min(0).optional(),

  // Optional default allowances for this employee's Salary Structure —
  // picked from the reusable hr_allowance_types master list, same as a
  // Salary Sheet's own allowance picker. When provided, replaces this
  // employee's entire default set (wholesale, not a patch) and folds into
  // the `salary` gross-total fallback column. Payroll Run copies these
  // onto each newly generated monthly sheet automatically.
  allowances: z.array(staffAllowanceInputSchema).optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

// ─── Update Employee (all fields optional, but body cannot be empty) ───────
export const updateEmployeeSchema = createEmployeeSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the employee",
  });

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const employeeIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Employee id must be a number" })
    .int("Employee id must be a valid integer")
    .positive("Employee id must be a valid integer"),
});

// ─── GET /employees query params ────────────────────────────────────────────
export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  department_id: z.coerce.number().int().positive().optional(),
  status: z.enum([EMPLOYEE_STATUS.ACTIVE, EMPLOYEE_STATUS.INACTIVE]).optional(),
});
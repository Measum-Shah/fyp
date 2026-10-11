import { DATE_REGEX } from "./employee.constants";
import type {
  CreateSalaryAllowanceEntry,
  CreateSalaryPayload,
  SalaryAllowanceFormEntry,
  SalaryFormValues,
  SalarySheet,
  UpdateSalaryPayload,
} from "./salary.types";

// ─── Salary Sheet Form — Validation & Conversion ─────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/validators/salary.validator.ts

const isBlank = (value: string) => value.trim().length === 0;
const isValidNonNegativeInt = (value: string) => value.trim() === "" || /^\d+$/.test(value.trim());
const isValidNonNegativeNumber = (value: string) => value.trim() === "" || (!Number.isNaN(Number(value.trim())) && Number(value.trim()) >= 0);

export const validateSalaryForm = (values: SalaryFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (isBlank(values.staff_id)) errors.staff_id = "Employee is required";
  if (isBlank(values.branch_id)) errors.branch_id = "Campus is required";
  if (isBlank(values.ledger_id)) errors.ledger_id = "Ledger id is required";
  if (isBlank(values.financial_year)) errors.financial_year = "Fiscal year is required";

  if (isBlank(values.date)) {
    errors.date = "Date is required";
  } else if (!DATE_REGEX.test(values.date.trim())) {
    errors.date = "Date must be in YYYY-MM-DD format";
  }

  if (isBlank(values.month_id)) errors.month_id = "Month is required";
  if (isBlank(values.year_id)) errors.year_id = "Year is required";

  // Gross or Basic requirement based on mode:
  if (values.calculation_mode === "GROSS") {
    if (isBlank(values.gross_salary)) {
      errors.gross_salary = "Gross salary is required";
    } else if (!isValidNonNegativeInt(values.gross_salary)) {
      errors.gross_salary = "Gross salary must be a valid whole number";
    }
  } else if (values.calculation_mode === "BASIC") {
    if (isBlank(values.basic_salary)) {
      errors.basic_salary = "Basic salary is required";
    } else if (!isValidNonNegativeInt(values.basic_salary)) {
      errors.basic_salary = "Basic salary must be a valid whole number";
    }
  } else if (values.allowances.length === 0) {
    if (isBlank(values.gross_salary)) {
      errors.gross_salary = "Gross salary is required";
    } else if (!isValidNonNegativeInt(values.gross_salary)) {
      errors.gross_salary = "Gross salary must be a valid whole number";
    }
  }

  const numericOptionalFields: (keyof SalaryFormValues)[] = [
    "conveyance_allowance", "training", "eobi_amount", "epf_amount",
    "tax_amount", "exempt_amount", "loan_amount", "pay_loan", "other_deduction", "leaves",
    "leaves_deduction", "arrears",
  ];
  if (values.calculation_mode !== "BASIC") {
    numericOptionalFields.push("basic_salary");
  }
  if (values.calculation_mode !== "GROSS" && values.allowances.length > 0) {
    // gross is computed
  } else if (values.calculation_mode !== "GROSS") {
    numericOptionalFields.push("gross_salary");
  }
  numericOptionalFields.forEach((field) => {
    if (!isValidNonNegativeInt(values[field] as string)) {
      errors[field] = "Must be a valid whole number";
    }
  });

  values.allowances.forEach((entry, index) => {
    if (!isValidNonNegativeNumber(entry.amount)) {
      errors[`allowances.${index}.amount`] = "Must be a non-negative amount";
    }
  });

  return errors;
};

export const isFormValid = (errors: Record<string, string>): boolean =>
  Object.keys(errors).length === 0;

const numOrUndefined = (value: string): number | undefined =>
  value.trim() === "" ? undefined : Number(value.trim());
const strOrUndefined = (value: string): string | undefined =>
  value.trim() === "" ? undefined : value.trim();

const toAllowanceEntries = (allowances: SalaryAllowanceFormEntry[]): CreateSalaryAllowanceEntry[] =>
  allowances.map((a) => ({
    allowance_type_id: Number(a.allowance_type_id),
    amount: a.amount.trim() === "" ? undefined : Number(a.amount.trim()),
  }));

export const toCreatePayload = (values: SalaryFormValues): CreateSalaryPayload => ({
  staff_id: Number(values.staff_id),
  branch_id: Number(values.branch_id),
  ledger_id: Number(values.ledger_id),
  financial_year: Number(values.financial_year),
  date: values.date.trim(),
  month_id: values.month_id,
  year_id: Number(values.year_id),
  staff_category: strOrUndefined(values.staff_category),
  description: strOrUndefined(values.description),
  bank_account: strOrUndefined(values.bank_account),
  remarks: strOrUndefined(values.remarks),
  gross_salary: numOrUndefined(values.gross_salary),
  basic_salary: numOrUndefined(values.basic_salary),
  medical_allowance: numOrUndefined(values.medical_allowance),
  house_rent_allowance: numOrUndefined(values.house_rent_allowance),
  conveyance_allowance: numOrUndefined(values.conveyance_allowance),
  training: numOrUndefined(values.training),
  eobi_amount: numOrUndefined(values.eobi_amount),
  epf_amount: numOrUndefined(values.epf_amount),
  tax_amount: numOrUndefined(values.tax_amount),
  exempt_amount: numOrUndefined(values.exempt_amount),
  loan_amount: numOrUndefined(values.loan_amount),
  pay_loan: numOrUndefined(values.pay_loan),
  other_deduction: numOrUndefined(values.other_deduction),
  leaves: numOrUndefined(values.leaves),
  leaves_deduction: numOrUndefined(values.leaves_deduction),
  arrears: numOrUndefined(values.arrears),
  allowances: values.allowances.length > 0 ? toAllowanceEntries(values.allowances) : undefined,
  pay_status: values.pay_status || undefined,
  salary_status: values.salary_status || undefined,
});

export const toUpdatePayload = (values: SalaryFormValues): UpdateSalaryPayload =>
  toCreatePayload(values);

export const salaryToFormValues = (record: SalarySheet): SalaryFormValues => ({
  staff_id: record.staff_id != null ? String(record.staff_id) : "",
  branch_id: record.branch_id != null ? String(record.branch_id) : "",
  ledger_id: record.ledger_id != null ? String(record.ledger_id) : "",
  financial_year: record.financial_year != null ? String(record.financial_year) : "",
  date: record.date ? record.date.slice(0, 10) : "",
  month_id: record.month_id ?? "",
  year_id: record.year_id != null ? String(record.year_id) : "",
  staff_category: record.staff_category ?? "",
  description: record.description ?? "",
  bank_account: record.bank_account ?? "",
  remarks: record.remarks ?? "",
  gross_salary: String(record.gross_salary ?? ""),
  basic_salary: record.basic_salary != null ? String(record.basic_salary) : "",
  medical_allowance: record.medical_allowance ?? "",
  house_rent_allowance: record.house_rent_allowance ?? "",
  conveyance_allowance: record.conveyance_allowance != null ? String(record.conveyance_allowance) : "",
  training: record.training != null ? String(record.training) : "",
  eobi_amount: record.eobi_amount != null ? String(record.eobi_amount) : "",
  epf_amount: record.epf_amount != null ? String(record.epf_amount) : "",
  tax_amount: record.tax_amount != null ? String(record.tax_amount) : "",
  exempt_amount: record.exempt_amount != null ? String(record.exempt_amount) : "",
  loan_amount: record.loan_amount != null ? String(record.loan_amount) : "",
  pay_loan: record.pay_loan != null ? String(record.pay_loan) : "",
  other_deduction: record.other_deduction != null ? String(record.other_deduction) : "",
  leaves: record.leaves != null ? String(record.leaves) : "",
  leaves_deduction: record.leaves_deduction != null ? String(record.leaves_deduction) : "",
  arrears: record.arrears != null ? String(record.arrears) : "",
  pay_status: record.pay_status ?? "",
  salary_status: record.salary_status ?? "",
  allowances: record.allowances.map((a) => ({
    allowance_type_id: String(a.allowance_type_id),
    name: a.name,
    calculation_type: "FIXED", // display-only fallback; amount is already resolved on `a.amount`
    is_taxable: a.is_taxable,
    amount: String(a.amount),
  })),
});

// ─── Live preview helpers (used by SalaryFormModal) ────────────────────────
// Mirror the backend's computeAutoGrossSalary/taxable-base math closely
// enough for an in-form estimate. The actual persisted values always come
// from the server response after save — this is purely UX, not the source
// of truth.
export const resolveAllowanceAmount = (entry: SalaryAllowanceFormEntry, basicSalary: number): number => {
  if (entry.amount.trim() !== "") return Number(entry.amount.trim()) || 0;
  if (entry.calculation_type === "PERCENTAGE" && entry.default_value != null) {
    return Math.round((entry.default_value / 100) * basicSalary);
  }
  return entry.default_value || 0;
};

export const computePreviewGrossSalary = (values: SalaryFormValues): number => {
  const basic = Number(values.basic_salary || 0);
  const medical = Number(values.medical_allowance || 0);
  const houseRent = Number(values.house_rent_allowance || 0);
  const conveyance = Number(values.conveyance_allowance || 0);
  const arrears = Number(values.arrears || 0);
  const allowanceSum = values.allowances.reduce((sum, a) => sum + resolveAllowanceAmount(a, basic), 0);
  return Math.round(basic + medical + houseRent + conveyance + arrears + allowanceSum);
};

export const computePreviewTaxableBase = (values: SalaryFormValues): number => {
  const basic = Number(values.basic_salary || 0);
  const taxableAllowanceSum = values.allowances
    .filter((a) => a.is_taxable)
    .reduce((sum, a) => sum + resolveAllowanceAmount(a, basic), 0);
  const exempt = Number(values.exempt_amount || 0);
  return Math.max(0, basic + taxableAllowanceSum - exempt);
};

/**
 * Reverse-calculates Basic Salary from Gross Salary:
 * Gross = Basic * (1 + sum(percentage_allowances)) + sum(fixed_allowances) + legacy_allowances
 * => Basic = (Gross - sum(fixed_allowances) - legacy_allowances) / (1 + sum(percentage_allowances))
 */
export const computeBasicFromGross = (
  grossSalary: number,
  allowances: SalaryAllowanceFormEntry[],
  legacy: { medical?: number; houseRent?: number; conveyance?: number; arrears?: number } = {}
): number => {
  if (grossSalary <= 0) return 0;
  const fixedLegacy =
    (legacy.medical || 0) +
    (legacy.houseRent || 0) +
    (legacy.conveyance || 0) +
    (legacy.arrears || 0);

  let totalPercent = 0;
  let totalFixed = fixedLegacy;

  for (const a of allowances) {
    if (a.calculation_type === "PERCENTAGE") {
      const pct = a.default_value != null ? a.default_value : 0;
      totalPercent += pct;
    } else {
      totalFixed += Number(a.amount) || a.default_value || 0;
    }
  }

  const remaining = Math.max(0, grossSalary - totalFixed);
  const basic = Math.round(remaining / (1 + totalPercent / 100));
  return basic;
};

/**
 * Updates amounts for all percentage-based allowances when basic salary changes.
 */
export const recalculatePercentageAllowances = (
  allowances: SalaryAllowanceFormEntry[],
  basicSalary: number
): SalaryAllowanceFormEntry[] => {
  return allowances.map((a) => {
    if (a.calculation_type === "PERCENTAGE" && a.default_value != null) {
      const calc = Math.round((a.default_value / 100) * basicSalary);
      return { ...a, amount: String(calc) };
    }
    return a;
  });
};
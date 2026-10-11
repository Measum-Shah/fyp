import React, { useEffect, useMemo, useState } from "react";
import FormField from "./FormField";
import StatutoryAmountField from "./StatutoryAmountField";
import { previewAutoEobi, previewAutoEpf } from "../utils/statutoryCalculation";
import {
  isFormValid,
  validateEmployeeForm,
  type FormMode,
} from "../services/employee.validation";
import {
  computeBasicFromGross,
  recalculatePercentageAllowances,
} from "../services/salary.validation";
import {
  EMPTY_EMPLOYEE_FORM_VALUES,
  GENDER_OPTIONS,
  EMPLOYEE_STATUS,
  PAYMENT_TYPE,
  PAYMENT_TYPE_OPTIONS,
  PAYMENT_TYPE_LABELS,
} from "../services/employee.types";
import type { EmployeeAllowanceFormEntry, EmployeeFormValues, LookupOption } from "../services/employee.types";
import { employeeAPI, getApiErrorMessage, resolveEmployeeFileUrl } from "../services/employee.service";
import { useAllowanceTypeLookup } from "../hooks/useAllowanceTypes";
import { ALLOWANCE_CALCULATION_TYPE } from "../services/allowanceType.types";
import { useFiscalYearLookup } from "../hooks/useFiscalYears";
import { useTaxSlabsForFiscalYear } from "../hooks/useTaxSlabs";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { useDepartmentsLookup } from "../hooks/useDepartmentsLookup";
import { calculatePreviewTax } from "../services/taxSlab.validation";

// ─── Section configuration ───────────────────────────────────────────────────
// These seven keys are the only sections EmployeeForm itself renders — they
// map 1:1 onto the tabs shown in the shared EmployeeSectionNav on the Add /
// View / Edit dashboards. Any other tab (Experience, Family, Qualifications,
// Assets, …) is an independent sub-resource rendered by the parent page
// alongside this form, not inside it. "salary" is the exception among
// those non-form-section tabs' neighbours — it IS one of this form's own
// sections (its fields live directly on `staff`, saved with the same
// Create/Save action as every other tab here), it's simply placed last in
// the wizard/tab order by the parent pages.
export type EmployeeFormSection =
  | "basic"
  | "personal"
  | "contact"
  | "employment"
  | "professional"
  | "salary";

// Used to jump the user back to the right tab when validation fails on a
// field that isn't on the currently active section.
const FIELD_SECTION: Record<string, EmployeeFormSection> = {
  reg_no: "basic",
  first_name: "basic",
  last_name: "basic",
  father_name: "basic",
  gender: "basic",
  cnic: "basic",
  cnic_issue_date: "basic",
  cnic_expiry_date: "basic",
  cnic_attachment: "basic",

  mother_name: "personal",
  date_of_birth: "personal",
  marital_status: "personal",
  blood_group: "personal",
  nationality: "personal",
  mother_tongue: "personal",
  disability: "personal",
  disability_description: "personal",

  email: "contact",
  mobile_1: "contact",
  mobile_2: "contact",
  city: "contact",
  country: "contact",
  address: "contact",
  home_phone: "contact",
  pemail: "contact",
  temp_address: "contact",
  state: "contact",
  temp_state: "contact",
  temp_country: "contact",

  company_id: "employment",
  department_id: "employment",
  branch_id: "employment",
  designation: "employment",
  staff_type: "employment",
  join_date: "employment",
  qualification: "employment",
  status: "employment",

  ntn: "professional",
  staff_image: "professional",
  skill: "professional",
  experience: "professional",
  job_status: "professional",
  probation: "professional",
  start_day_contract: "professional",
  end_day_contract: "professional",
  expiry_date: "professional",
  first_registration_code: "professional",
  reports_to: "professional",
  other_info: "professional",

  payment_type: "salary",
  basic_salary: "salary",
  conveyance: "salary",
  house_rent: "salary",
  medical_allowances: "salary",
  tax_percentage: "salary",
  epf_amount: "salary",
  eobi_amount: "salary",
  bank_account: "salary",
  salary_per_hour: "salary",
  hours_worked: "salary",
};

interface EmployeeFormLookups {
  // Reuses the same Companies lookup as the Branch form (useCompanies /
  // branchAPI.lookups.companies()) — see the "School" field (labelled
  // "School" for Employee Employment Details, backed by the same
  // company_id/Company data everywhere else) in the Employment Details
  // section below. Not fetched by useLookups.ts itself (that hook is
  // shared by 20+ report/list pages that have no use for it), so callers
  // pass it in alongside the other four.
  companies: LookupOption[];
  departments: LookupOption[];
  branches: LookupOption[];
  designations: LookupOption[];
  staffTypes: LookupOption[];
}

interface EmployeeFormProps {
  // HTML id given to the underlying <form> element. The shared
  // EmployeeFormActionsBar lives OUTSIDE this component (so it can stay
  // visible no matter which tab — including non-form tabs like
  // Qualifications/Assets — is active) and submits by referencing this id
  // via a native `form="…"` button attribute.
  formId: string;
  mode: FormMode;
  initialValues?: EmployeeFormValues;
  lookups: EmployeeFormLookups;
  submitting: boolean;
  serverErrors?: Record<string, string>;
  // Only the section matching one of the six EmployeeFormSection keys is
  // rendered — every other value (e.g. "qualifications") simply renders an
  // empty (but still mounted) <form>, which is exactly what AddEmployeePage
  // wants while the user is on a non-form tab.
  activeSection: EmployeeFormSection | string;
  // View Employee passes readOnly — every field is shown but disabled via a
  // single wrapping <fieldset>, so no per-input plumbing is needed and the
  // exact same markup/spacing is reused for View and Edit.
  readOnly?: boolean;
  onSubmit: (values: EmployeeFormValues) => void;
  // Called (with the section a failing field lives in) when client-side
  // validation fails on a field that isn't part of the currently active
  // section, so the parent can switch tabs and reveal the error.
  onValidationError?: (section: EmployeeFormSection) => void;
}

const IconPaperclip = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

// Shared by AddEmployeePage and EmployeeProfilePage (View + Edit). Owns
// local form state and client-side validation (mirroring the backend
// validator so mistakes are caught instantly); the parent page owns the
// actual API call and merges any server-side errors (e.g. a duplicate
// reg_no caught by a race condition) back in via `serverErrors`.
//
// Only one section's fields are rendered at a time (per `activeSection`),
// but `values` covers every field regardless of which section is visible —
// switching tabs never loses an edit made on another tab.
//
// NOTE: `initialValues` is only read once, as the useState initializer — by
// design, the profile page waits until the employee record has finished
// loading before it renders <EmployeeForm>, so there's no need to re-sync
// state when the prop changes later (avoiding a fragile effect-based sync).
const EmployeeForm: React.FC<EmployeeFormProps> = ({
  formId,
  mode,
  initialValues,
  lookups,
  submitting,
  serverErrors = {},
  activeSection,
  readOnly = false,
  onSubmit,
  onValidationError,
}) => {
  const [values, setValues] = useState<EmployeeFormValues>(
    initialValues ?? EMPTY_EMPLOYEE_FORM_VALUES
  );
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});


  // School → Campus → Department cascade (see the Company→Branch→Department
  // scoping task). All three fields are independently required on this
  // record, so this narrows each dropdown's options rather than gating it —
  // a School/Campus is usually already selected by the time this fires
  // (edit mode), and falls back to the full/empty list (undefined/no
  // selection yet) until one is, preserving the existing selection either
  // way.
  const { branches: scopedBranches } = useBranchesLookup(
    values.company_id ? Number(values.company_id) : undefined
  );
  const { departments: scopedDepartments } = useDepartmentsLookup(
    values.branch_id ? Number(values.branch_id) : undefined
  );

  // The profile picture itself is managed from the Employee Profile Card
  // (see EmployeeAvatar usage in EmployeeProfileHeader) and saved
  // immediately via the API — it is no longer part of this form. The CNIC
  // attachment upload below follows the same immediate-upload pattern as
  // StaffQualificationFormModal: the file is uploaded right away (so the
  // user gets instant feedback / can preview it), but only the returned
  // path is staged into `values` — it is not persisted to the employee
  // record until the form itself is submitted.
  const [cnicUploading, setCnicUploading] = useState(false);
  const [cnicUploadError, setCnicUploadError] = useState<string | null>(null);

  const [empSalaryMode, setEmpSalaryMode] = useState<"BASIC" | "GROSS">("BASIC");
  const [empGrossInput, setEmpGrossInput] = useState<string>("");

  const errors = { ...clientErrors, ...serverErrors };

  // If a server error comes back for a field on a section other than the
  // one currently visible, jump there so the person actually sees it.
  useEffect(() => {
    if (!serverErrors || Object.keys(serverErrors).length === 0) return;
    const firstField = Object.keys(serverErrors)[0];
    const section = FIELD_SECTION[firstField];
    if (section && section !== activeSection && onValidationError) {
      onValidationError(section);
    }
    // Only re-run when a *new* serverErrors object arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverErrors]);

  const handleCnicAttachmentSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setCnicUploading(true);
    setCnicUploadError(null);
    try {
      const res = await employeeAPI.uploadCnicAttachment(file);
      setValues((prev) => ({ ...prev, cnic_attachment: res.data.cnic_attachment }));
    } catch (err) {
      setCnicUploadError(getApiErrorMessage(err));
    } finally {
      setCnicUploading(false);
    }
  };

  const removeCnicAttachment = () => setValues((prev) => ({ ...prev, cnic_attachment: "" }));

  const handleChange = (
    field: keyof EmployeeFormValues
  ) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const nextValue = e.target.value;
    setValues((prev) => ({
      ...prev,
      [field]: nextValue,
      // A campus from the old school is no longer valid/visible — clear it,
      // and a department from the old campus is no longer valid either, so
      // clear that too (a School change cascades all the way down).
      ...(field === "company_id" ? { branch_id: "", department_id: "" } : {}),
      // A department from the old campus is no longer valid/visible — clear it.
      ...(field === "branch_id" ? { department_id: "" } : {}),
    }));
    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    const validationErrors = validateEmployeeForm(values, mode);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) {
      onSubmit(values);
      return;
    }
    const firstField = Object.keys(validationErrors)[0];
    const section = FIELD_SECTION[firstField];
    if (section && section !== activeSection && onValidationError) {
      onValidationError(section);
    }
  };

  const err = (field: keyof EmployeeFormValues) => errors[field];
  const disabled = submitting || readOnly;
  const show = (section: EmployeeFormSection) => activeSection === section;

  // Live preview only (never submitted) — mirrors computeGrossSalary in
  // employee.service.ts so what the person sees here matches what actually
  // gets saved to `salary` on submit.
  const numOrZero = (v: string) => (v.trim() === "" ? 0 : Number(v) || 0);
  const { allowanceTypes } = useAllowanceTypeLookup();
  const [pickerAllowanceId, setPickerAllowanceId] = useState("");

  // Fiscal Year here is PREVIEW-ONLY — it picks which tax slab ladder to
  // estimate against on this form; it isn't saved on the employee record.
  // Payroll Run always asks for its own Fiscal Year when it actually
  // generates sheets, which is the authoritative calculation. See
  // salary.constants.ts's "Allowances & Auto Tax Calculation" note.
  const { fiscalYears } = useFiscalYearLookup();
  const [previewFiscalYearId, setPreviewFiscalYearId] = useState<number | null>(null);
  useEffect(() => {
    if (previewFiscalYearId === null && fiscalYears.length > 0) {
      setPreviewFiscalYearId(fiscalYears[0].id);
    }
  }, [fiscalYears, previewFiscalYearId]);
  const { slabs: previewSlabs } = useTaxSlabsForFiscalYear(previewFiscalYearId);

  const availableAllowanceTypes = useMemo(
    () => allowanceTypes.filter((t) => !values.allowances.some((a) => a.allowance_type_id === String(t.id))),
    [allowanceTypes, values.allowances]
  );

  const allowanceSum = values.allowances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  // Only allowances flagged "taxable" belong in the tax base — mirrors
  // salary.service.ts's real auto-tax-calc (`resolvedAllowances.filter(a
  // => a.is_taxable)`), which is the authoritative computation actually
  // used when a Salary Sheet is generated (manually or via a Payroll
  // Run). Gross Pay below still includes every allowance regardless of
  // taxability — only the tax base itself needs this split.
  const taxableAllowanceSum = values.allowances
    .filter((a) => a.is_taxable)
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const isHourly = values.payment_type === PAYMENT_TYPE.VISITING_FACULTY;
  // Hours Worked × Rate per Hour — the base pay figure Per Hour Salary
  // starts from, same role "Basic Salary" plays for Fixed Salary.
  const hourlyBasePay = numOrZero(values.salary_per_hour) * numOrZero(values.hours_worked);

  // ── Gross Pay = Basic Salary (or Hours Worked × Rate per Hour for Per
  // Hour Salary) + ALL applicable allowances. This is the single source of
  // truth every downstream figure (tax, deductions, net salary) is derived
  // from, and it recalculates automatically on every render since it reads
  // straight from `values` — any edit to Basic Salary, Hours Worked, Rate
  // per Hour, or the Allowances table updates it immediately.
  const grossPreview = isHourly
    ? hourlyBasePay + allowanceSum
    : numOrZero(values.basic_salary) +
      numOrZero(values.conveyance) +
      numOrZero(values.house_rent) +
      numOrZero(values.medical_allowances) +
      allowanceSum;

  // Normalizes an allowance entry by attaching its calculation_type and default_value
  // from the configured allowanceTypes lookup if not already set.
  const normalizeAllowances = (
    allowancesList: EmployeeAllowanceFormEntry[]
  ): EmployeeAllowanceFormEntry[] => {
    return allowancesList.map((a) => {
      const matchingType = allowanceTypes.find((t) => String(t.id) === a.allowance_type_id);
      const isPct =
        a.calculation_type === "PERCENTAGE" ||
        matchingType?.calculation_type === ALLOWANCE_CALCULATION_TYPE.PERCENTAGE;
      const defVal = a.default_value ?? matchingType?.default_value ?? 0;
      return {
        ...a,
        calculation_type: isPct ? "PERCENTAGE" : "FIXED",
        default_value: defVal,
      };
    });
  };

  // Synchronizes allowance calculation_type and default_value with allowanceTypes lookup
  useEffect(() => {
    if (allowanceTypes.length === 0 || values.allowances.length === 0) return;
    let needsUpdate = false;
    const synced = values.allowances.map((a) => {
      const type = allowanceTypes.find((t) => String(t.id) === a.allowance_type_id);
      if (!type) return a;
      const isPct = type.calculation_type === ALLOWANCE_CALCULATION_TYPE.PERCENTAGE;
      const expectedType = isPct ? "PERCENTAGE" : "FIXED";
      const expectedDef = type.default_value;
      if (a.calculation_type !== expectedType || a.default_value !== expectedDef) {
        needsUpdate = true;
        return {
          ...a,
          calculation_type: expectedType as "PERCENTAGE" | "FIXED",
          default_value: expectedDef,
        };
      }
      return a;
    });
    if (needsUpdate) {
      setValues((prev) => ({ ...prev, allowances: synced }));
    }
  }, [allowanceTypes]);

  const calculateBasicFromGross = (
    targetGross: number,
    allowancesList: EmployeeAllowanceFormEntry[]
  ): number => {
    const normalized = normalizeAllowances(allowancesList);
    const legacy = {
      conveyance: numOrZero(values.conveyance),
      houseRent: numOrZero(values.house_rent),
      medical: numOrZero(values.medical_allowances),
    };
    return computeBasicFromGross(targetGross, normalized, legacy);
  };

  const recalculateAllowancesForBasic = (
    allowancesList: EmployeeAllowanceFormEntry[],
    basic: number
  ): EmployeeAllowanceFormEntry[] => {
    const normalized = normalizeAllowances(allowancesList);
    return recalculatePercentageAllowances(normalized, basic);
  };

  const handleEmpSalaryModeSwitch = (mode: "BASIC" | "GROSS") => {
    setEmpSalaryMode(mode);
    if (mode === "GROSS") {
      setEmpGrossInput(grossPreview > 0 ? String(grossPreview) : "");
    }
  };

  const handleEmpBasicSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextBasic = e.target.value;
    const numBasic = Number(nextBasic || 0);

    let nextAllowances = [...values.allowances];
    
    // Auto-add all missing allowances when basic salary is first entered
    const isFirstEntry = numBasic > 0 && (!values.basic_salary || Number(values.basic_salary) === 0);
    if (isFirstEntry) {
      allowanceTypes.forEach((type) => {
        if (!nextAllowances.some((a) => a.allowance_type_id === String(type.id))) {
          const isPct = type.calculation_type === ALLOWANCE_CALCULATION_TYPE.PERCENTAGE;
          nextAllowances.push({
            allowance_type_id: String(type.id),
            name: type.name,
            calculation_type: isPct ? "PERCENTAGE" : "FIXED",
            default_value: type.default_value,
            is_taxable: type.is_taxable === 1,
            amount: isPct ? String(Math.round((type.default_value / 100) * numBasic)) : String(type.default_value),
          });
        }
      });
    }

    const updatedAllowances = recalculateAllowancesForBasic(nextAllowances, numBasic);
    setValues((prev) => ({
      ...prev,
      basic_salary: nextBasic,
      allowances: updatedAllowances,
    }));
    setClientErrors((prev) => {
      if (!("basic_salary" in prev)) return prev;
      const next = { ...prev };
      delete next.basic_salary;
      return next;
    });
  };

  const handleEmpGrossSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextGross = e.target.value;
    setEmpGrossInput(nextGross);
    const numGross = Number(nextGross || 0);

    let nextAllowances = [...values.allowances];

    // Auto-add all missing allowances when gross salary is first entered
    const isFirstEntry = numGross > 0 && (!empGrossInput || Number(empGrossInput) === 0);
    if (isFirstEntry) {
      allowanceTypes.forEach((type) => {
        if (!nextAllowances.some((a) => a.allowance_type_id === String(type.id))) {
          const isPct = type.calculation_type === ALLOWANCE_CALCULATION_TYPE.PERCENTAGE;
          nextAllowances.push({
            allowance_type_id: String(type.id),
            name: type.name,
            calculation_type: isPct ? "PERCENTAGE" : "FIXED",
            default_value: type.default_value,
            is_taxable: type.is_taxable === 1,
            amount: isPct ? "0" : String(type.default_value),
          });
        }
      });
    }

    const computedBasic = calculateBasicFromGross(numGross, nextAllowances);
    const updatedAllowances = recalculateAllowancesForBasic(nextAllowances, computedBasic);

    setValues((prev) => ({
      ...prev,
      basic_salary: String(computedBasic),
      allowances: updatedAllowances,
    }));
    setClientErrors((prev) => {
      if (!("basic_salary" in prev)) return prev;
      const next = { ...prev };
      delete next.basic_salary;
      return next;
    });
  };

  const handleAddAllowance = () => {
    if (!pickerAllowanceId) return;
    const type = allowanceTypes.find((t) => String(t.id) === pickerAllowanceId);
    if (!type) return;

    const isPct = type.calculation_type === ALLOWANCE_CALCULATION_TYPE.PERCENTAGE;
    const isVisiting = values.payment_type === PAYMENT_TYPE.VISITING_FACULTY;

    if (isVisiting) {
      const hourlyBase = numOrZero(values.salary_per_hour) * numOrZero(values.hours_worked);
      const resolvedAmount = isPct ? Math.round((type.default_value / 100) * hourlyBase) : type.default_value;
      const newEntry: EmployeeAllowanceFormEntry = {
        allowance_type_id: String(type.id),
        name: type.name,
        calculation_type: isPct ? "PERCENTAGE" : "FIXED",
        default_value: type.default_value,
        is_taxable: type.is_taxable === 1,
        amount: String(resolvedAmount),
      };
      setValues((prev) => ({ ...prev, allowances: [...prev.allowances, newEntry] }));
    } else if (empSalaryMode === "GROSS") {
      const newEntry: EmployeeAllowanceFormEntry = {
        allowance_type_id: String(type.id),
        name: type.name,
        calculation_type: isPct ? "PERCENTAGE" : "FIXED",
        default_value: type.default_value,
        is_taxable: type.is_taxable === 1,
        amount: isPct ? "0" : String(type.default_value),
      };
      const nextAllowances = [...values.allowances, newEntry];
      const targetGross = Number(empGrossInput || grossPreview || 0);
      const computedBasic = calculateBasicFromGross(targetGross, nextAllowances);
      const finalAllowances = recalculateAllowancesForBasic(nextAllowances, computedBasic);

      setValues((prev) => ({
        ...prev,
        basic_salary: String(computedBasic),
        allowances: finalAllowances,
      }));
    } else {
      const basic = numOrZero(values.basic_salary);
      const resolvedAmount = isPct ? Math.round((type.default_value / 100) * basic) : type.default_value;
      const newEntry: EmployeeAllowanceFormEntry = {
        allowance_type_id: String(type.id),
        name: type.name,
        calculation_type: isPct ? "PERCENTAGE" : "FIXED",
        default_value: type.default_value,
        is_taxable: type.is_taxable === 1,
        amount: String(resolvedAmount),
      };
      setValues((prev) => ({ ...prev, allowances: [...prev.allowances, newEntry] }));
    }
    setPickerAllowanceId("");
  };

  const handleAllowanceAmountChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = e.target.value;
    const nextAllowances = values.allowances.map((a, i) => (i === index ? { ...a, amount } : a));
    const isVisiting = values.payment_type === PAYMENT_TYPE.VISITING_FACULTY;

    if (!isVisiting && empSalaryMode === "GROSS") {
      const targetGross = Number(empGrossInput || grossPreview || 0);
      const computedBasic = calculateBasicFromGross(targetGross, nextAllowances);
      const finalAllowances = recalculateAllowancesForBasic(nextAllowances, computedBasic);
      setValues((prev) => ({
        ...prev,
        basic_salary: String(computedBasic),
        allowances: finalAllowances,
      }));
    } else {
      setValues((prev) => ({ ...prev, allowances: nextAllowances }));
    }
  };

  const handleRemoveAllowance = (index: number) => {
    const nextAllowances = values.allowances.filter((_, i) => i !== index);
    const isVisiting = values.payment_type === PAYMENT_TYPE.VISITING_FACULTY;

    if (!isVisiting && empSalaryMode === "GROSS") {
      const targetGross = Number(empGrossInput || grossPreview || 0);
      const computedBasic = calculateBasicFromGross(targetGross, nextAllowances);
      const finalAllowances = recalculateAllowancesForBasic(nextAllowances, computedBasic);
      setValues((prev) => ({
        ...prev,
        basic_salary: String(computedBasic),
        allowances: finalAllowances,
      }));
    } else {
      setValues((prev) => ({ ...prev, allowances: nextAllowances }));
    }
  };

  const handleHourlyPayFieldChange = (field: "hours_worked" | "salary_per_hour") => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const nextVal = e.target.value;
    const nextHours = field === "hours_worked" ? numOrZero(nextVal) : numOrZero(values.hours_worked);
    const nextRate = field === "salary_per_hour" ? numOrZero(nextVal) : numOrZero(values.salary_per_hour);
    const nextHourlyBase = nextHours * nextRate;

    const updatedAllowances = values.allowances.map((a) => {
      const matchingType = allowanceTypes.find((t) => String(t.id) === a.allowance_type_id);
      const isPct =
        a.calculation_type === "PERCENTAGE" ||
        matchingType?.calculation_type === ALLOWANCE_CALCULATION_TYPE.PERCENTAGE;
      if (isPct) {
        const pct = a.default_value ?? matchingType?.default_value ?? 0;
        return {
          ...a,
          calculation_type: "PERCENTAGE" as const,
          default_value: pct,
          amount: String(Math.round((pct / 100) * nextHourlyBase)),
        };
      }
      return a;
    });

    setValues((prev) => ({
      ...prev,
      [field]: nextVal,
      allowances: updatedAllowances,
    }));
    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // ── Taxable base = Basic Salary + ONLY the taxable allowances, minus
  // Exempt Amount — matches resolveAutoTaxAmount()'s real taxableBase in
  // salary.service.ts exactly (basic_salary + taxableSum - exempt_amount).
  // This is deliberately narrower than Gross Pay above: a non-taxable
  // allowance still counts toward take-home pay, just not toward the tax
  // calculation. (Fixed Salary's conveyance/house_rent/medical_allowances
  // legacy fields have no is_taxable flag of their own and are excluded
  // here, same as on the backend — they only ever show up in Gross Pay.)
  const taxableBasePreview = Math.max(
    0,
    (isHourly ? hourlyBasePay : numOrZero(values.basic_salary)) +
      taxableAllowanceSum -
      numOrZero(values.exempt_amount)
  );

  // Manual tax_percentage always wins as an override, same rule as a
  // Salary Sheet's tax_amount — the slab preview only applies when it's
  // blank, so it never looks like this figure will silently be ignored.
  // Both branches share the same taxableBasePreview above, so switching
  // between manual % and the auto slab lookup never changes what the tax
  // is actually computed on.
  const taxPreview =
    values.tax_percentage.trim() !== ""
      ? Math.round((taxableBasePreview * Number(values.tax_percentage)) / 100)
      : calculatePreviewTax(taxableBasePreview, previewSlabs);

  // ── EOBI/EPF previews (client-side mirror of statutory-calculation.util.ts
  // on the backend) — used both to show the auto-calculated figure inside
  // each StatutoryAmountField below, and to feed the Net Salary preview
  // with the real number that will actually be saved when the field is
  // left blank (i.e. "auto-calculate"), not silently treated as 0.
  const autoEobiPreview = previewAutoEobi();
  const autoEpfPreview = previewAutoEpf(numOrZero(values.basic_salary));
  const effectiveEobiPreview =
    values.eobi_amount.trim() !== "" ? numOrZero(values.eobi_amount) : autoEobiPreview.amount;
  const effectiveEpfPreview =
    values.epf_amount.trim() !== "" ? numOrZero(values.epf_amount) : autoEpfPreview.amount;

  // ── Deductions = Tax + every other applicable deduction currently
  // captured on this form (EPF + EOBI). Add any future deduction field to
  // this single total so Net Salary always stays in sync automatically.
  const totalDeductionsPreview = Math.round(effectiveEpfPreview + effectiveEobiPreview + taxPreview);

  // ── Net Salary = Gross Pay − Total Deductions — the actual take-home
  // figure, following the same gross-minus-deductions logic as
  // computeTotals() in salary.service.ts (gross_before_adj − (epf + eobi +
  // tax)); this form has no arrears/loan/training/other-deduction fields,
  // so those terms are simply absent here rather than assumed to be zero
  // elsewhere.
  const netSalaryPreview = Math.round(grossPreview - totalDeductionsPreview);

  return (
    <form id={formId} onSubmit={handleSubmit} noValidate className="hr-form">
      <fieldset disabled={readOnly} className="hr-fieldset">
        {/* ── Basic Information ─────────────────────────────────────────── */}
        {show("basic") && (
          <>
            <h3 className="hr-form-section-title">Basic Information</h3>

            <div className="hr-form-grid">
              {mode === "create" ? (
                <FormField label="Employee ID" htmlFor="reg_no">
                  <input
                    id="reg_no"
                    className="field-input"
                    value="Auto-generated"
                    disabled
                    readOnly
                  />
                </FormField>
              ) : (
                <FormField label="Employee ID" htmlFor="reg_no" required error={err("reg_no")}>
                  <input
                    id="reg_no"
                    className={`field-input ${err("reg_no") ? "input-error" : ""}`}
                    value={values.reg_no}
                    onChange={handleChange("reg_no")}
                    placeholder="TR-2026-001"
                    disabled={disabled}
                  />
                </FormField>
              )}

              <FormField label="First Name" htmlFor="first_name" required error={err("first_name")}>
                <input
                  id="first_name"
                  className={`field-input ${err("first_name") ? "input-error" : ""}`}
                  value={values.first_name}
                  onChange={handleChange("first_name")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Last Name" htmlFor="last_name" error={err("last_name")}>
                <input
                  id="last_name"
                  className="field-input"
                  value={values.last_name}
                  onChange={handleChange("last_name")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Father's Name" htmlFor="father_name" error={err("father_name")}>
                <input
                  id="father_name"
                  className="field-input"
                  value={values.father_name}
                  onChange={handleChange("father_name")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Gender" htmlFor="gender" error={err("gender")}>
                <select
                  id="gender"
                  className="field-input hr-select"
                  value={values.gender}
                  onChange={handleChange("gender")}
                  disabled={disabled}
                >
                  <option value="">Select gender…</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="CNIC"
                htmlFor="cnic"
                required
                error={err("cnic")}
              >
                <input
                  id="cnic"
                  className={`field-input ${err("cnic") ? "input-error" : ""}`}
                  value={values.cnic}
                  onChange={handleChange("cnic")}
                  placeholder="12345-1234567-1"
                  disabled={disabled}
                />
              </FormField>

              <FormField label="CNIC Issue Date" htmlFor="cnic_issue_date" error={err("cnic_issue_date")}>
                <input
                  id="cnic_issue_date"
                  type="date"
                  className={`field-input ${err("cnic_issue_date") ? "input-error" : ""}`}
                  value={values.cnic_issue_date}
                  onChange={handleChange("cnic_issue_date")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="CNIC Expiry Date" htmlFor="cnic_expiry_date" error={err("cnic_expiry_date")}>
                <input
                  id="cnic_expiry_date"
                  type="date"
                  className={`field-input ${err("cnic_expiry_date") ? "input-error" : ""}`}
                  value={values.cnic_expiry_date}
                  onChange={handleChange("cnic_expiry_date")}
                  disabled={disabled}
                />
              </FormField>

              <FormField
                label="CNIC Attachment"
                htmlFor="cnic_attachment"
                hint="PDF, DOC, DOCX, JPG, PNG or WEBP — up to 5MB"
                error={cnicUploadError ?? undefined}
              >
                {!readOnly && (
                  <input
                    id="cnic_attachment"
                    type="file"
                    className="field-input"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                    onChange={handleCnicAttachmentSelect}
                    disabled={disabled || cnicUploading}
                  />
                )}
                {cnicUploading && <p className="hr-field-hint">Uploading…</p>}
                {!cnicUploading && values.cnic_attachment && (
                  <p className="hr-field-hint">
                    <IconPaperclip />{" "}
                    {(() => {
                      const attachmentUrl = resolveEmployeeFileUrl(values.cnic_attachment);
                      const fileName = values.cnic_attachment.split("/").pop();
                      return attachmentUrl ? (
                        <a href={attachmentUrl} target="_blank" rel="noreferrer">
                          {fileName}
                        </a>
                      ) : (
                        fileName
                      );
                    })()}{" "}
                    {!readOnly && (
                      <button
                        type="button"
                        className="hr-btn-linklike"
                        onClick={removeCnicAttachment}
                        disabled={disabled}
                      >
                        Remove
                      </button>
                    )}
                  </p>
                )}
                {!readOnly && !cnicUploading && !values.cnic_attachment && (
                  <p className="hr-field-hint">No file attached.</p>
                )}
              </FormField>
            </div>
          </>
        )}

        {/* ── Personal Details ─────────────────────────────────────────── */}
        {show("personal") && (
          <>
            <h3 className="hr-form-section-title">Personal Details</h3>
            <div className="hr-form-grid">
              <FormField label="Mother's Name" htmlFor="mother_name" error={err("mother_name")}>
                <input
                  id="mother_name"
                  className="field-input"
                  value={values.mother_name}
                  onChange={handleChange("mother_name")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Date of Birth" htmlFor="date_of_birth" error={err("date_of_birth")}>
                <input
                  id="date_of_birth"
                  className="field-input"
                  value={values.date_of_birth}
                  onChange={handleChange("date_of_birth")}
                  placeholder="YYYY-MM-DD"
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Marital Status" htmlFor="marital_status" error={err("marital_status")}>
                <input
                  id="marital_status"
                  className="field-input"
                  value={values.marital_status}
                  onChange={handleChange("marital_status")}
                  placeholder="e.g. Single"
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Blood Group" htmlFor="blood_group" error={err("blood_group")}>
                <input
                  id="blood_group"
                  className="field-input"
                  value={values.blood_group}
                  onChange={handleChange("blood_group")}
                  placeholder="e.g. O+"
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Nationality" htmlFor="nationality" error={err("nationality")}>
                <input
                  id="nationality"
                  className="field-input"
                  value={values.nationality}
                  onChange={handleChange("nationality")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Mother Tongue" htmlFor="mother_tongue" error={err("mother_tongue")}>
                <input
                  id="mother_tongue"
                  className="field-input"
                  value={values.mother_tongue}
                  onChange={handleChange("mother_tongue")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Disability" htmlFor="disability" error={err("disability")}>
                <select
                  id="disability"
                  className="field-input hr-select"
                  value={values.disability}
                  onChange={handleChange("disability")}
                  disabled={disabled}
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </FormField>

              {values.disability === "1" && (
                <FormField
                  label="Disability Description"
                  htmlFor="disability_description"
                  error={err("disability_description")}
                >
                  <input
                    id="disability_description"
                    className="field-input"
                    value={values.disability_description}
                    onChange={handleChange("disability_description")}
                    disabled={disabled}
                  />
                </FormField>
              )}
            </div>
          </>
        )}

        {/* ── Contact Info (Contact Details + Additional Contact) ────────── */}
        {show("contact") && (
          <>
            <h3 className="hr-form-section-title">Contact Details</h3>
            <div className="hr-form-grid">
              <FormField label="Email" htmlFor="email" required error={err("email")}>
                <input
                  id="email"
                  type="email"
                  className={`field-input ${err("email") ? "input-error" : ""}`}
                  value={values.email}
                  onChange={handleChange("email")}
                  placeholder="employee@techrive.com"
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Phone" htmlFor="mobile_1" required error={err("mobile_1")}>
                <input
                  id="mobile_1"
                  type="tel"
                  className={`field-input ${err("mobile_1") ? "input-error" : ""}`}
                  value={values.mobile_1}
                  onChange={handleChange("mobile_1")}
                  placeholder="0300-1234567"
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Secondary Phone" htmlFor="mobile_2" error={err("mobile_2")}>
                <input
                  id="mobile_2"
                  type="tel"
                  className={`field-input ${err("mobile_2") ? "input-error" : ""}`}
                  value={values.mobile_2}
                  onChange={handleChange("mobile_2")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="City" htmlFor="city" error={err("city")}>
                <input
                  id="city"
                  className="field-input"
                  value={values.city}
                  onChange={handleChange("city")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Country" htmlFor="country" error={err("country")}>
                <input
                  id="country"
                  className="field-input"
                  value={values.country}
                  onChange={handleChange("country")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Address" htmlFor="address" error={err("address")}>
                <textarea
                  id="address"
                  className="field-input hr-textarea"
                  value={values.address}
                  onChange={handleChange("address")}
                  disabled={disabled}
                  rows={2}
                />
              </FormField>
            </div>

            <h3 className="hr-form-section-title">Additional Contact</h3>
            <div className="hr-form-grid">
              <FormField label="Home Phone" htmlFor="home_phone" error={err("home_phone")}>
                <input
                  id="home_phone"
                  type="tel"
                  className={`field-input ${err("home_phone") ? "input-error" : ""}`}
                  value={values.home_phone}
                  onChange={handleChange("home_phone")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Personal Email" htmlFor="pemail" error={err("pemail")}>
                <input
                  id="pemail"
                  type="email"
                  className={`field-input ${err("pemail") ? "input-error" : ""}`}
                  value={values.pemail}
                  onChange={handleChange("pemail")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="State" htmlFor="state" error={err("state")}>
                <input
                  id="state"
                  className="field-input"
                  value={values.state}
                  onChange={handleChange("state")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Temporary Address" htmlFor="temp_address" error={err("temp_address")}>
                <input
                  id="temp_address"
                  className="field-input"
                  value={values.temp_address}
                  onChange={handleChange("temp_address")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Temporary State" htmlFor="temp_state" error={err("temp_state")}>
                <input
                  id="temp_state"
                  className="field-input"
                  value={values.temp_state}
                  onChange={handleChange("temp_state")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Temporary Country" htmlFor="temp_country" error={err("temp_country")}>
                <input
                  id="temp_country"
                  className="field-input"
                  value={values.temp_country}
                  onChange={handleChange("temp_country")}
                  disabled={disabled}
                />
              </FormField>
            </div>
          </>
        )}

        {/* ── Employment Info ──────────────────────────────────────────── */}
        {show("employment") && (
          <>
            <h3 className="hr-form-section-title">Employment Details</h3>
            <div className="hr-form-grid">
              <FormField label="School" htmlFor="company_id" required error={err("company_id")}>
                <select
                  id="company_id"
                  className={`field-input hr-select ${err("company_id") ? "input-error" : ""}`}
                  value={values.company_id}
                  onChange={handleChange("company_id")}
                  disabled={disabled}
                >
                  <option value="">Select school…</option>
                  {lookups.companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Campus" htmlFor="branch_id" required error={err("branch_id")}>
                <select
                  id="branch_id"
                  className={`field-input hr-select ${err("branch_id") ? "input-error" : ""}`}
                  value={values.branch_id}
                  onChange={handleChange("branch_id")}
                  disabled={disabled}
                >
                  <option value="">Select campus…</option>
                  {scopedBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Department"
                htmlFor="department_id"
                required
                error={err("department_id")}
                hint={!values.branch_id ? "Select a campus first" : undefined}
              >
                <select
                  id="department_id"
                  className={`field-input hr-select ${err("department_id") ? "input-error" : ""}`}
                  value={values.department_id}
                  onChange={handleChange("department_id")}
                  disabled={disabled || !values.branch_id}
                >
                  <option value="">Select department…</option>
                  {scopedDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Designation" htmlFor="designation" required error={err("designation")}>
                <select
                  id="designation"
                  className={`field-input hr-select ${err("designation") ? "input-error" : ""}`}
                  value={values.designation}
                  onChange={handleChange("designation")}
                  disabled={disabled}
                >
                  <option value="">Select designation…</option>
                  {lookups.designations.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Staff Type" htmlFor="staff_type" required error={err("staff_type")}>
                <select
                  id="staff_type"
                  className={`field-input hr-select ${err("staff_type") ? "input-error" : ""}`}
                  value={values.staff_type}
                  onChange={handleChange("staff_type")}
                  disabled={disabled}
                >
                  <option value="">Select staff type…</option>
                  {lookups.staffTypes.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Joining Date" htmlFor="join_date" required error={err("join_date")}>
                <input
                  id="join_date"
                  type="date"
                  className={`field-input ${err("join_date") ? "input-error" : ""}`}
                  value={values.join_date}
                  onChange={handleChange("join_date")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Qualification" htmlFor="qualification" error={err("qualification")}>
                <input
                  id="qualification"
                  className="field-input"
                  value={values.qualification}
                  onChange={handleChange("qualification")}
                  disabled={disabled}
                />
              </FormField>

              {mode === "edit" && (
                <FormField label="Status" htmlFor="status" error={err("status")}>
                  <select
                    id="status"
                    className="field-input hr-select"
                    value={values.status}
                    onChange={handleChange("status")}
                    disabled={disabled}
                  >
                    <option value={EMPLOYEE_STATUS.ACTIVE}>Active</option>
                    <option value={EMPLOYEE_STATUS.INACTIVE}>Inactive</option>
                  </select>
                </FormField>
              )}
            </div>
          </>
        )}

        {/* ── Professional Profile ─────────────────────────────────────── */}
        {show("professional") && (
          <>
            <h3 className="hr-form-section-title">Professional Profile</h3>
            <div className="hr-form-grid">
              <FormField label="NTN" htmlFor="ntn" error={err("ntn")}>
                <input
                  id="ntn"
                  className="field-input"
                  value={values.ntn}
                  onChange={handleChange("ntn")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Skill" htmlFor="skill" error={err("skill")}>
                <input
                  id="skill"
                  className="field-input"
                  value={values.skill}
                  onChange={handleChange("skill")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Experience" htmlFor="experience" error={err("experience")}>
                <input
                  id="experience"
                  className="field-input"
                  value={values.experience}
                  onChange={handleChange("experience")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Job Status" htmlFor="job_status" error={err("job_status")}>
                <input
                  id="job_status"
                  className="field-input"
                  value={values.job_status}
                  onChange={handleChange("job_status")}
                  placeholder="e.g. Permanent"
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Probation" htmlFor="probation" error={err("probation")}>
                <input
                  id="probation"
                  className="field-input"
                  value={values.probation}
                  onChange={handleChange("probation")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Contract Start" htmlFor="start_day_contract" error={err("start_day_contract")}>
                <input
                  id="start_day_contract"
                  className="field-input"
                  value={values.start_day_contract}
                  onChange={handleChange("start_day_contract")}
                  placeholder="YYYY-MM-DD"
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Contract End" htmlFor="end_day_contract" error={err("end_day_contract")}>
                <input
                  id="end_day_contract"
                  className="field-input"
                  value={values.end_day_contract}
                  onChange={handleChange("end_day_contract")}
                  placeholder="YYYY-MM-DD"
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Expiry Date" htmlFor="expiry_date" error={err("expiry_date")}>
                <input
                  id="expiry_date"
                  type="date"
                  className={`field-input ${err("expiry_date") ? "input-error" : ""}`}
                  value={values.expiry_date}
                  onChange={handleChange("expiry_date")}
                  disabled={disabled}
                />
              </FormField>

              <FormField
                label="First Registration Code"
                htmlFor="first_registration_code"
                error={err("first_registration_code")}
              >
                <input
                  id="first_registration_code"
                  className="field-input"
                  value={values.first_registration_code}
                  onChange={handleChange("first_registration_code")}
                  disabled={disabled}
                />
              </FormField>

              <FormField
                label="Reports To (Employee ID)"
                htmlFor="reports_to"
                error={err("reports_to")}
              >
                <input
                  id="reports_to"
                  inputMode="numeric"
                  className={`field-input ${err("reports_to") ? "input-error" : ""}`}
                  value={values.reports_to}
                  onChange={handleChange("reports_to")}
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Other Info" htmlFor="other_info" error={err("other_info")}>
                <textarea
                  id="other_info"
                  className="field-input hr-textarea"
                  value={values.other_info}
                  onChange={handleChange("other_info")}
                  disabled={disabled}
                  rows={2}
                />
              </FormField>
            </div>
          </>
        )}

        {/* ── Salary ────────────────────────────────────────────────────── */}
        {show("salary") && (
          <>
            <h3 className="hr-form-section-title">Salary Structure</h3>
            <div className="hr-form-grid">
              <FormField
                label="Payment Type"
                htmlFor="payment_type"
                required
                error={err("payment_type")}
              >
                <select
                  id="payment_type"
                  className="field-input hr-select"
                  value={values.payment_type}
                  onChange={handleChange("payment_type")}
                  disabled={disabled}
                >
                  {PAYMENT_TYPE_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {PAYMENT_TYPE_LABELS[p]}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Bank Account" htmlFor="bank_account" error={err("bank_account")}>
                <input
                  id="bank_account"
                  className="field-input"
                  value={values.bank_account}
                  onChange={handleChange("bank_account")}
                  placeholder="e.g. PK00BANK0000000000000000"
                  disabled={disabled}
                />
              </FormField>
            </div>

            {values.payment_type === PAYMENT_TYPE.VISITING_FACULTY ? (
              <>
                <h3 className="hr-form-section-title">Hourly Pay</h3>
                <div className="hr-form-grid">
                  <FormField
                    label="Hours Worked"
                    htmlFor="hours_worked"
                    error={err("hours_worked")}
                  >
                    <input
                      id="hours_worked"
                      inputMode="numeric"
                      min={0}
                      step="0.5"
                      className={`field-input ${err("hours_worked") ? "input-error" : ""}`}
                      value={values.hours_worked}
                      onChange={handleHourlyPayFieldChange("hours_worked")}
                      disabled={disabled}
                      placeholder="0"
                    />
                  </FormField>

                  <FormField label="Rate per Hour" htmlFor="salary_per_hour" error={err("salary_per_hour")}>
                    <input
                      id="salary_per_hour"
                      inputMode="numeric"
                      min={0}
                      step="0.01"
                      className={`field-input ${err("salary_per_hour") ? "input-error" : ""}`}
                      value={values.salary_per_hour}
                      onChange={handleHourlyPayFieldChange("salary_per_hour")}
                      disabled={disabled}
                      placeholder="0"
                    />
                  </FormField>
                </div>
              </>
            ) : (
              <>
                <h3 className="hr-form-section-title">Monthly Salary Structure</h3>

                {!readOnly && (
                  <div className="hr-salary-mode-card">
                    <div className="hr-salary-mode-header">
                      <div className="hr-salary-mode-title-group">
                        <span className="hr-salary-mode-title">Salary Calculation Method:</span>
                      </div>
                      <div className="hr-salary-segmented-control" role="group" aria-label="Salary Calculation Method">
                        <button
                          type="button"
                          className={`hr-salary-segmented-btn ${empSalaryMode === "BASIC" ? "hr-salary-segmented-btn-active" : ""}`}
                          onClick={() => handleEmpSalaryModeSwitch("BASIC")}
                          disabled={disabled}
                        >
                          By Basic Salary
                        </button>
                        <button
                          type="button"
                          className={`hr-salary-segmented-btn ${empSalaryMode === "GROSS" ? "hr-salary-segmented-btn-active" : ""}`}
                          onClick={() => handleEmpSalaryModeSwitch("GROSS")}
                          disabled={disabled}
                        >
                          By Gross Salary
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="hr-form-grid">
                  {empSalaryMode === "BASIC" || readOnly ? (
                    <>
                      <FormField
                        label="Basic Salary"
                        htmlFor="basic_salary"
                        error={err("basic_salary")}
                        hint={readOnly ? undefined : "Base salary figure"}
                      >
                        <input
                          id="basic_salary"
                          inputMode="numeric"
                          min={0}
                          className={`field-input ${err("basic_salary") ? "input-error" : ""}`}
                          value={values.basic_salary}
                          onChange={handleEmpBasicSalaryChange}
                          disabled={disabled}
                          placeholder="0"
                        />
                      </FormField>

                      <FormField
                        label="Gross Salary (Calculated)"
                        htmlFor="emp_gross_preview"
                        hint="Basic Salary + All Allowances"
                      >
                        <input
                          id="emp_gross_preview"
                          className="field-input"
                          value={grossPreview}
                          disabled
                          readOnly
                        />
                      </FormField>
                    </>
                  ) : (
                    <>
                      <FormField
                        label="Basic Salary (Calculated)"
                        htmlFor="basic_salary"
                        hint="Reverse-calculated from Gross Salary based on allowances"
                        error={err("basic_salary")}
                      >
                        <input
                          id="basic_salary"
                          className="field-input"
                          value={values.basic_salary || 0}
                          disabled
                          readOnly
                        />
                      </FormField>

                      <FormField
                        label="Target Gross Salary"
                        htmlFor="emp_target_gross"
                        hint="Enter total gross salary to reverse-calculate basic pay"
                      >
                        <input
                          id="emp_target_gross"
                          inputMode="numeric"
                          min={0}
                          className="field-input"
                          value={empGrossInput}
                          onChange={handleEmpGrossSalaryChange}
                          disabled={disabled}
                          placeholder="0"
                        />
                      </FormField>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Allowances */}
            <h4 className="hr-form-section-title">Allowances</h4>

            {values.allowances.length > 0 && (
              <div className="hr-table-wrap" style={{ marginBottom: "0.75rem" }}>
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Allowance</th>
                      <th>Type</th>
                      <th>Taxable</th>
                      <th>Amount (Rs.)</th>
                      {!readOnly && <th className="hr-table-actions-col">Remove</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {values.allowances.map((entry, index) => (
                      <tr key={entry.allowance_type_id}>
                        <td style={{ fontWeight: 600 }}>{entry.name}</td>
                        <td>
                          <span className="hr-badge hr-badge-muted">
                            {entry.calculation_type === "PERCENTAGE"
                              ? `${entry.default_value ?? ""}% of Basic`
                              : "Fixed"}
                          </span>
                        </td>
                        <td>
                          <span className={`hr-badge ${entry.is_taxable ? "hr-badge-muted" : "hr-badge-success"}`}>
                            {entry.is_taxable ? "Taxable" : "Non-Taxable"}
                          </span>
                        </td>
                        <td>
                          <input
                            inputMode="numeric"
                            min={0}
                            step="0.01"
                            className="field-input"
                            value={entry.amount}
                            onChange={handleAllowanceAmountChange(index)}
                            disabled={disabled}
                            style={{ maxWidth: 140 }}
                          />
                        </td>
                        {!readOnly && (
                          <td>
                            <button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn"
                              aria-label={`Remove ${entry.name}`}
                              onClick={() => handleRemoveAllowance(index)}
                              disabled={disabled}
                            >
                              ✕
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!readOnly && (
              <div className="hr-salary-add-allowance-bar">
                <div className="hr-salary-add-allowance-select">
                  <FormField label="Add Allowance" htmlFor="salary-allowance-picker">
                    <select
                      id="salary-allowance-picker"
                      className="field-input hr-select"
                      value={pickerAllowanceId}
                      onChange={(e) => setPickerAllowanceId(e.target.value)}
                      disabled={disabled || availableAllowanceTypes.length === 0}
                    >
                      <option value="">
                        {availableAllowanceTypes.length === 0 ? "No more allowance types available" : "Select allowance type…"}
                      </option>
                      {availableAllowanceTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.calculation_type === ALLOWANCE_CALCULATION_TYPE.PERCENTAGE ? `${t.default_value}%` : `Rs. ${t.default_value}`})
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
                <button
                  type="button"
                  className="hr-btn hr-btn-secondary"
                  onClick={handleAddAllowance}
                  disabled={disabled || !pickerAllowanceId}
                  style={{ height: "42px", marginBottom: "2px" }}
                >
                  + Add Allowance
                </button>
              </div>
            )}

            {/* Tax & Deductions */}
            <h4 className="hr-form-section-title">Tax &amp; Deductions</h4>
            <div className="hr-form-grid">
              <FormField label="Fiscal Year (for preview)" htmlFor="salary_preview_fy">
                <select
                  id="salary_preview_fy"
                  className="field-input hr-select"
                  value={previewFiscalYearId ?? ""}
                  onChange={(e) => setPreviewFiscalYearId(e.target.value === "" ? null : Number(e.target.value))}
                  disabled={disabled || fiscalYears.length === 0}
                >
                  {fiscalYears.length === 0 && <option value="">No fiscal years configured</option>}
                  {fiscalYears.map((fy) => (
                    <option key={fy.id} value={fy.id}>{fy.name}</option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Exempt Amount"
                htmlFor="exempt_amount"
                error={err("exempt_amount")}
              >
                <input
                  id="exempt_amount"
                  inputMode="numeric"
                  min={0}
                  className={`field-input ${err("exempt_amount") ? "input-error" : ""}`}
                  value={values.exempt_amount}
                  onChange={handleChange("exempt_amount")}
                  placeholder="0"
                  disabled={disabled}
                />
              </FormField>

              <FormField label="Estimated Monthly Tax (Auto)" htmlFor="salary_tax_preview" hint="Calculated based on taxable base & fiscal year slabs">
                <input id="salary_tax_preview" className="field-input" value={taxPreview} disabled readOnly />
              </FormField>

              <FormField
                label="Tax Percentage (Manual Override %)"
                htmlFor="tax_percentage"
                error={err("tax_percentage")}
                hint="Overrides slab auto-calculation if provided"
              >
                <input
                  id="tax_percentage"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  className={`field-input ${err("tax_percentage") ? "input-error" : ""}`}
                  value={values.tax_percentage}
                  onChange={handleChange("tax_percentage")}
                  placeholder="Optional % override"
                  disabled={disabled}
                />
              </FormField>

              <StatutoryAmountField
                label="EPF Amount"
                htmlFor="epf_amount"
                value={values.epf_amount}
                onChange={(v) => setValues((prev) => ({ ...prev, epf_amount: v }))}
                autoAmount={autoEpfPreview.amount}
                breakdown={autoEpfPreview.breakdown}
                disabled={disabled}
                error={err("epf_amount")}
              />

              <StatutoryAmountField
                label="EOBI Amount"
                htmlFor="eobi_amount"
                value={values.eobi_amount}
                onChange={(v) => setValues((prev) => ({ ...prev, eobi_amount: v }))}
                autoAmount={autoEobiPreview.amount}
                breakdown={autoEobiPreview.breakdown}
                disabled={disabled}
                error={err("eobi_amount")}
              />
            </div>

            {/* Salary Summary */}
            <h3 className="hr-form-section-title">Salary Summary</h3>
            <div className="hr-salary-summary-cards">
              <div className="hr-salary-summary-card">
                <span className="hr-salary-summary-card-label">Gross Pay</span>
                <span className="hr-salary-summary-card-value">Rs. {grossPreview.toLocaleString()}</span>
                <span className="hr-salary-summary-card-sub">Basic + Allowances</span>
                <input
                  id="salary_summary_gross_pay"
                  type="hidden"
                  value={grossPreview}
                />
              </div>

              <div className="hr-salary-summary-card">
                <span className="hr-salary-summary-card-label">Total Deductions</span>
                <span className="hr-salary-summary-card-value">Rs. {totalDeductionsPreview.toLocaleString()}</span>
                <span className="hr-salary-summary-card-sub">Tax + EPF + EOBI</span>
                <input
                  id="salary_summary_deductions"
                  type="hidden"
                  value={totalDeductionsPreview}
                />
              </div>

              <div className="hr-salary-summary-card hr-salary-summary-card-net">
                <span className="hr-salary-summary-card-label">Estimated Net Salary</span>
                <span className="hr-salary-summary-card-value">Rs. {netSalaryPreview.toLocaleString()}</span>
                <span className="hr-salary-summary-card-sub">Estimated Take-Home</span>
                <input
                  id="salary_summary_net_salary"
                  type="hidden"
                  value={netSalaryPreview}
                />
              </div>
            </div>
          </>
        )}
      </fieldset>
    </form>
  );
};

export default EmployeeForm;

import React, { useMemo, useState } from "react";
import FormField from "./FormField";
import StatutoryAmountField from "./StatutoryAmountField";
import { previewAutoEobi, previewAutoEpf } from "../utils/statutoryCalculation";
import {
  computeBasicFromGross,
  computePreviewGrossSalary,
  computePreviewTaxableBase,
  isFormValid,
  recalculatePercentageAllowances,
  validateSalaryForm,
} from "../services/salary.validation";
import { EMPTY_SALARY_FORM_VALUES, MONTH_OPTIONS, PAY_STATUS, SALARY_STATUS } from "../services/salary.types";
import type { SalaryAllowanceFormEntry, SalaryFormValues } from "../services/salary.types";
import type { LookupOption } from "../services/employee.types";
import { useFiscalYearLookup } from "../hooks/useFiscalYears";
import { useTaxSlabsForFiscalYear } from "../hooks/useTaxSlabs";
import { buildTaxPreviewBreakdown } from "../services/taxSlab.validation";
import { useAllowanceTypeLookup } from "../hooks/useAllowanceTypes";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { ALLOWANCE_CALCULATION_TYPE } from "../services/allowanceType.types";
import { employeeAPI } from "../services/employee.service";

interface SalaryFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: SalaryFormValues;
  staff: LookupOption[];
  submitting: boolean;
  serverErrors?: Record<string, string>;
  onSubmit: (values: SalaryFormValues) => void;
  onCancel: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// net_salary/total_salary/remaining_amount are computed server-side from
// these inputs (see salary.service.ts's computeTotals()) — not editable
// here. The approval chain (accountant/dgm/gm/ceo/principal) is a separate
// action, managed from SalaryApprovalModal.tsx instead of this form.
//
// Allowances & Auto Tax Calculation (2026-08-14): when at least one
// allowance is picked below, Gross Salary becomes a read-only live preview
// (basic + fixed allowances + picked allowances) computed server-side on
// save — see salary.constants.ts. Tax Amount stays editable as a manual
// override; leaving it blank lets the server auto-calculate it from the
// selected Fiscal Year's tax slabs against the taxable base shown below.
const SalaryFormModal: React.FC<SalaryFormModalProps> = ({
  open,
  mode,
  initialValues,
  staff,
  submitting,
  serverErrors = {},
  onSubmit,
  onCancel,
}) => {
  const [values, setValues] = useState<SalaryFormValues>(initialValues ?? EMPTY_SALARY_FORM_VALUES);
  const [calcMode, setCalcMode] = useState<"BASIC" | "GROSS">(initialValues?.calculation_mode ?? "BASIC");
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const [pickerAllowanceId, setPickerAllowanceId] = useState("");

  // Company → Branch cascade (see the Company→Branch scoping task). The
  // record only stores branch_id, so companyId is local UI-only state.
  // Edit mode has no stored company_id to prefill, so default to the
  // legacy full list (undefined) rather than empty/gated — otherwise the
  // existing branch selection would vanish from the dropdown.
  const [companyId, setCompanyId] = useState<number | null | undefined>(
    mode === "edit" ? undefined : null
  );
  const { companies } = useCompanyLookup();
  const { branches } = useBranchesLookup(companyId);

  const { fiscalYears } = useFiscalYearLookup();
  const { allowanceTypes } = useAllowanceTypeLookup();
  // Must be called unconditionally, before the `if (!open) return null`
  // below — moved up here rather than alongside the other tax-preview
  // calculations further down, which are plain functions, not hooks.
  const { slabs: fiscalYearSlabs } = useTaxSlabsForFiscalYear(
    values.financial_year ? Number(values.financial_year) : null
  );

  const availableAllowanceTypes = useMemo(
    () => allowanceTypes.filter((t) => !values.allowances.some((a) => a.allowance_type_id === String(t.id))),
    [allowanceTypes, values.allowances]
  );

  if (!open) return null;

  const errors = { ...clientErrors, ...serverErrors };
  const err = (field: keyof SalaryFormValues) => errors[field];

  const handleChange = (
    field: keyof SalaryFormValues
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const nextValue = e.target.value;
    setValues((prev) => ({ ...prev, [field]: nextValue }));
    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleModeSwitch = (newMode: "BASIC" | "GROSS") => {
    setCalcMode(newMode);
    setValues((prev) => {
      const updated = { ...prev, calculation_mode: newMode };
      if (newMode === "GROSS") {
        const grossVal = Number(prev.gross_salary || 0);
        if (!grossVal || grossVal === 0) {
          const preview = computePreviewGrossSalary(prev);
          updated.gross_salary = String(preview || "");
        }
      } else {
        const basicVal = Number(prev.basic_salary || 0);
        if (!basicVal || basicVal === 0) {
          const basic = computeBasicFromGross(Number(prev.gross_salary || 0), prev.allowances, {
            medical: Number(prev.medical_allowance || 0),
            houseRent: Number(prev.house_rent_allowance || 0),
            conveyance: Number(prev.conveyance_allowance || 0),
            arrears: Number(prev.arrears || 0),
          });
          updated.basic_salary = String(basic || "");
          updated.allowances = recalculatePercentageAllowances(prev.allowances, basic);
        }
      }
      return updated;
    });
    setClientErrors((prev) => {
      const next = { ...prev };
      delete next.basic_salary;
      delete next.gross_salary;
      return next;
    });
  };

  const handleBasicSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextBasic = e.target.value;
    const numBasic = Number(nextBasic || 0);

    let nextAllowances = [...values.allowances];
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

    setValues((prev) => {
      const updatedAllowances = recalculatePercentageAllowances(nextAllowances, numBasic);
      const updated = {
        ...prev,
        basic_salary: nextBasic,
        allowances: updatedAllowances,
      };
      const gross = computePreviewGrossSalary(updated);
      return {
        ...updated,
        gross_salary: String(gross),
      };
    });
    setClientErrors((prev) => {
      if (!("basic_salary" in prev)) return prev;
      const next = { ...prev };
      delete next.basic_salary;
      return next;
    });
  };

  const handleGrossSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextGross = e.target.value;
    const numGross = Number(nextGross || 0);

    let nextAllowances = [...values.allowances];
    const isFirstEntry = numGross > 0 && (!values.gross_salary || Number(values.gross_salary) === 0);
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

    setValues((prev) => {
      const computedBasic = computeBasicFromGross(numGross, nextAllowances, {
        medical: Number(prev.medical_allowance || 0),
        houseRent: Number(prev.house_rent_allowance || 0),
        conveyance: Number(prev.conveyance_allowance || 0),
        arrears: Number(prev.arrears || 0),
      });
      const updatedAllowances = recalculatePercentageAllowances(nextAllowances, computedBasic);
      return {
        ...prev,
        gross_salary: nextGross,
        basic_salary: String(computedBasic),
        allowances: updatedAllowances,
      };
    });
    setClientErrors((prev) => {
      if (!("gross_salary" in prev)) return prev;
      const next = { ...prev };
      delete next.gross_salary;
      return next;
    });
  };

  const handleAddAllowance = () => {
    if (!pickerAllowanceId) return;
    const type = allowanceTypes.find((t) => String(t.id) === pickerAllowanceId);
    if (!type) return;

    const isPct = type.calculation_type === ALLOWANCE_CALCULATION_TYPE.PERCENTAGE;

    if (calcMode === "BASIC") {
      const basic = Number(values.basic_salary || 0);
      const resolvedAmount = isPct
        ? Math.round((type.default_value / 100) * basic)
        : type.default_value;

      const newEntry: SalaryAllowanceFormEntry = {
        allowance_type_id: String(type.id),
        name: type.name,
        calculation_type: isPct ? "PERCENTAGE" : "FIXED",
        default_value: type.default_value,
        is_taxable: type.is_taxable === 1,
        amount: String(resolvedAmount),
      };
      const nextAllowances = [...values.allowances, newEntry];
      setValues((prev) => {
        const updated = { ...prev, allowances: nextAllowances };
        const gross = computePreviewGrossSalary(updated);
        return { ...updated, gross_salary: String(gross) };
      });
    } else {
      const newEntry: SalaryAllowanceFormEntry = {
        allowance_type_id: String(type.id),
        name: type.name,
        calculation_type: isPct ? "PERCENTAGE" : "FIXED",
        default_value: type.default_value,
        is_taxable: type.is_taxable === 1,
        amount: isPct ? "0" : String(type.default_value),
      };
      const nextAllowances = [...values.allowances, newEntry];
      const numGross = Number(values.gross_salary || 0);
      const computedBasic = computeBasicFromGross(numGross, nextAllowances, {
        medical: Number(values.medical_allowance || 0),
        houseRent: Number(values.house_rent_allowance || 0),
        conveyance: Number(values.conveyance_allowance || 0),
        arrears: Number(values.arrears || 0),
      });
      const finalAllowances = recalculatePercentageAllowances(nextAllowances, computedBasic);
      setValues((prev) => ({
        ...prev,
        basic_salary: String(computedBasic),
        allowances: finalAllowances,
      }));
    }
    setPickerAllowanceId("");
  };

  const handleAllowanceAmountChange = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = e.target.value;
    const nextAllowances = values.allowances.map((a, i) => (i === index ? { ...a, amount } : a));
    if (calcMode === "GROSS") {
      const numGross = Number(values.gross_salary || 0);
      const computedBasic = computeBasicFromGross(numGross, nextAllowances, {
        medical: Number(values.medical_allowance || 0),
        houseRent: Number(values.house_rent_allowance || 0),
        conveyance: Number(values.conveyance_allowance || 0),
        arrears: Number(values.arrears || 0),
      });
      const finalAllowances = recalculatePercentageAllowances(nextAllowances, computedBasic);
      setValues((prev) => ({
        ...prev,
        basic_salary: String(computedBasic),
        allowances: finalAllowances,
      }));
    } else {
      setValues((prev) => {
        const updated = { ...prev, allowances: nextAllowances };
        const gross = computePreviewGrossSalary(updated);
        return { ...updated, gross_salary: String(gross) };
      });
    }
    setClientErrors((prev) => {
      const key = `allowances.${index}.amount`;
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleRemoveAllowance = (index: number) => {
    const nextAllowances = values.allowances.filter((_, i) => i !== index);
    if (calcMode === "GROSS") {
      const numGross = Number(values.gross_salary || 0);
      const computedBasic = computeBasicFromGross(numGross, nextAllowances, {
        medical: Number(values.medical_allowance || 0),
        houseRent: Number(values.house_rent_allowance || 0),
        conveyance: Number(values.conveyance_allowance || 0),
        arrears: Number(values.arrears || 0),
      });
      const finalAllowances = recalculatePercentageAllowances(nextAllowances, computedBasic);
      setValues((prev) => ({
        ...prev,
        basic_salary: String(computedBasic),
        allowances: finalAllowances,
      }));
    } else {
      setValues((prev) => {
        const updated = { ...prev, allowances: nextAllowances };
        const gross = computePreviewGrossSalary(updated);
        return { ...updated, gross_salary: String(gross) };
      });
    }
  };

  const handleStaffChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const staffId = e.target.value;
    setValues((prev) => ({ ...prev, staff_id: staffId }));
    setClientErrors((prev) => {
      const next = { ...prev };
      delete next.staff_id;
      return next;
    });
    if (!staffId || mode !== "create") return;

    try {
      const empRes = await employeeAPI.getById(Number(staffId));
      if (empRes?.data) {
        const emp = empRes.data;
        const initialBasic = emp.basic_salary != null ? String(emp.basic_salary) : "";
        const empAllowances: SalaryAllowanceFormEntry[] = (emp.allowances || []).map((ea) => {
          const matchingType = allowanceTypes.find((t) => t.id === ea.allowance_type_id);
          const isPct = matchingType?.calculation_type === ALLOWANCE_CALCULATION_TYPE.PERCENTAGE;
          return {
            allowance_type_id: String(ea.allowance_type_id),
            name: ea.name,
            calculation_type: isPct ? "PERCENTAGE" : "FIXED",
            default_value: matchingType?.default_value ?? ea.amount,
            is_taxable: ea.is_taxable,
            amount: String(ea.amount),
          };
        });

        setValues((prev) => {
          const nextVal = {
            ...prev,
            staff_id: staffId,
            branch_id: emp.branch_id != null ? String(emp.branch_id) : prev.branch_id,
            bank_account: emp.bank_account ?? prev.bank_account,
            basic_salary: initialBasic || prev.basic_salary,
            allowances: empAllowances.length > 0 ? empAllowances : prev.allowances,
          };
          const gross = computePreviewGrossSalary(nextVal);
          return { ...nextVal, gross_salary: String(gross) };
        });
      }
    } catch {
      // Ignore prefill error
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formPayload: SalaryFormValues = {
      ...values,
      calculation_mode: calcMode,
      gross_salary: calcMode === "BASIC" ? String(computePreviewGrossSalary(values)) : values.gross_salary,
    };
    const validationErrors = validateSalaryForm(formPayload);
    setClientErrors(validationErrors);
    if (isFormValid(validationErrors)) {
      onSubmit(formPayload);
    }
  };

  const numberField = (
    field: keyof SalaryFormValues,
    label: string,
    id: string,
    required = false
  ) => (
    <FormField label={label} htmlFor={id} required={required} error={err(field)}>
      <input
        id={id}
        inputMode="numeric"
        className={`field-input ${err(field) ? "input-error" : ""}`}
        value={values[field] as string}
        onChange={handleChange(field)}
        placeholder="0"
        disabled={submitting}
      />
    </FormField>
  );

  // ── EOBI/EPF previews (client-side mirror of the backend formula) —
  // shown inside each StatutoryAmountField below while the field is blank
  // (i.e. left to auto-calculate on save).
  const autoEobiPreview = previewAutoEobi();
  const autoEpfPreview = previewAutoEpf(Number(values.basic_salary || 0));

  const hasAllowances = values.allowances.length > 0;
  const previewGross = hasAllowances ? computePreviewGrossSalary(values) : null;
  const previewTaxableBase = computePreviewTaxableBase(values);

  // Tax preview — same StatutoryAmountField treatment as EOBI/EPF, fed by
  // the real tax slabs for whichever Fiscal Year is currently selected
  // (fiscalYearSlabs is fetched above, before the early return, since
  // useTaxSlabsForFiscalYear is a real hook and can't be called down here).
  const basicForTax = Number(values.basic_salary || 0);
  const taxableAllowanceSumPreview = values.allowances
    .filter((a) => a.is_taxable)
    .reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const autoTaxPreview = buildTaxPreviewBreakdown(
    {
      basic_salary: basicForTax,
      taxable_allowance_sum: taxableAllowanceSumPreview,
      exempt_amount: Number(values.exempt_amount || 0),
    },
    fiscalYearSlabs
  );

  return (
    <div
      className="hr-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onCancel();
      }}
    >
      <div className="hr-modal hr-modal-form hr-modal-form-wide" role="dialog" aria-modal="true" aria-labelledby="salary-modal-title">
        <button type="button" className="hr-modal-close" onClick={onCancel} disabled={submitting} aria-label="Close">
          <IconClose />
        </button>

        <h3 id="salary-modal-title" className="hr-modal-title hr-modal-title-left">
          {mode === "create" ? "Generate Salary Sheet" : "Edit Salary Sheet"}
        </h3>

        <form onSubmit={handleSubmit} noValidate>
          <h4 className="hr-form-section-title">Assignment</h4>
          <div className="hr-form-grid">
            <FormField label="Employee" htmlFor="sal-staff" required error={err("staff_id")}>
              <select
                id="sal-staff"
                className={`field-input hr-select ${err("staff_id") ? "input-error" : ""}`}
                value={values.staff_id}
                onChange={handleStaffChange}
                disabled={submitting || mode === "edit"}
              >
                <option value="">Select employee…</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="School / University" htmlFor="sal-company">
              <select
                id="sal-company"
                className="field-input hr-select"
                value={companyId ?? ""}
                onChange={(e) => {
                  setCompanyId(e.target.value ? Number(e.target.value) : null);
                  // A branch from the old company is no longer valid/visible — clear it.
                  setValues((prev) => ({ ...prev, branch_id: "" }));
                }}
                disabled={submitting || mode === "edit"}
              >
                <option value="">Select school / university…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Campus" htmlFor="sal-branch" required error={err("branch_id")}>
              <select
                id="sal-branch"
                className={`field-input hr-select ${err("branch_id") ? "input-error" : ""}`}
                value={values.branch_id}
                onChange={handleChange("branch_id")}
                disabled={submitting || mode === "edit" || companyId === null}
              >
                <option value="">{companyId === null ? "Select a school / university first…" : "Select campus…"}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Month" htmlFor="sal-month" required error={err("month_id")}>
              <select
                id="sal-month"
                className={`field-input hr-select ${err("month_id") ? "input-error" : ""}`}
                value={values.month_id}
                onChange={handleChange("month_id")}
                disabled={submitting || mode === "edit"}
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Year" htmlFor="sal-year" required error={err("year_id")}>
              <input
                id="sal-year" inputMode="numeric"
                className={`field-input ${err("year_id") ? "input-error" : ""}`}
                value={values.year_id} onChange={handleChange("year_id")}
                disabled={submitting || mode === "edit"}
              />
            </FormField>

            <FormField label="Date" htmlFor="sal-date" required error={err("date")}>
              <input
                id="sal-date" type="date"
                className={`field-input ${err("date") ? "input-error" : ""}`}
                value={values.date} onChange={handleChange("date")}
                disabled={submitting}
              />
            </FormField>

            <FormField
              label="Ledger ID" htmlFor="sal-ledger" required error={err("ledger_id")}
            >
              <input
                id="sal-ledger" inputMode="numeric"
                className={`field-input ${err("ledger_id") ? "input-error" : ""}`}
                value={values.ledger_id} onChange={handleChange("ledger_id")}
                disabled={submitting}
              />
            </FormField>

            <FormField label="Fiscal Year" htmlFor="sal-fy" required error={err("financial_year")} hint="Drives the tax slabs used for auto tax calculation">
              <select
                id="sal-fy"
                className={`field-input hr-select ${err("financial_year") ? "input-error" : ""}`}
                value={values.financial_year}
                onChange={handleChange("financial_year")}
                disabled={submitting}
              >
                <option value="">Select fiscal year…</option>
                {fiscalYears.map((fy) => (
                  <option key={fy.id} value={fy.id}>{fy.name}</option>
                ))}
              </select>
            </FormField>

            <FormField label="Staff Category" htmlFor="sal-category" error={err("staff_category")}>
              <input
                id="sal-category"
                className="field-input"
                value={values.staff_category} onChange={handleChange("staff_category")}
                placeholder="Optional"
                disabled={submitting}
              />
            </FormField>
          </div>

          <h4 className="hr-form-section-title">Earnings</h4>
          <div className="hr-salary-mode-card">
            <div className="hr-salary-mode-header">
              <div className="hr-salary-mode-title-group">
                <span className="hr-salary-mode-title">Salary Calculation Option:</span>
              </div>
              <div className="hr-salary-segmented-control" role="group" aria-label="Salary Calculation Option">
                <button
                  type="button"
                  className={`hr-salary-segmented-btn ${calcMode === "BASIC" ? "hr-salary-segmented-btn-active" : ""}`}
                  onClick={() => handleModeSwitch("BASIC")}
                  disabled={submitting}
                >
                  By Basic Salary
                </button>
                <button
                  type="button"
                  className={`hr-salary-segmented-btn ${calcMode === "GROSS" ? "hr-salary-segmented-btn-active" : ""}`}
                  onClick={() => handleModeSwitch("GROSS")}
                  disabled={submitting}
                >
                  By Gross Salary
                </button>
              </div>
            </div>
          </div>

          <div className="hr-form-grid">
            {calcMode === "BASIC" ? (
              <FormField label="Basic Salary" htmlFor="sal-basic" required error={err("basic_salary")}>
                <input
                  id="sal-basic"
                  inputMode="numeric"
                  className={`field-input ${err("basic_salary") ? "input-error" : ""}`}
                  value={values.basic_salary}
                  onChange={handleBasicSalaryChange}
                  placeholder="0"
                  disabled={submitting}
                />
              </FormField>
            ) : (
              <FormField label="Basic Salary (Calculated)" htmlFor="sal-basic" hint="Auto-calculated from Gross Salary based on allowances">
                <input
                  id="sal-basic"
                  className="field-input"
                  value={values.basic_salary || 0}
                  disabled
                  readOnly
                />
              </FormField>
            )}

            {calcMode === "GROSS" ? (
              <FormField label="Gross Salary" htmlFor="sal-gross" required error={err("gross_salary")}>
                <input
                  id="sal-gross"
                  inputMode="numeric"
                  className={`field-input ${err("gross_salary") ? "input-error" : ""}`}
                  value={values.gross_salary}
                  onChange={handleGrossSalaryChange}
                  placeholder="0"
                  disabled={submitting}
                />
              </FormField>
            ) : (
              <FormField label="Gross Salary (Calculated)" htmlFor="sal-gross" hint="Calculated automatically: Basic + Allowances + Arrears">
                <input
                  id="sal-gross"
                  className="field-input"
                  value={previewGross ?? 0}
                  disabled
                  readOnly
                />
              </FormField>
            )}

            {numberField("medical_allowance", "Medical Allowance", "sal-medical")}
            {numberField("house_rent_allowance", "House Rent Allowance", "sal-hra")}
            {numberField("conveyance_allowance", "Conveyance Allowance", "sal-conveyance")}
            {numberField("arrears", "Arrears", "sal-arrears")}
          </div>

          <h4 className="hr-form-section-title">Allowances</h4>

          {values.allowances.length > 0 && (
            <div className="hr-table-wrap" style={{ marginBottom: "0.75rem" }}>
              <table className="hr-table">
                <thead>
                  <tr><th>Allowance</th><th>Taxable</th><th>Amount (Rs.)</th><th className="hr-table-actions-col">Remove</th></tr>
                </thead>
                <tbody>
                  {values.allowances.map((entry, index) => (
                    <tr key={entry.allowance_type_id}>
                      <td>{entry.name}</td>
                      <td>
                        <span className={`hr-badge ${entry.is_taxable ? "hr-badge-muted" : "hr-badge-success"}`}>
                          {entry.is_taxable ? "Taxable" : "Non-Taxable"}
                        </span>
                      </td>
                      <td>
                        <input
                          inputMode="numeric" min={0} step="0.01"
                          className={`field-input ${err(`allowances.${index}.amount` as keyof SalaryFormValues) ? "input-error" : ""}`}
                          value={entry.amount}
                          onChange={handleAllowanceAmountChange(index)}
                          disabled={submitting}
                          style={{ maxWidth: 140 }}
                        />
                      </td>
                      <td>
                        <button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label={`Remove ${entry.name}`} onClick={() => handleRemoveAllowance(index)} disabled={submitting}>
                          <IconTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="hr-form-grid" style={{ alignItems: "end" }}>
            <FormField label="Add Allowance" htmlFor="sal-allowance-picker">
              <select
                id="sal-allowance-picker"
                className="field-input hr-select"
                value={pickerAllowanceId}
                onChange={(e) => setPickerAllowanceId(e.target.value)}
                disabled={submitting || availableAllowanceTypes.length === 0}
              >
                <option value="">{availableAllowanceTypes.length === 0 ? "No more allowance types available" : "Select allowance type…"}</option>
                {availableAllowanceTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </FormField>
            <button type="button" className="hr-btn hr-btn-secondary" onClick={handleAddAllowance} disabled={submitting || !pickerAllowanceId}>
              <IconPlus />Add
            </button>
          </div>

          <h4 className="hr-form-section-title">Deductions</h4>
          <p className="hr-field-hint">
            Taxable base for this sheet is currently <strong>Rs. {previewTaxableBase.toLocaleString()}</strong> — leave Tax Amount blank to auto-calculate it from the selected Fiscal Year's tax slabs.
          </p>
          <div className="hr-form-grid">
            <StatutoryAmountField
              label="EPF Amount"
              htmlFor="sal-epf"
              value={values.epf_amount}
              onChange={(v) => setValues((prev) => ({ ...prev, epf_amount: v }))}
              autoAmount={autoEpfPreview.amount}
              breakdown={autoEpfPreview.breakdown}
              disabled={submitting}
              error={err("epf_amount")}
            />
            <StatutoryAmountField
              label="EOBI Amount"
              htmlFor="sal-eobi"
              value={values.eobi_amount}
              onChange={(v) => setValues((prev) => ({ ...prev, eobi_amount: v }))}
              autoAmount={autoEobiPreview.amount}
              breakdown={autoEobiPreview.breakdown}
              disabled={submitting}
              error={err("eobi_amount")}
            />
            <StatutoryAmountField
              label="Tax Amount"
              htmlFor="sal-tax"
              value={values.tax_amount}
              onChange={(v) => setValues((prev) => ({ ...prev, tax_amount: v }))}
              autoAmount={autoTaxPreview.amount}
              breakdown={autoTaxPreview.breakdown ?? "Enter a Basic Salary and select a Fiscal Year with configured tax slabs to see a live calculation."}
              disabled={submitting}
              error={err("tax_amount")}
            />
            {numberField("exempt_amount", "Non-Taxable / Exempt Amount", "sal-exempt")}
            {numberField("loan_amount", "Outstanding Loan Amount", "sal-loan")}
            {numberField("pay_loan", "Loan Installment Paid This Month", "sal-payloan")}
            {numberField("training", "Training Deduction", "sal-training")}
            {numberField("other_deduction", "Other Deduction", "sal-other")}
            {numberField("leaves", "Leaves Taken", "sal-leaves")}
            {numberField("leaves_deduction", "Leaves Deduction", "sal-leaves-deduction")}
          </div>

          <h4 className="hr-form-section-title">Status &amp; Notes</h4>
          <div className="hr-form-grid">
            <FormField label="Bank Account" htmlFor="sal-bank" error={err("bank_account")}>
              <input
                id="sal-bank"
                className="field-input"
                value={values.bank_account} onChange={handleChange("bank_account")}
                placeholder="Disbursement account no."
                disabled={submitting}
              />
            </FormField>

            <FormField label="Pay Status" htmlFor="sal-pay-status" error={err("pay_status")}>
              <select
                id="sal-pay-status" className="field-input hr-select"
                value={values.pay_status} onChange={handleChange("pay_status")}
                disabled={submitting}
              >
                <option value={PAY_STATUS.YES}>Yes</option>
                <option value={PAY_STATUS.NO}>No</option>
              </select>
            </FormField>

            {mode === "edit" && (
              <FormField label="Salary Status" htmlFor="sal-status" error={err("salary_status")}>
                <select
                  id="sal-status" className="field-input hr-select"
                  value={values.salary_status} onChange={handleChange("salary_status")}
                  disabled={submitting}
                >
                  <option value={SALARY_STATUS.PENDING}>Pending</option>
                  <option value={SALARY_STATUS.APPROVED}>Approved</option>
                  <option value={SALARY_STATUS.REJECTED}>Rejected</option>
                  <option value={SALARY_STATUS.PAID}>Paid</option>
                </select>
              </FormField>
            )}
          </div>

          <FormField label="Description" htmlFor="sal-description" error={err("description")}>
            <textarea
              id="sal-description" className="field-input hr-textarea"
              value={values.description} onChange={handleChange("description")}
              placeholder="Optional" rows={2} disabled={submitting}
            />
          </FormField>

          <FormField label="Remarks" htmlFor="sal-remarks" error={err("remarks")}>
            <textarea
              id="sal-remarks" className="field-input hr-textarea"
              value={values.remarks} onChange={handleChange("remarks")}
              placeholder="Optional" rows={2} disabled={submitting}
            />
          </FormField>

          <div className="hr-modal-actions">
            <button type="button" className="hr-btn hr-btn-secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="hr-btn hr-btn-primary" disabled={submitting}>
              {submitting ? (
                <span className="spinner-wrap"><span className="spinner" />Saving…</span>
              ) : mode === "create" ? "Generate Sheet" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SalaryFormModal;

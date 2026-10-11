import React, { useRef } from "react";
import FormField from "./FormField";
import CalculationInfoPopover from "./CalculationInfoPopover";

interface StatutoryAmountFieldProps {
  label: string;
  htmlFor: string;
  // The form's current raw string value. "" means "not manually entered"
  // — i.e. auto-calculated — following the same convention the rest of
  // this codebase already uses to distinguish "leave this to the backend"
  // from "use exactly what I typed" (see salary.service.ts).
  value: string;
  onChange: (value: string) => void;
  // Live client-side preview of what the backend will auto-calculate —
  // from utils/statutoryCalculation.ts. Shown instead of an editable box
  // while value is "".
  autoAmount: number;
  // Plain-English explanation of the formula behind autoAmount, shown in
  // the ⓘ popover.
  breakdown: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

/**
 * EOBI/EPF (and Increment "New PF") amount field. Defaults to showing the
 * auto-calculated figure as a read-only preview with a ⓘ next to it
 * explaining the formula; that popover's only action is "Add manually",
 * which switches the field to a normal editable input pre-filled with the
 * current auto amount. Clearing the input back to empty switches it back
 * to auto-calculated — there's no separate toggle needed for that
 * direction, since an empty value already means "auto-calculate" to the
 * backend.
 */
const StatutoryAmountField: React.FC<StatutoryAmountFieldProps> = ({
  label,
  htmlFor,
  value,
  onChange,
  autoAmount,
  breakdown,
  disabled,
  error,
  required,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isManual = value.trim() !== "";

  const handleAddManually = () => {
    onChange(String(autoAmount));
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const popoverBreakdown = isManual
    ? `${breakdown} This amount is currently entered manually — clear the field to switch back to automatic calculation.`
    : breakdown;

  return (
    <FormField
      label={
        <>
          {label}
          <CalculationInfoPopover
            breakdown={popoverBreakdown}
            label={`How is ${label} calculated?`}
            actionLabel={isManual ? undefined : "Add manually"}
            onAction={isManual ? undefined : handleAddManually}
          />
        </>
      }
      htmlFor={htmlFor}
      required={required}
      error={error}
    >
      {isManual ? (
        <input
          ref={inputRef}
          id={htmlFor}
          type="number"
          min={0}
          inputMode="numeric"
          className={`field-input ${error ? "input-error" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          disabled={disabled}
        />
      ) : (
        <div id={htmlFor} className={`field-input statutory-auto-display ${error ? "input-error" : ""}`}>
          ₨{autoAmount.toLocaleString()} (auto-calculated)
        </div>
      )}
    </FormField>
  );
};

export default StatutoryAmountField;

import React, { useEffect, useRef, useState } from "react";

interface CalculationInfoPopoverProps {
  // The plain-English breakdown text, e.g. from a backend
  // `calculation_breakdown` field. If null/undefined, the component
  // renders nothing — there's nothing to explain (e.g. a manually-entered
  // value with no formula behind it).
  breakdown?: string | null;
  label?: string;
  // Optional single action rendered as a button below the breakdown text
  // — used by StatutoryAmountField.tsx for its "Add manually" option, so
  // the popover both explains *how* a figure is calculated and offers the
  // one way to override it, in the same place.
  actionLabel?: string;
  onAction?: () => void;
}

const IconInfo = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

/**
 * Small "ⓘ" icon button that, on click, shows a plain-English explanation
 * of how a calculated figure (tax, EOBI, EPF, etc.) was derived — including
 * the government/company formula basis. Renders nothing if there's no
 * breakdown to show, so it's safe to always mount next to any
 * auto-calculated amount.
 */
const CalculationInfoPopover: React.FC<CalculationInfoPopoverProps> = ({
  breakdown,
  label = "How was this calculated?",
  actionLabel,
  onAction,
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!breakdown) return null;

  return (
    <span ref={containerRef} className="calc-info-popover-anchor">
      <button
        type="button"
        className="calc-info-popover-trigger"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <IconInfo />
      </button>
      {open && (
        <div className="calc-info-popover-panel" role="tooltip">
          <p className="calc-info-popover-text">{breakdown}</p>
          {actionLabel && onAction && (
            <button
              type="button"
              className="calc-info-popover-action"
              onClick={() => {
                onAction();
                setOpen(false);
              }}
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </span>
  );
};

export default CalculationInfoPopover;

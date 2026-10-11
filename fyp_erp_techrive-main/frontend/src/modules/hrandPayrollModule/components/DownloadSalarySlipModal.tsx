import React, { useEffect, useState } from "react";
import SalarySlip from "./SalarySlip";
import { payrollReportAPI } from "../services/payrollReport.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { SalarySlipRow } from "../services/payrollReport.types";
import "../pages/salary-slip.css";

interface DownloadSalarySlipModalProps {
  open: boolean;
  branchId: number | null;
  staffId: number | null;
  monthId: string | null;
  yearId: number | null;
  onClose: () => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// One employee's printable slip, fetched straight from a Salary Sheet row —
// reuses the exact same report data/layout as the Reports → Bulk Salary
// Slip page (payrollReport.service.ts's getSalarySlips + components/
// SalarySlip.tsx), just scoped to a single staff_id/month/year instead of
// making the user go filter the whole report by branch and month.
const DownloadSalarySlipModal: React.FC<DownloadSalarySlipModalProps> = ({
  open,
  branchId,
  staffId,
  monthId,
  yearId,
  onClose,
}) => {
  const [slip, setSlip] = useState<SalarySlipRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !staffId || !monthId || !yearId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSlip(null);
    payrollReportAPI
      .salarySlips({
        month_id: monthId,
        year_id: yearId,
        branch_id: branchId ?? undefined,
        staff_ids: String(staffId),
      })
      .then((res) => {
        if (cancelled) return;
        setSlip(res.data[0] ?? null);
        if (!res.data[0]) setError("No slip data found for this sheet.");
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, branchId, staffId, monthId, yearId]);

  if (!open) return null;

  return (
    <div className="hr-modal-overlay salary-slip-modal-overlay" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="hr-modal hr-modal-form hr-modal-form-wide salary-slip-modal" role="dialog" aria-modal="true" aria-labelledby="salary-slip-modal-title">
        <button type="button" className="hr-modal-close" onClick={onClose} aria-label="Close">
          <IconClose />
        </button>

        <h3 id="salary-slip-modal-title" className="hr-modal-title hr-modal-title-left">
          Salary Slip
        </h3>

        {loading && <p className="hr-field-hint">Loading…</p>}
        {error && !loading && <p className="hr-field-error" role="alert">{error}</p>}
        {!loading && !error && slip && (
          <>
            <div className="salary-slip-print-area">
              <SalarySlip slip={slip} />
            </div>
            <div className="hr-modal-actions">
              <button type="button" className="hr-btn hr-btn-secondary" onClick={onClose}>Close</button>
              <button type="button" className="hr-btn hr-btn-primary" onClick={() => window.print()}>
                Print / Save as PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DownloadSalarySlipModal;

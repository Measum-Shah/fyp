import React from "react";
import { Link } from "react-router-dom";
import { useGrossSalaryReport } from "../hooks/useGrossSalaryReport";

/* ── Icons ─────────────────────────────────────────────────────────────── */
const IconWallet = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const MONTH_NAMES: Record<string, string> = {
  "01": "January", "02": "February", "03": "March", "04": "April",
  "05": "May", "06": "June", "07": "July", "08": "August",
  "09": "September", "10": "October", "11": "November", "12": "December",
};

const formatMoney = (value: number): string =>
  value.toLocaleString(undefined, { maximumFractionDigits: 0 });

// ─── GrossSalaryWidget ────────────────────────────────────────────────────
// Dashboard widget — "how much did we pay this month" at a glance. Reuses
// the Gross Salary Report's hook with no filters, which the backend
// resolves to the current calendar month (see payrollReport.service.ts's
// currentMonthYear). Kept intentionally compact (one headline figure + a
// couple of supporting stats) rather than a full table — the full
// breakdown lives one click away on the Gross Salary Report page.
const GrossSalaryWidget: React.FC = () => {
  const { meta, loading, error, refetch } = useGrossSalaryReport();

  const monthLabel = meta.month_id && meta.year_id
    ? `${MONTH_NAMES[meta.month_id] ?? meta.month_id} ${meta.year_id}`
    : "This month";

  return (
    <section className="hr-birthday-widget" aria-label="Gross salary paid this month">
      <div className="hr-birthday-widget-header">
        <div className="hr-birthday-widget-title-group">
          <span className="hr-birthday-widget-icon">
            <IconWallet />
          </span>
          <div>
            <h2 className="hr-birthday-widget-title">Gross Salary This Month</h2>
            <p className="hr-birthday-widget-subtitle">{monthLabel}</p>
          </div>
        </div>
        <button
          type="button"
          className="hr-btn hr-btn-ghost hr-btn-icon"
          onClick={refetch}
          title="Refresh"
          aria-label="Refresh gross salary"
        >
          <IconRefresh />
        </button>
      </div>

      {loading && (
        <div className="hr-birthday-state">
          <span className="spinner-wrap"><span className="spinner" /></span>
          <p className="hr-state-message" style={{ marginTop: "0.6rem" }}>Totalling salaries…</p>
        </div>
      )}

      {!loading && error && (
        <div className="hr-birthday-state hr-birthday-state-error">
          <div className="hr-state-icon"><IconAlertTriangle /></div>
          <p className="hr-state-message">{error}</p>
          <button type="button" className="hr-btn hr-btn-secondary hr-btn-sm" onClick={refetch}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && meta.employeeCount === 0 && (
        <div className="hr-birthday-state">
          <p className="hr-state-message">
            No salary sheets for {monthLabel} yet. Run payroll to see totals here.
          </p>
        </div>
      )}

      {!loading && !error && meta.employeeCount > 0 && (
        <div style={{ padding: "0.5rem 0.25rem 0.75rem" }}>
          <div style={{ fontSize: "1.9rem", fontWeight: 700, color: "var(--gold, #c9a227)", lineHeight: 1.2 }}>
            {formatMoney(meta.totalGross)}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary, #666)", marginTop: "0.15rem" }}>
            Total gross salary paid to {meta.employeeCount} employee{meta.employeeCount === 1 ? "" : "s"}
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary, #666)", marginTop: "0.35rem" }}>
            Net payout: <strong style={{ color: "var(--text-primary, #1a1a1a)" }}>{formatMoney(meta.totalNet)}</strong>
          </div>
        </div>
      )}

      <Link to="/hr/reports/gross-salary" className="hr-birthday-view-all">
        View full gross salary report →
      </Link>
    </section>
  );
};

export default GrossSalaryWidget;

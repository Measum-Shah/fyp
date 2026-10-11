import React from "react";
import { Link } from "react-router-dom";
import { useCnicExpiryReport } from "../hooks/useCnicExpiryReport";

/* ── Icons ─────────────────────────────────────────────────────────────── */
const IconIdCard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <circle cx="8" cy="10" r="2" />
    <line x1="6" y1="16" x2="10" y2="16" />
    <line x1="14" y1="9" x2="19" y2="9" />
    <line x1="14" y1="13" x2="19" y2="13" />
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

const VISIBLE_LIMIT = 6;

const AVATAR_VARIANTS = ["blue", "green", "gold", "purple"] as const;
const avatarVariantOf = (seed: string): (typeof AVATAR_VARIANTS)[number] => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_VARIANTS[hash % AVATAR_VARIANTS.length];
};

const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const formatDate = (value: string): string => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const daysRemainingLabel = (days: number): string => {
  if (days < 0) return "Expired";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
};

// ─── CnicExpiryWidget ─────────────────────────────────────────────────────
// Dashboard widget — reuses the CNIC Expiry Report's data hook with no
// filters, which the backend resolves to "today .. today + 90 days" (see
// report.service.ts's resolveExpiryWindow default). Same visual language as
// BirthdayWidget (hr-birthday-* classes are generic "avatar list" styling,
// not birthday-specific), so the two widgets read as a matched pair on the
// dashboard.
const CnicExpiryWidget: React.FC = () => {
  const { rows, total, loading, error, refetch } = useCnicExpiryReport();
  const upcoming = rows.slice(0, VISIBLE_LIMIT);

  return (
    <section className="hr-birthday-widget" aria-label="Upcoming CNIC expiries">
      <div className="hr-birthday-widget-header">
        <div className="hr-birthday-widget-title-group">
          <span className="hr-birthday-widget-icon">
            <IconIdCard />
          </span>
          <div>
            <h2 className="hr-birthday-widget-title">CNIC Expiring Soon</h2>
            <p className="hr-birthday-widget-subtitle">Next 90 days, soonest first</p>
          </div>
        </div>
        <button
          type="button"
          className="hr-btn hr-btn-ghost hr-btn-icon"
          onClick={refetch}
          title="Refresh"
          aria-label="Refresh CNIC expiries"
        >
          <IconRefresh />
        </button>
      </div>

      {loading && (
        <div className="hr-birthday-state">
          <span className="spinner-wrap"><span className="spinner" /></span>
          <p className="hr-state-message" style={{ marginTop: "0.6rem" }}>Checking CNIC expiry dates…</p>
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

      {!loading && !error && upcoming.length === 0 && (
        <div className="hr-birthday-state">
          <p className="hr-state-message">No CNICs expiring in the next 90 days. 🎉</p>
        </div>
      )}

      {!loading && !error && upcoming.length > 0 && (
        <ul className="hr-birthday-list">
          {upcoming.map((row) => (
            <li key={row.id} className={`hr-birthday-row ${row.days_remaining <= 0 ? "hr-birthday-row-today" : ""}`}>
              <div className={`hr-birthday-avatar stat-icon-${avatarVariantOf(row.full_name || String(row.id))}`}>
                <span>{initialsOf(row.full_name)}</span>
              </div>
              <div className="hr-birthday-info">
                <span className="hr-birthday-name">{row.full_name}</span>
                <span className="hr-birthday-date">{formatDate(row.cnic_expiry_date_value)}</span>
              </div>
              <span className={`hr-birthday-badge ${row.days_remaining <= 0 ? "hr-birthday-badge-today" : ""}`}>
                {daysRemainingLabel(row.days_remaining)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && total > VISIBLE_LIMIT && (
        <Link to="/hr/reports/cnic-expiry" className="hr-birthday-view-all">
          View all {total} expiring CNICs →
        </Link>
      )}
    </section>
  );
};

export default CnicExpiryWidget;

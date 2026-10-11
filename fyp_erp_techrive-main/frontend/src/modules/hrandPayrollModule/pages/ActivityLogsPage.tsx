import React from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import { useActivityLogs } from "../hooks/useActivityLogs";
import { ACTIVITY_MODULE, ACTIVITY_ACTION } from "../services/activityLog.constants";
import type { ActivityLog } from "../services/activityLog.types";
import "./employee-module.css";

/* ── Icons ─────────────────────────────────────────────────────────────── */
const IconHome = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconGrid = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconAlertTriangle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const formatDateTime = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
};

const ACTION_LABELS: Record<string, string> = {
  [ACTIVITY_ACTION.CREATED]: "Created",
  [ACTIVITY_ACTION.UPDATED]: "Updated",
  [ACTIVITY_ACTION.DELETED]: "Deleted",
  [ACTIVITY_ACTION.STATUS_CHANGED]: "Status changed",
  [ACTIVITY_ACTION.SYNCHRONIZED]: "Synchronized",
  [ACTIVITY_ACTION.GENERATED]: "Generated",
  [ACTIVITY_ACTION.LOGIN_SUCCESS]: "Logged in",
  [ACTIVITY_ACTION.LOGIN_FAILED]: "Login failed",
  [ACTIVITY_ACTION.LOGOUT]: "Logged out",
};

const actionBadgeClass = (action: string): string => {
  if (action === ACTIVITY_ACTION.DELETED || action === "rejected" || action === ACTIVITY_ACTION.LOGIN_FAILED) {
    return "hr-badge-danger";
  }
  if (action === ACTIVITY_ACTION.CREATED || action === "approved") return "hr-badge-success";
  if (action === ACTIVITY_ACTION.UPDATED || action === ACTIVITY_ACTION.STATUS_CHANGED) return "hr-badge-warning";
  return "hr-badge-neutral";
};

// ─── ActivityLogRow ─────────────────────────────────────────────────────
// Expandable — clicking the row reveals previous_values/new_values as
// formatted JSON, since that detail is too dense for the main table.
const ActivityLogRow: React.FC<{ log: ActivityLog }> = ({ log }) => {
  const [expanded, setExpanded] = React.useState(false);
  const hasDetail = log.previous_values || log.new_values || log.endpoint;

  return (
    <>
      <tr
        className={hasDetail ? "hr-table-row-clickable" : undefined}
        onClick={() => hasDetail && setExpanded((v) => !v)}
      >
        <td className="hr-table-name">
          {log.user_name ?? "System"}
          <div className="hr-table-subtext">{formatDateTime(log.created_at)}</div>
        </td>
        <td>{log.module}</td>
        <td>
          <span className={`hr-badge ${actionBadgeClass(log.action)}`}>
            {ACTION_LABELS[log.action] ?? log.action}
          </span>
        </td>
        <td>
          {log.record_type ?? "—"}
          {log.record_id ? ` #${log.record_id}` : ""}
        </td>
        <td>{log.description ?? "—"}</td>
        <td>{log.ip_address ?? "—"}</td>
        <td>
          {hasDetail && (
            <span style={{ display: "inline-flex", transform: expanded ? "rotate(180deg)" : undefined, transition: "transform 0.15s" }}>
              <IconChevronDown />
            </span>
          )}
        </td>
      </tr>
      {expanded && hasDetail && (
        <tr>
          <td colSpan={7} style={{ background: "var(--input-bg)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", padding: "0.75rem 1rem" }}>
              {log.previous_values && (
                <div>
                  <p className="hr-table-subtext" style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                    Previous values
                  </p>
                  <pre style={{ fontSize: "0.75rem", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                    {JSON.stringify(log.previous_values, null, 2)}
                  </pre>
                </div>
              )}
              {log.new_values && (
                <div>
                  <p className="hr-table-subtext" style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                    New values
                  </p>
                  <pre style={{ fontSize: "0.75rem", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
                    {JSON.stringify(log.new_values, null, 2)}
                  </pre>
                </div>
              )}
              {log.endpoint && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <p className="hr-table-subtext" style={{ margin: 0 }}>
                    {log.request_method} {log.endpoint}
                  </p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

// ─── ActivityLogsPage ────────────────────────────────────────────────────
// Read-only audit trail backed by erp_activity_logs — every "who did what
// to which record, when" entry recorded by the auditLog middleware. See
// backend/src/modules/hrandPayrollModule/middlewares/auditLog.middleware.ts
// for how entries get here, and the routes files (employee/branch/
// leaveRequest/loanRequest/biometricDevice/payrollRun) for which actions
// are currently wired up to write one.
const ActivityLogsPage: React.FC = () => {
  const { logs, meta, page, setPage, search, changeSearch, filters, changeFilters, loading, error, refetch } =
    useActivityLogs();

  const showBigLoadingState = loading && logs.length === 0 && !error;
  const showErrorState = !loading && error && logs.length === 0;
  const showEmptyState = !loading && !error && logs.length === 0;
  const showTable = !showBigLoadingState && !showErrorState && !showEmptyState;

  return (
    <div className="hr-page">
      <div className="hr-page-inner">
        <div className="hr-page-header">
          <div>
            <nav className="breadcrumb">
              <Link to="/dashboard" className="breadcrumb-item">
                <IconHome /> Dashboard
              </Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item">HR &amp; Payroll</span>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item breadcrumb-current">Activity Log</span>
            </nav>
            <h1 className="hr-page-title">Activity Log</h1>
          </div>
        </div>

        <div className="hr-page-toolbar">
          <SearchBar value={search} onChange={changeSearch} placeholder="Search by user or description…" />

<select
            className="field-input hr-select hr-filter-select"
            value={filters.module ?? ""}
            onChange={(e) => changeFilters({ ...filters, module: e.target.value || undefined })}
          >
            <option value="">All modules</option>
            {Object.values(ACTIVITY_MODULE).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <input
            type="date"
            className="field-input"
            value={filters.dateFrom ?? ""}
            onChange={(e) => changeFilters({ ...filters, dateFrom: e.target.value || undefined })}
            aria-label="From date"
          />
          <span className="hr-field-hint">to</span>
          <input
            type="date"
            className="field-input"
            value={filters.dateTo ?? ""}
            onChange={(e) => changeFilters({ ...filters, dateTo: e.target.value || undefined })}
            aria-label="To date"
          />
        </div>

        {showBigLoadingState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <span className="spinner-wrap">
                <span className="spinner" />
              </span>
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>
                Loading activity log…
              </p>
            </div>
          </div>
        )}

        {showErrorState && (
          <div className="hr-table-wrap">
            <div className="hr-state hr-state-error">
              <div className="hr-state-icon">
                <IconAlertTriangle />
              </div>
              <p className="hr-state-title">Couldn't load the activity log</p>
              <p className="hr-state-message">{error}</p>
              <button type="button" className="hr-btn hr-btn-primary" onClick={refetch}>
                Try again
              </button>
            </div>
          </div>
        )}

        {showEmptyState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <div className="hr-state-icon">
                <IconGrid />
              </div>
              <p className="hr-state-title">No activity recorded</p>
              <p className="hr-state-message">
                {search || filters.module
                  ? "Nothing matches your current filters."
                  : "Actions across Employees, Campuses, Leave, Loans, Attendance and Payroll will show up here."}
              </p>
            </div>
          </div>
        )}

        {showTable && (
          <>
            <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
              <div className="hr-table-wrap">
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>User / When</th>
                      <th>Module</th>
                      <th>Action</th>
                      <th>Record</th>
                      <th>Description</th>
                      <th>IP Address</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <ActivityLogRow key={log.id} log={log} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={meta.limit}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityLogsPage;

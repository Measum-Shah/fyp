import React from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import { useSessions } from "../hooks/useSessions";
import { useSessionsSummary } from "../hooks/useSessionsSummary";
import { useNotification } from "../hooks/useNotification";
import { sessionLogAPI, getApiErrorMessage } from "../services/sessionLog.service";
import type { LoginStatus, UserSession } from "../services/sessionLog.types";
import "./employee-module.css";
import { Can } from "../components/Can";

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

const IconLogOut = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
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

const formatDuration = (seconds: number | null): string => {
  if (seconds === null || seconds === undefined) return "—";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m`;
  return `${seconds}s`;
};

const StatusBadge: React.FC<{ session: UserSession }> = ({ session }) => {
  if (session.login_status === "failed") {
    return <span className="hr-badge hr-badge-danger">Failed login</span>;
  }
  if (session.isOnline) {
    return <span className="hr-badge hr-badge-success">Online</span>;
  }
  if (session.is_active === 1) {
    return <span className="hr-badge hr-badge-warning">Active (idle)</span>;
  }
  return <span className="hr-badge hr-badge-neutral">Ended</span>;
};

// ─── SessionsPage ────────────────────────────────────────────────────────
// Read-only monitoring table backed by erp_user_sessions — who logged in,
// which account, when, from where (IP/browser/OS/device), whether they're
// still online, and lets an admin force-end a still-active session.
const SessionsPage: React.FC = () => {
  const {
    sessions,
    meta,
    page,
    setPage,
    search,
    changeSearch,
    isActive,
    changeIsActive,
    loginStatus,
    changeLoginStatus,
    loading,
    error,
    refetch,
  } = useSessions();
  const { summary } = useSessionsSummary();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [sessionToEnd, setSessionToEnd] = React.useState<UserSession | null>(null);
  const [ending, setEnding] = React.useState(false);

  const handleConfirmForceLogout = async () => {
    if (!sessionToEnd) return;
    setEnding(true);
    try {
      await sessionLogAPI.forceLogout(sessionToEnd.id);
      notifySuccess(`Session for ${sessionToEnd.user_name ?? sessionToEnd.user_email ?? "this user"} was ended.`);
      setSessionToEnd(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setEnding(false);
    }
  };

  const showBigLoadingState = loading && sessions.length === 0 && !error;
  const showErrorState = !loading && error && sessions.length === 0;
  const showEmptyState = !loading && !error && sessions.length === 0;
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
              <span className="breadcrumb-item breadcrumb-current">Sessions</span>
            </nav>
            <h1 className="hr-page-title">Sessions</h1>
          </div>

          {summary && (
            <div className="hr-page-header-stats">
              <div className="hr-stat-pill">
                <span className="hr-stat-pill-value">{summary.onlineCount}</span>
                <span className="hr-stat-pill-label">Online now</span>
              </div>
              <div className="hr-stat-pill">
                <span className="hr-stat-pill-value">{summary.activeCount}</span>
                <span className="hr-stat-pill-label">Active sessions</span>
              </div>
            </div>
          )}
        </div>

        <div className="hr-page-toolbar">
          <SearchBar value={search} onChange={changeSearch} placeholder="Search by name or email…" />

<select
            className="field-input hr-select hr-filter-select"
            value={isActive === undefined ? "" : String(isActive)}
            onChange={(e) => changeIsActive(e.target.value === "" ? undefined : e.target.value === "true")}
          >
            <option value="">All sessions</option>
            <option value="true">Active only</option>
            <option value="false">Ended only</option>
          </select>

          <select
            className="field-input hr-select hr-filter-select"
            value={loginStatus ?? ""}
            onChange={(e) => changeLoginStatus((e.target.value || undefined) as LoginStatus | undefined)}
          >
            <option value="">Success + Failed</option>
            <option value="success">Success only</option>
            <option value="failed">Failed only</option>
          </select>
        </div>

        {showBigLoadingState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <span className="spinner-wrap">
                <span className="spinner" />
              </span>
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>
                Loading sessions…
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
              <p className="hr-state-title">Couldn't load sessions</p>
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
              <p className="hr-state-title">No sessions found</p>
              <p className="hr-state-message">
                {search ? `No sessions match "${search}".` : "Login activity will show up here as users sign in."}
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
                      <th>User</th>
                      <th>Status</th>
                      <th>Login Time</th>
                      <th>Logout Time</th>
                      <th>Duration</th>
                      <th>IP Address</th>
                      <th>Browser / OS / Device</th>
                      <th>Logout Reason</th>
                      <th className="hr-table-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr key={session.id}>
                        <td className="hr-table-name">
                          {session.user_name ?? "—"}
                          <div className="hr-table-subtext">{session.user_email ?? "—"}</div>
                        </td>
                        <td>
                          <StatusBadge session={session} />
                          {session.login_status === "failed" && session.failure_reason && (
                            <div className="hr-table-subtext">{session.failure_reason}</div>
                          )}
                        </td>
                        <td>{formatDateTime(session.login_time)}</td>
                        <td>{formatDateTime(session.logout_time)}</td>
                        <td>{formatDuration(session.session_duration_seconds)}</td>
                        <td>{session.ip_address ?? "—"}</td>
                        <td>
                          {[session.browser, session.os, session.device].filter(Boolean).join(" · ") || "—"}
                        </td>
                        <td>{session.logout_reason ?? "—"}</td>
                        <td>
                          <div className="hr-table-actions">
                            {session.is_active === 1 && session.login_status === "success" && (
                              <Can permission="session.force_logout">
                                <button
                                  type="button"
                                  className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn"
                                  aria-label={`Force logout ${session.user_name ?? "this user"}`}
                                  onClick={() => setSessionToEnd(session)}
                                  title="Force logout"
                                >
                                  <IconLogOut />
                                </button>
                              </Can>
                            )}
                          </div>
                        </td>
                      </tr>
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

      <Toast notifications={notifications} onDismiss={dismiss} />

      <ConfirmDialog
        open={sessionToEnd !== null}
        title="Force logout this session?"
        message={
          sessionToEnd
            ? `This will immediately end the active session for ${sessionToEnd.user_name ?? sessionToEnd.user_email ?? "this user"}. They will need to log in again to continue using the ERP.`
            : ""
        }
        confirmLabel="Force Logout"
        danger
        loading={ending}
        onCancel={() => setSessionToEnd(null)}
        onConfirm={handleConfirmForceLogout}
      />
    </div>
  );
};

export default SessionsPage;

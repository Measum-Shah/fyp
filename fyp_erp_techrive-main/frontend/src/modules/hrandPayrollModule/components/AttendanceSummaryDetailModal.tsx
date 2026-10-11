import React, { useEffect, useState } from "react";
import { attendanceSummaryAPI } from "../services/attendanceSummary.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { AttendanceSummary, AttendanceSummaryDetail } from "../services/attendanceSummary.types";
import { Can } from "./Can";
import "../pages/employee-module.css";

interface AttendanceSummaryDetailModalProps {
  open: boolean;
  summary: AttendanceSummary | null;
  onClose: () => void;
  onEdit?: (summary: AttendanceSummary) => void;
  onApprove?: (summary: AttendanceSummary) => void;
  onDelete?: (summary: AttendanceSummary) => void;
}

const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconDownload = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
  </svg>
);
const IconCheckCircle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

// Wraps a CSV field in quotes and escapes embedded quotes if the value
// contains a comma, quote, or newline — the minimal RFC 4180 handling
// needed for remarks/employee-name text that may contain those characters.
const csvField = (value: string): string => {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

const downloadCsv = (detail: AttendanceSummaryDetail) => {
  const { summary, days } = detail;
  const employeeLabel = summary.employee
    ? `${summary.employee.name}${summary.employee.reg_no ? ` (${summary.employee.reg_no})` : ""}`
    : `Employee #${summary.staff_id}`;
  const period = `${summary.month_title ?? summary.month_id} ${summary.year_title ?? summary.year_id}`;

  const header = ["Date", "Day", "Status", "Time In", "Time Out", "Remarks"];
  const rows = days.map((d) => [
    d.date,
    d.day_name,
    d.status_title ?? "No record",
    d.time_in ?? "",
    d.time_out ?? "",
    d.remarks ?? "",
  ]);

  const lines = [
    `Attendance Summary — ${employeeLabel} — ${period}`,
    "",
    header.join(","),
    ...rows.map((r) => r.map((cell) => csvField(String(cell))).join(",")),
  ];

  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `attendance-summary-${summary.staff_id}-${summary.month_id}-${summary.year_id}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const AttendanceSummaryDetailModal: React.FC<AttendanceSummaryDetailModalProps> = ({
  open,
  summary,
  onClose,
  onEdit,
  onApprove,
  onDelete,
}) => {
  const [detail, setDetail] = useState<AttendanceSummaryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !summary) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    attendanceSummaryAPI
      .getDetail(summary.id)
      .then((res) => {
        if (!cancelled) setDetail(res.data);
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
  }, [open, summary]);

  if (!open || !summary) return null;

  const employeeLabel = summary.employee
    ? `${summary.employee.name}${summary.employee.reg_no ? ` (${summary.employee.reg_no})` : ""}`
    : `Employee #${summary.staff_id}`;
  const period = `${summary.month_title ?? `#${summary.month_id}`} ${summary.year_title ?? summary.year_id}`;

  return (
    <div
      className="hr-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="hr-modal hr-modal-form hr-modal-form-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="attsum-detail-title"
      >
        <button type="button" className="hr-modal-close" onClick={onClose} aria-label="Close">
          <IconClose />
        </button>

        <h3 id="attsum-detail-title" className="hr-modal-title hr-modal-title-left">
          {employeeLabel}
          <div style={{ fontWeight: 400, fontSize: "0.85rem", color: "var(--text-dark-sub)", marginTop: "0.2rem" }}>
            {period} — Attendance Summary
          </div>
        </h3>

        {loading && (
          <div className="hr-state" style={{ padding: "2rem 0" }}>
            <span className="spinner-wrap">
              <span className="spinner" />
            </span>
            <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>Loading attendance detail…</p>
          </div>
        )}

        {!loading && error && (
          <div className="hr-state hr-state-error" style={{ padding: "1.5rem 0" }}>
            <p className="hr-state-message">{error}</p>
          </div>
        )}

        {!loading && !error && detail && (
          <>
            <div className="hr-detail-stats">
              <div className="hr-detail-stat-card">
                <div className="hr-detail-stat-label">Total Absents</div>
                <div className="hr-detail-stat-value">{summary.total_absents ?? 0}</div>
              </div>
              <div className="hr-detail-stat-card">
                <div className="hr-detail-stat-label">Total Leaves</div>
                <div className="hr-detail-stat-value">{detail.leave_stats.total_leave_days}</div>
              </div>
              <div className="hr-detail-stat-card">
                <div className="hr-detail-stat-label">Paid Leaves</div>
                <div className="hr-detail-stat-value">{detail.leave_stats.paid_leave_days}</div>
              </div>
              <div className="hr-detail-stat-card">
                <div className="hr-detail-stat-label">Unpaid Leaves</div>
                <div className="hr-detail-stat-value">{detail.leave_stats.unpaid_leave_days}</div>
              </div>
            </div>

            <div className="hr-detail-table-wrap">
              <table className="hr-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Status</th>
                    <th>Time In</th>
                    <th>Time Out</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.days.map((d) => (
                    <tr key={d.date} className={d.status_title ? undefined : "hr-detail-row-empty"}>
                      <td>{d.date}</td>
                      <td>{d.day_name}</td>
                      <td>
                        {d.status_title ? (
                          <span
                            className={`hr-badge hr-badge-${d.status_display_class ?? "neutral"}`}
                          >
                            {d.status_title}
                          </span>
                        ) : (
                          "No record"
                        )}
                      </td>
                      <td>{d.time_in ?? "—"}</td>
                      <td>{d.time_out ?? "—"}</td>
                      <td>{d.remarks ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="hr-modal-actions" style={{ flexWrap: "wrap" }}>
              <Can permission="attendance_summary.delete">
                <button
                  type="button"
                  className="hr-btn hr-btn-secondary hr-table-delete-btn"
                  onClick={() => onDelete?.(summary)}
                >
                  <IconTrash />
                  Delete
                </button>
              </Can>
              <Can permission="attendance_summary.approve">
                <button
                  type="button"
                  className="hr-btn hr-btn-secondary"
                  onClick={() => onApprove?.(summary)}
                >
                  <IconCheckCircle />
                  Approval
                </button>
              </Can>
              <Can permission="attendance_summary.update">
                <button
                  type="button"
                  className="hr-btn hr-btn-secondary"
                  onClick={() => onEdit?.(summary)}
                >
                  <IconEdit />
                  Edit
                </button>
              </Can>
              <button type="button" className="hr-btn hr-btn-secondary" onClick={onClose}>
                Close
              </button>
              <button type="button" className="hr-btn hr-btn-primary" onClick={() => downloadCsv(detail)}>
                <IconDownload />
                Export CSV
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AttendanceSummaryDetailModal;

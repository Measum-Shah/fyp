import React, { useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import AttendanceFormModal from "../components/AttendanceFormModal";
import { useAttendanceRecords } from "../hooks/useAttendanceRecords";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { useAttendanceStatusesLookup } from "../hooks/useAttendanceStatusesLookup";
import { useNotification } from "../hooks/useNotification";
import { attendanceAPI } from "../services/attendance.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import {
  attendanceToFormValues,
  isReviewed,
  toCreatePayload,
  toUpdatePayload,
} from "../services/attendance.validation";
import type { AttendanceFilters } from "../hooks/useAttendanceRecords";
import type { AttendanceFormValues, AttendanceRecord } from "../services/attendance.types";
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

const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconClipboard = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
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

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
  </svg>
);

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";

const AttendancePage: React.FC = () => {
  const { records, meta, page, setPage, filters, changeFilters, loading, error, refetch } =
    useAttendanceRecords();

  // Company → Branch cascade for the toolbar filter (see the Company→Branch
  // scoping task). AttendanceFormModal has its own independent Company
  // selector for the create/edit form.
  const [filterCompanyId, setFilterCompanyId] = useState<number | null>(null);
  const { companies } = useCompanyLookup();
  const { branches } = useBranchesLookup(filterCompanyId);
  const { statuses } = useAttendanceStatusesLookup();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const statusTitleById = new Map(statuses.map((s) => [s.id, s]));

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [reviewLoadingId, setReviewLoadingId] = useState<number | null>(null);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingRecord(null);
    setServerErrors({});
    setModalOpen(true);
  };

  const openEditModal = (record: AttendanceRecord) => {
    setModalMode("edit");
    setEditingRecord(record);
    setServerErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingRecord(null);
  };

  const handleSubmit = async (values: AttendanceFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        await attendanceAPI.create(toCreatePayload(values));
        notifySuccess("Attendance record was added successfully.");
      } else if (editingRecord) {
        await attendanceAPI.update(editingRecord.id, toUpdatePayload(values));
        notifySuccess("Attendance record was updated successfully.");
      }
      setModalOpen(false);
      setEditingRecord(null);
      refetch();
    } catch (err) {
      const fieldErrors = getApiFieldErrors(err);
      if (fieldErrors) setServerErrors(fieldErrors);
      notifyError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    setDeleteLoading(true);
    try {
      await attendanceAPI.remove(recordToDelete.id);
      notifySuccess("Attendance record was deleted successfully.");
      setRecordToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleReview = async (record: AttendanceRecord) => {
    setReviewLoadingId(record.id);
    try {
      await attendanceAPI.setReviewStatus(record.id, !isReviewed(record));
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setReviewLoadingId(null);
    }
  };

  const updateFilter = (patch: Partial<AttendanceFilters>) => {
    changeFilters({ ...filters, ...patch });
  };

  const showBigLoadingState = loading && records.length === 0 && !error;
  const showErrorState = !loading && error && records.length === 0;
  const showEmptyState = !loading && !error && records.length === 0;
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
              <span className="breadcrumb-item breadcrumb-current">Attendance</span>
            </nav>
            <h1 className="hr-page-title">Attendance</h1>
          </div>

          <Can permission="attendance.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
            <IconPlus />
            Mark Attendance
          </button></Can>
        </div>


        <div className="hr-page-toolbar hr-attendance-filters">
          <input
            type="date"
            className="field-input"
            value={filters.start_date ?? ""}
            onChange={(e) => updateFilter({ start_date: e.target.value || undefined })}
            aria-label="From date"
          />
          <span className="hr-field-hint">to</span>
          <input
            type="date"
            className="field-input"
            value={filters.end_date ?? ""}
            onChange={(e) => updateFilter({ end_date: e.target.value || undefined })}
            aria-label="To date"
          />
          <select
            className="field-input hr-select"
            value={filterCompanyId ?? ""}
            onChange={(e) => {
              const next = e.target.value ? Number(e.target.value) : null;
              setFilterCompanyId(next);
              // A branch from the old company is no longer valid/visible — clear it.
              updateFilter({ branch_id: undefined, company_id: next ?? undefined });
            }}
            aria-label="Filter by school / university"
          >
            <option value="">All school / university</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            className="field-input hr-select"
            value={filters.branch_id ?? ""}
            onChange={(e) => updateFilter({ branch_id: e.target.value ? Number(e.target.value) : undefined })}
            aria-label="Filter by campus"
            disabled={filterCompanyId == null}
          >
            <option value="">{filterCompanyId == null ? "Select a school / university first…" : "All campuses"}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            className="field-input hr-select"
            value={filters.status ?? ""}
            onChange={(e) => updateFilter({ status: e.target.value ? Number(e.target.value) : undefined })}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>

        {showBigLoadingState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <span className="spinner-wrap">
                <span className="spinner" />
              </span>
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>
                Loading attendance records…
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
              <p className="hr-state-title">Couldn't load attendance records</p>
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
                <IconClipboard />
              </div>
              <p className="hr-state-title">No attendance records found</p>
              <p className="hr-state-message">
                Try widening your filters, or mark attendance for an employee to get started.
              </p>
              <Can permission="attendance.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
                <IconPlus />
                Mark Attendance
              </button></Can>
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
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Reviewed</th>
                      <th className="hr-table-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => {
                      const status = statusTitleById.get(record.status);
                      const reviewed = isReviewed(record);
                      return (
                        <tr key={record.id}>
                          <td className="hr-table-name">
                            {record.employee?.name ?? `Employee #${record.employee_id}`}
                            {record.employee?.reg_no ? ` (${record.employee.reg_no})` : ""}
                          </td>
                          <td>{formatDate(record.attendance_date)}</td>
                          <td>
                            <span className={`hr-badge hr-badge-${status?.display_class ?? "neutral"}`}>
                              {status?.title ?? `#${record.status}`}
                            </span>
                          </td>
                          <td>{record.timeIn ?? "—"}</td>
                          <td>{record.timeOut ?? "—"}</td>
                          <td>
                            <button
                              type="button"
                              className={`hr-btn hr-btn-ghost hr-review-toggle ${reviewed ? "hr-review-toggle-active" : ""}`}
                              onClick={() => toggleReview(record)}
                              disabled={reviewLoadingId === record.id}
                            >
                              <IconCheck />
                              {reviewed ? "Reviewed" : "Mark reviewed"}
                            </button>
                          </td>
                          <td>
                            <div className="hr-table-actions">
                              <Can permission="attendance.update"><button
                                type="button"
                                className="hr-btn hr-btn-ghost hr-btn-icon"
                                aria-label="Edit attendance record"
                                onClick={() => openEditModal(record)}
                              >
                                <IconEdit />
                              </button></Can>
                              <Can permission="attendance.delete"><button
                                type="button"
                                className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn"
                                aria-label="Delete attendance record"
                                onClick={() => setRecordToDelete(record)}
                              >
                                <IconTrash />
                              </button></Can>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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

      <AttendanceFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingRecord ? attendanceToFormValues(editingRecord) : undefined}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Delete attendance record?"
        message="This will remove this attendance record. This action cannot be undone from this screen."
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default AttendancePage;
import React, { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import AttendanceStatusFormModal from "../components/AttendanceStatusFormModal";
import { useAttendanceStatuses } from "../hooks/useAttendanceStatuses";
import { useNotification } from "../hooks/useNotification";
import { attendanceStatusAPI } from "../services/attendanceStatus.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import {
  attendanceStatusToFormValues,
  toCreatePayload,
  toUpdatePayload,
} from "../services/attendanceStatus.validation";
import { ATTENDANCE_STATUS_ABSENCE_FLAG, ATTENDANCE_STATUS_STATUS } from "../services/attendanceStatus.types";
import type { AttendanceStatus, AttendanceStatusFormValues } from "../services/attendanceStatus.types";
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

const IconTag = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41 11 3.83 3 3l.83 8L13.41 20.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83Z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
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

const AttendanceStatusesPage: React.FC = () => {
  const {
    statuses,
    meta,
    page,
    setPage,
    search,
    changeSearch,
    loading,
    error,
    refetch,
  } = useAttendanceStatuses();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingStatus, setEditingStatus] = useState<AttendanceStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [statusToDelete, setStatusToDelete] = useState<AttendanceStatus | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingStatus(null);
    setServerErrors({});
    setModalOpen(true);
  };

  const openEditModal = (status: AttendanceStatus) => {
    setModalMode("edit");
    setEditingStatus(status);
    setServerErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingStatus(null);
  };

  const handleSubmit = async (values: AttendanceStatusFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        const res = await attendanceStatusAPI.create(toCreatePayload(values));
        notifySuccess(`"${res.data.title}" was added successfully.`);
      } else if (editingStatus) {
        const res = await attendanceStatusAPI.update(editingStatus.id, toUpdatePayload(values));
        notifySuccess(`"${res.data.title}" was updated successfully.`);
      }
      setModalOpen(false);
      setEditingStatus(null);
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
    if (!statusToDelete) return;
    setDeleteLoading(true);
    try {
      await attendanceStatusAPI.remove(statusToDelete.id);
      notifySuccess(`"${statusToDelete.title}" was deleted successfully.`);
      setStatusToDelete(null);
      refetch();
    } catch (err) {
      // Includes the "still used by attendance records" 409 case from the backend
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showBigLoadingState = loading && statuses.length === 0 && !error;
  const showErrorState = !loading && error && statuses.length === 0;
  const showEmptyState = !loading && !error && statuses.length === 0;
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
              <span className="breadcrumb-item breadcrumb-current">Attendance Statuses</span>
            </nav>
            <h1 className="hr-page-title">Attendance Statuses</h1>
          </div>

          <Can permission="attendance_status.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
            <IconPlus />
            Add Status
          </button></Can>
        </div>


        <div className="hr-page-toolbar">
          <SearchBar value={search} onChange={changeSearch} placeholder="Search statuses by title…" />
        </div>

        {showBigLoadingState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <span className="spinner-wrap">
                <span className="spinner" />
              </span>
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>
                Loading attendance statuses…
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
              <p className="hr-state-title">Couldn't load attendance statuses</p>
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
                <IconTag />
              </div>
              <p className="hr-state-title">
                {search ? "No matching statuses" : "No attendance statuses yet"}
              </p>
              <p className="hr-state-message">
                {search
                  ? `No statuses match "${search}". Try a different search term.`
                  : "Define statuses like Present, Absent, or Half Day before marking attendance."}
              </p>
              {!search && (
                <Can permission="attendance_status.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
                  <IconPlus />
                  Add Status
                </button></Can>
              )}
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
                      <th>Title</th>
                      <th>Badge Preview</th>
                      <th>Counts as Absent</th>
                      <th>Status</th>
                      <th className="hr-table-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statuses.map((status) => (
                      <tr key={status.id}>
                        <td className="hr-table-name">{status.title}</td>
                        <td>
                          <span className={`hr-badge hr-badge-${status.display_class ?? "neutral"}`}>
                            {status.title}
                          </span>
                        </td>
                        <td>
                          <span className={`hr-badge ${status.counts_as_absent === ATTENDANCE_STATUS_ABSENCE_FLAG.COUNTS_AS_ABSENT ? "hr-badge-success" : "hr-badge-muted"}`}>
                            {status.counts_as_absent === ATTENDANCE_STATUS_ABSENCE_FLAG.COUNTS_AS_ABSENT ? "Yes" : "No"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`profile-status ${
                              status.status === ATTENDANCE_STATUS_STATUS.ACTIVE
                                ? "status-active"
                                : "status-inactive"
                            }`}
                          >
                            {status.status === ATTENDANCE_STATUS_STATUS.ACTIVE ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="attendance_status.update"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon"
                              aria-label={`Edit ${status.title}`}
                              onClick={() => openEditModal(status)}
                            >
                              <IconEdit />
                            </button></Can>
                            <Can permission="attendance_status.delete"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn"
                              aria-label={`Delete ${status.title}`}
                              onClick={() => setStatusToDelete(status)}
                            >
                              <IconTrash />
                            </button></Can>
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

      <AttendanceStatusFormModal
        key={modalMode === "edit" && editingStatus ? `edit-${editingStatus.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingStatus ? attendanceStatusToFormValues(editingStatus) : undefined}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={statusToDelete !== null}
        title="Delete attendance status?"
        message={
          statusToDelete
            ? `This will permanently remove "${statusToDelete.title}". If any attendance records still use it, the deletion will be blocked.`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setStatusToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default AttendanceStatusesPage;
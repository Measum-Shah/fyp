import React, { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import LeaveStatusFormModal from "../components/LeaveStatusFormModal";
import { useLeaveStatuses } from "../hooks/useLeaveStatuses";
import { useNotification } from "../hooks/useNotification";
import { leaveStatusAPI } from "../services/leaveStatus.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import {
  leaveStatusToFormValues,
  toCreatePayload,
  toUpdatePayload,
} from "../services/leaveStatus.validation";
import { LEAVE_STATUS_APPROVAL_FLAG, LEAVE_STATUS_STATUS } from "../services/leaveStatus.types";
import type { LeaveStatus, LeaveStatusFormValues } from "../services/leaveStatus.types";
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

const LeaveStatusesPage: React.FC = () => {
  const { leaveStatuses, meta, page, setPage, search, changeSearch, loading, error, refetch } =
    useLeaveStatuses();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingLeaveStatus, setEditingLeaveStatus] = useState<LeaveStatus | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [leaveStatusToDelete, setLeaveStatusToDelete] = useState<LeaveStatus | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingLeaveStatus(null);
    setServerErrors({});
    setModalOpen(true);
  };

  const openEditModal = (leaveStatus: LeaveStatus) => {
    setModalMode("edit");
    setEditingLeaveStatus(leaveStatus);
    setServerErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingLeaveStatus(null);
  };

  const handleSubmit = async (values: LeaveStatusFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        const res = await leaveStatusAPI.create(toCreatePayload(values));
        notifySuccess(`"${res.data.name}" was added successfully.`);
      } else if (editingLeaveStatus) {
        const res = await leaveStatusAPI.update(editingLeaveStatus.id, toUpdatePayload(values));
        notifySuccess(`"${res.data.name}" was updated successfully.`);
      }
      setModalOpen(false);
      setEditingLeaveStatus(null);
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
    if (!leaveStatusToDelete) return;
    setDeleteLoading(true);
    try {
      await leaveStatusAPI.remove(leaveStatusToDelete.id);
      notifySuccess(`"${leaveStatusToDelete.name}" was deleted successfully.`);
      setLeaveStatusToDelete(null);
      refetch();
    } catch (err) {
      // Includes the "still referenced by leave requests" 409 case
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showBigLoadingState = loading && leaveStatuses.length === 0 && !error;
  const showErrorState = !loading && error && leaveStatuses.length === 0;
  const showEmptyState = !loading && !error && leaveStatuses.length === 0;
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
              <Link to="/hr/leave/requests" className="breadcrumb-item">Leave</Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item breadcrumb-current">Statuses</span>
            </nav>
            <h1 className="hr-page-title">Leave Statuses</h1>
          </div>

          <Can permission="leave_status.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
            <IconPlus />
            Add Leave Status
          </button></Can>
        </div>


        <div className="hr-page-toolbar">
          <SearchBar value={search} onChange={changeSearch} placeholder="Search leave statuses by name…" />
        </div>

        {showBigLoadingState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <span className="spinner-wrap">
                <span className="spinner" />
              </span>
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>
                Loading leave statuses…
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
              <p className="hr-state-title">Couldn't load leave statuses</p>
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
              <p className="hr-state-title">
                {search ? "No matching leave statuses" : "No leave statuses yet"}
              </p>
              <p className="hr-state-message">
                {search
                  ? `No leave statuses match "${search}". Try a different search term.`
                  : "Get started by adding your first leave status (e.g. Pending, Approved, Rejected)."}
              </p>
              {!search && (
                <Can permission="leave_status.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
                  <IconPlus />
                  Add Leave Status
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
                      <th>Name</th>
                      <th>Counts as Approved</th>
                      <th>Status</th>
                      <th className="hr-table-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveStatuses.map((leaveStatus) => (
                      <tr key={leaveStatus.id}>
                        <td className="hr-table-name">{leaveStatus.name}</td>
                        <td>
                          <span className={`hr-badge ${leaveStatus.counts_as_approved === LEAVE_STATUS_APPROVAL_FLAG.COUNTS_AS_APPROVED ? "hr-badge-success" : "hr-badge-muted"}`}>
                            {leaveStatus.counts_as_approved === LEAVE_STATUS_APPROVAL_FLAG.COUNTS_AS_APPROVED ? "Yes" : "No"}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`profile-status ${
                              leaveStatus.status === LEAVE_STATUS_STATUS.ACTIVE
                                ? "status-active"
                                : "status-inactive"
                            }`}
                          >
                            {leaveStatus.status === LEAVE_STATUS_STATUS.ACTIVE
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="leave_status.update"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon"
                              aria-label={`Edit ${leaveStatus.name}`}
                              onClick={() => openEditModal(leaveStatus)}
                            >
                              <IconEdit />
                            </button></Can>
                            <Can permission="leave_status.delete"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn"
                              aria-label={`Delete ${leaveStatus.name}`}
                              onClick={() => setLeaveStatusToDelete(leaveStatus)}
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

      <LeaveStatusFormModal
        key={modalMode === "edit" && editingLeaveStatus ? `edit-${editingLeaveStatus.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingLeaveStatus ? leaveStatusToFormValues(editingLeaveStatus) : undefined}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={leaveStatusToDelete !== null}
        title="Delete leave status?"
        message={
          leaveStatusToDelete
            ? `This will permanently delete "${leaveStatusToDelete.name}". This cannot be undone. If any leave requests still reference this status, the deletion will be blocked.`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setLeaveStatusToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default LeaveStatusesPage;
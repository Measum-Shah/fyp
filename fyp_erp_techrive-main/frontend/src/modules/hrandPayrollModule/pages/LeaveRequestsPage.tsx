import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import LeaveRequestFormModal from "../components/LeaveRequestFormModal";
import LeaveStatusPill from "../components/LeaveStatusPill";
import { useLeaveRequests } from "../hooks/useLeaveRequests";
import { useLeaveRequestLookups } from "../hooks/useLeaveRequestLookups";
import { useNotification } from "../hooks/useNotification";
import { leaveRequestAPI } from "../services/leaveRequest.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import {
  leaveRequestToFormValues,
  toCreatePayload,
  toUpdatePayload,
} from "../services/leaveRequest.validation";
import type { LeaveRequest, LeaveRequestFormValues } from "../services/leaveRequest.types";
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

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const LeaveRequestsPage: React.FC = () => {
  const {
    leaveRequests,
    meta,
    page,
    setPage,
    search,
    changeSearch,
    leaveStatus,
    changeLeaveStatusFilter,
    loading,
    error,
    refetch,
  } = useLeaveRequests();
  const { employees, leaveTypes, leaveStatuses, branches } = useLeaveRequestLookups();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const employeeNameById = useMemo(() => {
    const map = new Map<number, string>();
    employees.forEach((employee) => map.set(employee.id, employee.name));
    return map;
  }, [employees]);

  const leaveTypeNameById = useMemo(() => {
    const map = new Map<number, string>();
    leaveTypes.forEach((leaveType) => map.set(leaveType.id, leaveType.name));
    return map;
  }, [leaveTypes]);

  const leaveStatusNameById = useMemo(() => {
    const map = new Map<number, string>();
    leaveStatuses.forEach((status) => map.set(status.id, status.name));
    return map;
  }, [leaveStatuses]);

  const branchNameById = useMemo(() => {
    const map = new Map<number, string>();
    branches.forEach((branch) => map.set(branch.id, branch.name));
    return map;
  }, [branches]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRequest, setEditingRequest] = useState<LeaveRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [requestToDelete, setRequestToDelete] = useState<LeaveRequest | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusChangingId, setStatusChangingId] = useState<number | null>(null);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingRequest(null);
    setServerErrors({});
    setModalOpen(true);
  };

  const openEditModal = (request: LeaveRequest) => {
    setModalMode("edit");
    setEditingRequest(request);
    setServerErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingRequest(null);
  };

  const handleSubmit = async (values: LeaveRequestFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        await leaveRequestAPI.create(toCreatePayload(values));
        notifySuccess("Leave request was submitted successfully.");
      } else if (editingRequest) {
        await leaveRequestAPI.update(editingRequest.id, toUpdatePayload(values));
        notifySuccess("Leave request was updated successfully.");
      }
      setModalOpen(false);
      setEditingRequest(null);
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
    if (!requestToDelete) return;
    setDeleteLoading(true);
    try {
      await leaveRequestAPI.remove(requestToDelete.id);
      notifySuccess("Leave request was deleted successfully.");
      setRequestToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusChange = async (request: LeaveRequest, newStatusId: number) => {
    if (newStatusId === request.leave_status) return;
    setStatusChangingId(request.id);
    try {
      await leaveRequestAPI.changeStatus(request.id, { leave_status: newStatusId });
      const statusName = leaveStatusNameById.get(newStatusId) ?? "the selected status";
      notifySuccess(`Leave request marked as "${statusName}".`);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setStatusChangingId(null);
    }
  };

  const hasActiveFilters = leaveStatus !== undefined;

  const showBigLoadingState = loading && leaveRequests.length === 0 && !error;
  const showErrorState = !loading && error && leaveRequests.length === 0;
  const showEmptyState = !loading && !error && leaveRequests.length === 0;
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
              <span className="breadcrumb-item breadcrumb-current">Requests</span>
            </nav>
            <h1 className="hr-page-title">Leave Requests</h1>
          </div>

          <Can permission="leave_request.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
            <IconPlus />
            Apply for Leave
          </button></Can>
        </div>


        <div className="hr-page-toolbar">
          <SearchBar
            value={search}
            onChange={changeSearch}
            placeholder="Search by employee name, reg. no, or comments…"
          />
          <select
            className="field-input hr-select hr-filter-select"
            value={leaveStatus ?? ""}
            onChange={(e) =>
              changeLeaveStatusFilter(e.target.value === "" ? undefined : Number(e.target.value))
            }
          >
            <option value="">All statuses</option>
            {leaveStatuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
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
                Loading leave requests…
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
              <p className="hr-state-title">Couldn't load leave requests</p>
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
                {search || hasActiveFilters ? "No matching leave requests" : "No leave requests yet"}
              </p>
              <p className="hr-state-message">
                {search || hasActiveFilters
                  ? "No leave requests match your search or filters."
                  : "Get started by submitting the first leave request."}
              </p>
              {!search && !hasActiveFilters && (
                <Can permission="leave_request.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
                  <IconPlus />
                  Apply for Leave
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
                      <th>Employee</th>
                      <th>Leave Type</th>
                      <th>Campus</th>
                      <th>Dates</th>
                      <th>Days</th>
                      <th>Applied</th>
                      <th>Status</th>
                      <th className="hr-table-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="hr-table-name">
                          {employeeNameById.get(request.employee_id) ??
                            `Employee #${request.employee_id}`}
                        </td>
                        <td>
                          {leaveTypeNameById.get(request.leave_type_id) ??
                            `Leave Type #${request.leave_type_id}`}
                        </td>
                        <td>
                          {branchNameById.get(request.branch_id) ?? `Campus #${request.branch_id}`}
                        </td>
                        <td>
                          {formatDate(request.start_date)} – {formatDate(request.end_date)}
                        </td>
                        <td>{request.total_days}</td>
                        <td>{formatDate(request.applied_date)}</td>
                        <td>
                          <div className="hr-status-change">
                            <LeaveStatusPill name={leaveStatusNameById.get(request.leave_status) ?? null} />
                            <Can permission="leave_request.approve">
                              {leaveStatuses.length > 0 && (
                                <select
                                  className="hr-status-change-select"
                                  value={request.leave_status}
                                  disabled={statusChangingId === request.id}
                                  onChange={(e) => handleStatusChange(request, Number(e.target.value))}
                                  aria-label="Change leave status"
                                >
                                  {leaveStatuses.map((status) => (
                                    <option key={status.id} value={status.id}>
                                      {status.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </Can>
                          </div>
                        </td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="leave_request.update"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon"
                              aria-label="Edit leave request"
                              onClick={() => openEditModal(request)}
                            >
                              <IconEdit />
                            </button></Can>
                            <Can permission="leave_request.delete"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn"
                              aria-label="Delete leave request"
                              onClick={() => setRequestToDelete(request)}
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

      <LeaveRequestFormModal
        key={modalMode === "edit" && editingRequest ? `edit-${editingRequest.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingRequest ? leaveRequestToFormValues(editingRequest) : undefined}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={requestToDelete !== null}
        title="Delete leave request?"
        message="This will permanently delete this leave request. This cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRequestToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default LeaveRequestsPage;
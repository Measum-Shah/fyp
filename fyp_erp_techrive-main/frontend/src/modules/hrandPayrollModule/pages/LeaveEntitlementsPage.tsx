import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import LeaveEntitlementFormModal from "../components/LeaveEntitlementFormModal";
import { useLeaveEntitlements } from "../hooks/useLeaveEntitlements";
import { useLeaveEntitlementLookups } from "../hooks/useLeaveEntitlementLookups";
import { useNotification } from "../hooks/useNotification";
import { leaveEntitlementAPI } from "../services/leaveEntitlement.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import {
  leaveEntitlementToFormValues,
  toCreatePayload,
  toUpdatePayload,
} from "../services/leaveEntitlement.validation";
import { LEAVE_ENTITLEMENT_STATUS } from "../services/leaveEntitlement.types";
import type {
  LeaveEntitlement,
  LeaveEntitlementFormValues,
} from "../services/leaveEntitlement.types";
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

const LeaveEntitlementsPage: React.FC = () => {
  const {
    entitlements,
    meta,
    page,
    setPage,
    employeeId,
    changeEmployeeFilter,
    leaveTypeId,
    changeLeaveTypeFilter,
    loading,
    error,
    refetch,
  } = useLeaveEntitlements();
  const { employees, leaveTypes } = useLeaveEntitlementLookups();
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

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingEntitlement, setEditingEntitlement] = useState<LeaveEntitlement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [entitlementToDelete, setEntitlementToDelete] = useState<LeaveEntitlement | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingEntitlement(null);
    setServerErrors({});
    setModalOpen(true);
  };

  const openEditModal = (entitlement: LeaveEntitlement) => {
    setModalMode("edit");
    setEditingEntitlement(entitlement);
    setServerErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingEntitlement(null);
  };

  const handleSubmit = async (values: LeaveEntitlementFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        await leaveEntitlementAPI.create(toCreatePayload(values));
        notifySuccess("Leave entitlement was granted successfully.");
      } else if (editingEntitlement) {
        await leaveEntitlementAPI.update(editingEntitlement.id, toUpdatePayload(values));
        notifySuccess("Leave entitlement was updated successfully.");
      }
      setModalOpen(false);
      setEditingEntitlement(null);
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
    if (!entitlementToDelete) return;
    setDeleteLoading(true);
    try {
      await leaveEntitlementAPI.remove(entitlementToDelete.id);
      notifySuccess("Leave entitlement was deleted successfully.");
      setEntitlementToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasActiveFilters = employeeId !== undefined || leaveTypeId !== undefined;

  const showBigLoadingState = loading && entitlements.length === 0 && !error;
  const showErrorState = !loading && error && entitlements.length === 0;
  const showEmptyState = !loading && !error && entitlements.length === 0;
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
              <span className="breadcrumb-item breadcrumb-current">Entitlements</span>
            </nav>
            <h1 className="hr-page-title">Leave Entitlements</h1>
          </div>

          <Can permission="leave_entitlement.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
            <IconPlus />
            Grant Entitlement
          </button></Can>
        </div>


        <div className="hr-page-toolbar">
          <select
            className="field-input hr-select hr-filter-select"
            value={employeeId ?? ""}
            onChange={(e) =>
              changeEmployeeFilter(e.target.value === "" ? undefined : Number(e.target.value))
            }
          >
            <option value="">All employees</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>

          <select
            className="field-input hr-select hr-filter-select"
            value={leaveTypeId ?? ""}
            onChange={(e) =>
              changeLeaveTypeFilter(e.target.value === "" ? undefined : Number(e.target.value))
            }
          >
            <option value="">All leave types</option>
            {leaveTypes.map((leaveType) => (
              <option key={leaveType.id} value={leaveType.id}>
                {leaveType.name}
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
                Loading leave entitlements…
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
              <p className="hr-state-title">Couldn't load leave entitlements</p>
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
                {hasActiveFilters ? "No matching leave entitlements" : "No leave entitlements yet"}
              </p>
              <p className="hr-state-message">
                {hasActiveFilters
                  ? "No entitlements match the selected filters."
                  : "Grant an employee a leave balance to get started."}
              </p>
              {!hasActiveFilters && (
                <Can permission="leave_entitlement.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
                  <IconPlus />
                  Grant Entitlement
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
                      <th>Granted</th>
                      <th>Used</th>
                      <th>Remaining</th>
                      <th>Validity</th>
                      <th>Status</th>
                      <th className="hr-table-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entitlements.map((entitlement) => (
                      <tr key={entitlement.id}>
                        <td className="hr-table-name">
                          {employeeNameById.get(entitlement.employee_id) ??
                            `Employee #${entitlement.employee_id}`}
                        </td>
                        <td>
                          {leaveTypeNameById.get(entitlement.leave_type_id) ??
                            `Leave Type #${entitlement.leave_type_id}`}
                        </td>
                        <td>{entitlement.no_of_days}</td>
                        <td>{entitlement.days_used}</td>
                        <td>{Math.max(0, entitlement.no_of_days - entitlement.days_used)}</td>
                        <td>
                          {entitlement.start_date || entitlement.end_date
                            ? `${formatDate(entitlement.start_date)} – ${formatDate(entitlement.end_date)}`
                            : "—"}
                        </td>
                        <td>
                          <span
                            className={`profile-status ${
                              entitlement.status === LEAVE_ENTITLEMENT_STATUS.ACTIVE
                                ? "status-active"
                                : "status-inactive"
                            }`}
                          >
                            {entitlement.status === LEAVE_ENTITLEMENT_STATUS.ACTIVE
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="leave_entitlement.update"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon"
                              aria-label="Edit entitlement"
                              onClick={() => openEditModal(entitlement)}
                            >
                              <IconEdit />
                            </button></Can>
                            <Can permission="leave_entitlement.delete"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn"
                              aria-label="Delete entitlement"
                              onClick={() => setEntitlementToDelete(entitlement)}
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

      <LeaveEntitlementFormModal
        key={modalMode === "edit" && editingEntitlement ? `edit-${editingEntitlement.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={
          editingEntitlement ? leaveEntitlementToFormValues(editingEntitlement) : undefined
        }
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={entitlementToDelete !== null}
        title="Delete leave entitlement?"
        message="This will permanently delete this leave entitlement record. This cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setEntitlementToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default LeaveEntitlementsPage;
import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import LoanRequestFormModal from "../components/LoanRequestFormModal";
import LoanRequestStatusPill from "../components/LoanRequestStatusPill";
import { useLoanRequests } from "../hooks/useLoanRequests";
import { useLoanRequestLookups } from "../hooks/useLoanRequestLookups";
import { useNotification } from "../hooks/useNotification";
import { loanRequestAPI } from "../services/loanRequest.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import {
  loanRequestToFormValues,
  toCreatePayload,
  toUpdatePayload,
} from "../services/loanRequest.validation";
import {
  LOAN_REQUEST_STATUS,
  LOAN_REQUEST_STATUS_LABELS,
} from "../services/loanRequest.types";
import type { LoanRequest, LoanRequestFormValues } from "../services/loanRequest.types";
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

const formatMoney = (value: number | null): string =>
  value == null ? "—" : value.toLocaleString(undefined, { maximumFractionDigits: 0 });

// ─── LoanRequestsPage ────────────────────────────────────────────────────
// Employee loan/advance requests, straight from request_loan_employee — see
// loanRequest.constants.ts on the backend for why this table (not
// erp_loans/erp_loan_plans) is the real entity. The listing surfaces the
// HR/manager `status` dropdown (Pending/Approved/Rejected) as the single
// approval control. There used to be a second, independent
// `approved_by_ceo` sign-off gating payroll deduction too, but it had no
// reachable UI control (removed from this view during an earlier cleanup
// without updating payrollRun.service.ts to match) — which meant it could
// never actually be set, which meant no loan was ever deducted from
// payroll, period. Removed entirely, front and back, at the user's
// request; `status` alone is now the single approval gate — see
// payrollRun.service.ts's computeLoanDeduction.
const LoanRequestsPage: React.FC = () => {
  const {
    loanRequests,
    meta,
    page,
    setPage,
    search,
    changeSearch,
    status,
    changeStatusFilter,
    loading,
    error,
    refetch,
  } = useLoanRequests();
  const { employees, branches } = useLoanRequestLookups();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const employeeNameById = useMemo(() => {
    const map = new Map<number, string>();
    employees.forEach((employee) => map.set(employee.id, employee.name));
    return map;
  }, [employees]);

  const branchNameById = useMemo(() => {
    const map = new Map<number, string>();
    branches.forEach((branch) => map.set(branch.id, branch.name));
    return map;
  }, [branches]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRequest, setEditingRequest] = useState<LoanRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [requestToDelete, setRequestToDelete] = useState<LoanRequest | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusChangingId, setStatusChangingId] = useState<number | null>(null);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingRequest(null);
    setServerErrors({});
    setModalOpen(true);
  };

  const openEditModal = (request: LoanRequest) => {
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

  const handleSubmit = async (values: LoanRequestFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        await loanRequestAPI.create(toCreatePayload(values));
        notifySuccess("Loan request was submitted successfully.");
      } else if (editingRequest) {
        await loanRequestAPI.update(editingRequest.id, toUpdatePayload(values));
        notifySuccess("Loan request was updated successfully.");
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
      await loanRequestAPI.remove(requestToDelete.id);
      notifySuccess("Loan request was deleted successfully.");
      setRequestToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleStatusChange = async (request: LoanRequest, newStatus: number) => {
    if (newStatus === request.status) return;
    setStatusChangingId(request.id);
    try {
      await loanRequestAPI.changeStatus(request.id, { status: newStatus });
      notifySuccess(`Loan request marked as "${LOAN_REQUEST_STATUS_LABELS[newStatus]}".`);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setStatusChangingId(null);
    }
  };

  const hasActiveFilters = status !== undefined;

  const showBigLoadingState = loading && loanRequests.length === 0 && !error;
  const showErrorState = !loading && error && loanRequests.length === 0;
  const showEmptyState = !loading && !error && loanRequests.length === 0;
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
              <span className="breadcrumb-item breadcrumb-current">Loan Requests</span>
            </nav>
            <h1 className="hr-page-title">Loan Requests</h1>
          </div>

          <Can permission="loan_request.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
            <IconPlus />
            New Loan Request
          </button></Can>
        </div>


        <div className="hr-page-toolbar">
          <SearchBar
            value={search}
            onChange={changeSearch}
            placeholder="Search by employee name, reg. no, type, or reason…"
          />
          <select
            className="field-input hr-select hr-filter-select"
            value={status ?? ""}
            onChange={(e) =>
              changeStatusFilter(e.target.value === "" ? undefined : Number(e.target.value))
            }
          >
            <option value="">All statuses</option>
            <option value={LOAN_REQUEST_STATUS.PENDING}>Pending</option>
            <option value={LOAN_REQUEST_STATUS.APPROVED}>Approved</option>
            <option value={LOAN_REQUEST_STATUS.REJECTED}>Rejected</option>
          </select>
        </div>

        {showBigLoadingState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <span className="spinner-wrap">
                <span className="spinner" />
              </span>
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>
                Loading loan requests…
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
              <p className="hr-state-title">Couldn't load loan requests</p>
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
                {search || hasActiveFilters ? "No matching loan requests" : "No loan requests yet"}
              </p>
              <p className="hr-state-message">
                {search || hasActiveFilters
                  ? "No loan requests match your search or filters."
                  : "Get started by submitting the first loan request."}
              </p>
              {!search && !hasActiveFilters && (
                <Can permission="loan_request.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
                  <IconPlus />
                  New Loan Request
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
                      <th>Campus</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Installments</th>
                      <th>Effective From</th>
                      <th>Status</th>
                      <th className="hr-table-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loanRequests.map((request) => (
                      <tr key={request.id}>
                        <td className="hr-table-name">
                          {employeeNameById.get(request.staff_id) ?? `Employee #${request.staff_id}`}
                        </td>
                        <td>{branchNameById.get(request.branch_id) ?? `Campus #${request.branch_id}`}</td>
                        <td>{request.type}</td>
                        <td>{formatMoney(request.amount)}</td>
                        <td>
                          {request.installments}
                          {request.monthly_installment != null
                            ? ` (${formatMoney(request.monthly_installment)}/mo)`
                            : ""}
                        </td>
                        <td>{formatDate(request.effective_from)}</td>
                        <td>
                          <div className="hr-status-change">
                            <LoanRequestStatusPill status={request.status} />
                            <Can permission="loan_request.approve">
                              <select
                                className="hr-status-change-select"
                                value={request.status}
                                disabled={statusChangingId === request.id}
                                onChange={(e) => handleStatusChange(request, Number(e.target.value))}
                                aria-label="Change loan request status"
                              >
                                <option value={LOAN_REQUEST_STATUS.PENDING}>Pending</option>
                                <option value={LOAN_REQUEST_STATUS.APPROVED}>Approved</option>
                                <option value={LOAN_REQUEST_STATUS.REJECTED}>Rejected</option>
                              </select>
                            </Can>
                          </div>
                        </td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="loan_request.update"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon"
                              aria-label="Edit loan request"
                              onClick={() => openEditModal(request)}
                            >
                              <IconEdit />
                            </button></Can>
                            <Can permission="loan_request.delete"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn"
                              aria-label="Delete loan request"
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

      <LoanRequestFormModal
        key={modalMode === "edit" && editingRequest ? `edit-${editingRequest.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingRequest ? loanRequestToFormValues(editingRequest) : undefined}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={requestToDelete !== null}
        title="Delete loan request?"
        message="This will delete this loan request. This can be restored by an administrator if needed."
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRequestToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default LoanRequestsPage;

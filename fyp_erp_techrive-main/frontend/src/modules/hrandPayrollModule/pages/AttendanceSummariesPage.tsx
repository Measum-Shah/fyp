import React, { useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import AttendanceSummaryFormModal from "../components/AttendanceSummaryFormModal";
import ApprovalModal from "../components/ApprovalModal";
import AttendanceSummaryDetailModal from "../components/AttendanceSummaryDetailModal";
import { useAttendanceSummaries } from "../hooks/useAttendanceSummaries";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { useMonthsLookup } from "../hooks/useMonthsLookup";
import { useYearsLookup } from "../hooks/useYearsLookup";
import { useStaffLookup } from "../hooks/useStaffLookup";
import { useLookups } from "../hooks/useLookups";
import { useNotification } from "../hooks/useNotification";
import { attendanceSummaryAPI } from "../services/attendanceSummary.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import {
  summaryToFormValues,
  toCreatePayload,
  toUpdatePayload,
} from "../services/attendanceSummary.validation";
import {
  APPROVED_STATUS_BADGE_CLASS,
  PAY_STATUS_BADGE_CLASS,
  PAY_STATUS_OPTIONS,
  APPROVED_STATUS_OPTIONS,
} from "../services/attendanceSummary.constants";
import type { ApprovedStatus, PayStatus } from "../services/attendanceSummary.constants";
import type { AttendanceSummaryFilters } from "../hooks/useAttendanceSummaries";
import type { AttendanceSummary, AttendanceSummaryFormValues, SetApprovalPayload } from "../services/attendanceSummary.types";
import "./employee-module.css";
import { Can } from "../components/Can";

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
const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const AttendanceSummariesPage: React.FC = () => {
  const { summaries, meta, page, setPage, filters, changeFilters, loading, error, refetch } =
    useAttendanceSummaries();

  // Company → Branch cascade for the toolbar filter (see the Company→Branch
  // scoping task). AttendanceSummaryFormModal has its own independent
  // Company selector for the create/edit form.
  const [filterCompanyId, setFilterCompanyId] = useState<number | null>(null);
  const { companies } = useCompanyLookup();
  const { branches } = useBranchesLookup(filterCompanyId);
  const { months } = useMonthsLookup();
  const { years } = useYearsLookup();
  const { staff, loading: staffLoading } = useStaffLookup();
  const { designations, loading: designationsLoading } = useLookups();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingSummary, setEditingSummary] = useState<AttendanceSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [summaryToDelete, setSummaryToDelete] = useState<AttendanceSummary | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [approvalTarget, setApprovalTarget] = useState<AttendanceSummary | null>(null);
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [approvalServerErrors, setApprovalServerErrors] = useState<Record<string, string>>({});

  const [viewTarget, setViewTarget] = useState<AttendanceSummary | null>(null);

  const openCreateModal = () => {
    setModalMode("create");
    setEditingSummary(null);
    setServerErrors({});
    setModalOpen(true);
  };
  const openEditModal = (summary: AttendanceSummary) => {
    setModalMode("edit");
    setEditingSummary(summary);
    setServerErrors({});
    setModalOpen(true);
  };
  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingSummary(null);
  };

  const handleSubmit = async (values: AttendanceSummaryFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        await attendanceSummaryAPI.create(toCreatePayload(values));
        notifySuccess("Attendance summary was added successfully.");
      } else if (editingSummary) {
        await attendanceSummaryAPI.update(editingSummary.id, toUpdatePayload(values));
        notifySuccess("Attendance summary was updated successfully.");
      }
      setModalOpen(false);
      setEditingSummary(null);
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
    if (!summaryToDelete) return;
    setDeleteLoading(true);
    try {
      await attendanceSummaryAPI.remove(summaryToDelete.id);
      notifySuccess("Attendance summary was deleted successfully.");
      setSummaryToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleApprovalSubmit = async (values: SetApprovalPayload) => {
    if (!approvalTarget) return;
    setApprovalSubmitting(true);
    setApprovalServerErrors({});
    try {
      await attendanceSummaryAPI.setApproval(approvalTarget.id, values);
      notifySuccess("Approval status was updated successfully.");
      setApprovalTarget(null);
      refetch();
    } catch (err) {
      const fieldErrors = getApiFieldErrors(err);
      if (fieldErrors) setApprovalServerErrors(fieldErrors);
      notifyError(getApiErrorMessage(err));
    } finally {
      setApprovalSubmitting(false);
    }
  };

  const updateFilter = (patch: Partial<AttendanceSummaryFilters>) => {
    changeFilters({ ...filters, ...patch });
  };

  const showBigLoadingState = loading && summaries.length === 0 && !error;
  const showErrorState = !loading && error && summaries.length === 0;
  const showEmptyState = !loading && !error && summaries.length === 0;
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
              <span className="breadcrumb-item breadcrumb-current">Attendance Summaries</span>
            </nav>
            <h1 className="hr-page-title">Attendance Summaries</h1>
          </div>
          <Can permission="attendance_summary.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
            <IconPlus />
            Add Summary
          </button></Can>
        </div>


        <div className="hr-page-toolbar hr-attendance-filters">
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
            value={filters.month_id ?? ""}
            onChange={(e) => updateFilter({ month_id: e.target.value ? Number(e.target.value) : undefined })}
            aria-label="Filter by month"
          >
            <option value="">All months</option>
            {months.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>
          <select
            className="field-input hr-select"
            value={filters.year_id ?? ""}
            onChange={(e) => updateFilter({ year_id: e.target.value ? Number(e.target.value) : undefined })}
            aria-label="Filter by year"
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>
                {y.title}
              </option>
            ))}
          </select>
          <select
            className="field-input hr-select"
            value={filters.pay_status ?? ""}
            onChange={(e) => updateFilter({ pay_status: e.target.value || undefined })}
            aria-label="Filter by pay status"
          >
            <option value="">All pay statuses</option>
            {PAY_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="field-input hr-select"
            value={filters.approved_status ?? ""}
            onChange={(e) => updateFilter({ approved_status: e.target.value || undefined })}
            aria-label="Filter by approval status"
          >
            <option value="">All approval statuses</option>
            {APPROVED_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
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
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>Loading attendance summaries…</p>
            </div>
          </div>
        )}

        {showErrorState && (
          <div className="hr-table-wrap">
            <div className="hr-state hr-state-error">
              <div className="hr-state-icon">
                <IconAlertTriangle />
              </div>
              <p className="hr-state-title">Couldn't load attendance summaries</p>
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
              <p className="hr-state-title">No attendance summaries found</p>
              <p className="hr-state-message">
                Try widening your filters, or add a summary for an employee's month to get started.
              </p>
              <Can permission="attendance_summary.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
                <IconPlus />
                Add Summary
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
                      <th>Period</th>
                      <th>Total Absents</th>
                      <th>Pay Status</th>
                      <th>Approval</th>
                      <th className="hr-table-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaries.map((summary) => (
                      <tr key={summary.id}>
                        <td className="hr-table-name">
                          {summary.employee?.name ?? `Employee #${summary.staff_id}`}
                          {summary.employee?.reg_no ? ` (${summary.employee.reg_no})` : ""}
                        </td>
                        <td>
                          {summary.month_title ?? `#${summary.month_id}`} {summary.year_title ?? `#${summary.year_id}`}
                        </td>
                        <td>{summary.total_absents ?? 0}</td>
                        <td>
                          <span className={`hr-badge ${PAY_STATUS_BADGE_CLASS[summary.pay_status as PayStatus] ?? "hr-badge-neutral"}`}>
                            {summary.pay_status}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`hr-badge ${
                              APPROVED_STATUS_BADGE_CLASS[summary.approved_status as ApprovedStatus] ?? "hr-badge-neutral"
                            }`}
                          >
                            {summary.approved_status ?? "Pending"}
                          </span>
                        </td>
                        <td>
                          <div className="hr-table-actions">
                            <button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-sm"
                              onClick={() => setViewTarget(summary)}
                            >
                              <IconEye />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
          </>
        )}
      </div>

      <Toast notifications={notifications} onDismiss={dismiss} />

      <AttendanceSummaryFormModal
        key={modalMode === "edit" && editingSummary ? `edit-${editingSummary.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingSummary ? summaryToFormValues(editingSummary) : undefined}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ApprovalModal
        open={approvalTarget !== null}
        currentStatus={approvalTarget?.approved_status ?? null}
        currentApprovedByEmployeeId={approvalTarget?.approved_by_employee_id ?? null}
        currentApprovedByDesignationId={approvalTarget?.approved_by_designation_id ?? null}
        staff={staff}
        staffLoading={staffLoading}
        designations={designations}
        designationsLoading={designationsLoading}
        submitting={approvalSubmitting}
        serverErrors={approvalServerErrors}
        onSubmit={handleApprovalSubmit}
        onCancel={() => setApprovalTarget(null)}
      />

      <ConfirmDialog
        open={summaryToDelete !== null}
        title="Delete attendance summary?"
        message="This will permanently remove this attendance summary. This action cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setSummaryToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      <AttendanceSummaryDetailModal
        open={viewTarget !== null}
        summary={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={(summary) => {
          setViewTarget(null);
          openEditModal(summary);
        }}
        onApprove={(summary) => {
          setViewTarget(null);
          setApprovalServerErrors({});
          setApprovalTarget(summary);
        }}
        onDelete={(summary) => {
          setViewTarget(null);
          setSummaryToDelete(summary);
        }}
      />
    </div>
  );
};

export default AttendanceSummariesPage;

import React, { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import WorkShiftFormModal from "../components/WorkShiftFormModal";
import { useWorkShifts } from "../hooks/useWorkShifts";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { useNotification } from "../hooks/useNotification";
import { workShiftAPI } from "../services/workShift.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import {
  toCreatePayload,
  toUpdatePayload,
  workShiftToFormValues,
} from "../services/workShift.validation";
import { WORK_SHIFT_STATUS } from "../services/workShift.types";
import { WORK_WEEK_DAYS_ORDERED } from "../services/workShift.constants";
import type { WorkShift, WorkShiftFormValues } from "../services/workShift.types";
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

const IconClock = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
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

// Renders each shift's week as compact "Mon–Fri 09:00–17:00" style groups
// instead of a raw 7-cell dump, so the list stays scannable.
const formatWeekSummary = (shift: WorkShift): string => {
  const byDay = new Map(shift.week.map((d) => [d.day, d]));
  const groups: string[] = [];
  let runStart: number | null = null;
  let runLabel = "";

  const flush = (endDayIndex: number) => {
    if (runStart === null) return;
    const startLabel = WORK_WEEK_DAYS_ORDERED[runStart].short;
    const endLabel = WORK_WEEK_DAYS_ORDERED[endDayIndex].short;
    const dayRange = runStart === endDayIndex ? startLabel : `${startLabel}\u2013${endLabel}`;
    groups.push(`${dayRange} ${runLabel}`);
    runStart = null;
  };

  WORK_WEEK_DAYS_ORDERED.forEach(({ day }, idx) => {
    const entry = byDay.get(day);
    const label = entry && entry.on_off ? `${entry.start_time}\u2013${entry.end_time}` : "Off";

    if (label === runLabel) {
      // extend current run
    } else {
      flush(idx - 1);
      runStart = idx;
      runLabel = label;
    }
  });
  flush(WORK_WEEK_DAYS_ORDERED.length - 1);

  return groups.join(", ");
};

const WorkShiftsPage: React.FC = () => {
  const {
    workShifts,
    meta,
    page,
    setPage,
    search,
    changeSearch,
    loading,
    error,
    refetch,
  } = useWorkShifts();
  const { branches } = useBranchesLookup();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingShift, setEditingShift] = useState<WorkShift | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [shiftToDelete, setShiftToDelete] = useState<WorkShift | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const branchName = (branch_id: number | null) =>
    branch_id == null ? "All campuses" : branches.find((b) => b.id === branch_id)?.name ?? `#${branch_id}`;

  const openCreateModal = () => {
    setModalMode("create");
    setEditingShift(null);
    setServerErrors({});
    setModalOpen(true);
  };

  const openEditModal = (shift: WorkShift) => {
    setModalMode("edit");
    setEditingShift(shift);
    setServerErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingShift(null);
  };

  const handleSubmit = async (values: WorkShiftFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        const res = await workShiftAPI.create(toCreatePayload(values));
        notifySuccess(`"${res.data.name}" was added successfully.`);
      } else if (editingShift) {
        const res = await workShiftAPI.update(editingShift.id, toUpdatePayload(values));
        notifySuccess(`"${res.data.name}" was updated successfully.`);
      }
      setModalOpen(false);
      setEditingShift(null);
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
    if (!shiftToDelete) return;
    setDeleteLoading(true);
    try {
      await workShiftAPI.remove(shiftToDelete.id);
      notifySuccess(`"${shiftToDelete.name}" was deleted successfully.`);
      setShiftToDelete(null);
      refetch();
    } catch (err) {
      // Includes the "still assigned to employees" 409 case from the backend
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showBigLoadingState = loading && workShifts.length === 0 && !error;
  const showErrorState = !loading && error && workShifts.length === 0;
  const showEmptyState = !loading && !error && workShifts.length === 0;
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
              <span className="breadcrumb-item breadcrumb-current">Work Shifts</span>
            </nav>
            <h1 className="hr-page-title">Work Shifts</h1>
          </div>

          <Can permission="work_shift.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
            <IconPlus />
            Add Shift
          </button></Can>
        </div>


        <div className="hr-page-toolbar">
          <SearchBar value={search} onChange={changeSearch} placeholder="Search shifts by name…" />
        </div>

        {showBigLoadingState && (
          <div className="hr-table-wrap">
            <div className="hr-state">
              <span className="spinner-wrap">
                <span className="spinner" />
              </span>
              <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>
                Loading work shifts…
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
              <p className="hr-state-title">Couldn't load work shifts</p>
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
                <IconClock />
              </div>
              <p className="hr-state-title">
                {search ? "No matching shifts" : "No work shifts yet"}
              </p>
              <p className="hr-state-message">
                {search
                  ? `No shifts match "${search}". Try a different search term.`
                  : "Get started by adding your first work shift."}
              </p>
              {!search && (
                <Can permission="work_shift.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
                  <IconPlus />
                  Add Shift
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
                      <th>Campus</th>
                      <th>Weekly Schedule</th>
                      <th>Grace In/Out</th>
                      <th>Status</th>
                      <th className="hr-table-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workShifts.map((shift) => (
                      <tr key={shift.id}>
                        <td className="hr-table-name">{shift.name}</td>
                        <td>{branchName(shift.branch_id)}</td>
                        <td className="hr-table-mono">{formatWeekSummary(shift)}</td>
                        <td>
                          {shift.grace_in ?? 0}m / {shift.grace_out ?? 0}m
                        </td>
                        <td>
                          <span
                            className={`profile-status ${
                              shift.status === WORK_SHIFT_STATUS.ACTIVE
                                ? "status-active"
                                : "status-inactive"
                            }`}
                          >
                            {shift.status === WORK_SHIFT_STATUS.ACTIVE ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="work_shift.update"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon"
                              aria-label={`Edit ${shift.name}`}
                              onClick={() => openEditModal(shift)}
                            >
                              <IconEdit />
                            </button></Can>
                            <Can permission="work_shift.delete"><button
                              type="button"
                              className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn"
                              aria-label={`Delete ${shift.name}`}
                              onClick={() => setShiftToDelete(shift)}
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

      <WorkShiftFormModal
        key={modalMode === "edit" && editingShift ? `edit-${editingShift.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingShift ? workShiftToFormValues(editingShift) : undefined}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={shiftToDelete !== null}
        title="Delete work shift?"
        message={
          shiftToDelete
            ? `This will deactivate "${shiftToDelete.name}". If any employees are still assigned to this shift, the deletion will be blocked.`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setShiftToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default WorkShiftsPage;
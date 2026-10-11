import React, { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import PerformanceFormModal from "./PerformanceFormModal";
import Toast from "./Toast";
import { usePerformancesByStaff } from "../hooks/usePerformancesByStaff";
import { useNotification } from "../hooks/useNotification";
import { performanceAPI } from "../services/performance.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import { performanceToFormValues, toCreatePayload, toUpdatePayload } from "../services/performance.validation";
import { EMPTY_PERFORMANCE_FORM_VALUES, MONTH_OPTIONS } from "../services/performance.types";
import type { Performance, PerformanceFormValues } from "../services/performance.types";
import { Can } from "./Can";

interface PerformancePanelProps {
  employeeId: number;
  employeeName: string;
}

const IconPlus = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const IconEdit = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>);
const IconTrash = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);

const monthLabel = (value: string | null): string =>
  MONTH_OPTIONS.find((m) => m.value === value)?.label ?? (value || "—");

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

// ─── PerformancePanel ─────────────────────────────────────────────────────────
// Embedded in the Employee Profile page's "Performance Reviews" tab. Mirrors
// StaffQualificationsPanel's structure, reusing the existing
// PerformanceFormModal (previously only used by the standalone
// PerformancesPage) by locking its "Employee" picker to a single option.
const PerformancePanel: React.FC<PerformancePanelProps> = ({ employeeId, employeeName }) => {
  const { performances, loading, error, refetch } = usePerformancesByStaff(employeeId);
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<Performance | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [recordToDelete, setRecordToDelete] = useState<Performance | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const staffOptions = [{ id: employeeId, name: employeeName }];

  const openCreateModal = () => { setModalMode("create"); setEditingRecord(null); setServerErrors({}); setModalOpen(true); };
  const openEditModal = (record: Performance) => { setModalMode("edit"); setEditingRecord(record); setServerErrors({}); setModalOpen(true); };
  const closeModal = () => { if (submitting) return; setModalOpen(false); setEditingRecord(null); };

  const handleSubmit = async (values: PerformanceFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        await performanceAPI.create(toCreatePayload(values));
        notifySuccess("Performance review was added successfully.");
      } else if (editingRecord) {
        await performanceAPI.update(editingRecord.id, toUpdatePayload(values));
        notifySuccess("Performance review was updated successfully.");
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
      await performanceAPI.remove(recordToDelete.id);
      notifySuccess("Performance review was deleted successfully.");
      setRecordToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div className="hr-subsection-header">
        <h3 className="hr-form-section-title" style={{ margin: 0 }}>Performance Reviews</h3>
        <Can permission="performance.create"><button type="button" className="hr-btn hr-btn-secondary hr-btn-sm" onClick={openCreateModal}>
          <IconPlus />Add Review
        </button></Can>
      </div>

      {loading && <p className="hr-field-hint">Loading performance reviews…</p>}
      {!loading && error && <p className="hr-field-error">{error}</p>}
      {!loading && !error && performances.length === 0 && (
        <p className="hr-field-hint">No performance reviews have been added for this employee yet.</p>
      )}

      {!loading && !error && performances.length > 0 && (
        <div className="hr-table-wrap hr-table-wrap-compact">
          <table className="hr-table">
            <thead>
              <tr>
                <th>Month</th>
                <th>Date</th>
                <th>Performance</th>
                <th className="hr-table-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {performances.map((record) => (
                <tr key={record.id}>
                  <td className="hr-table-name">{monthLabel(record.month)}</td>
                  <td>{formatDate(record.date)}</td>
                  <td>{record.performance || record.student_feedback || "—"}</td>
                  <td>
                    <div className="hr-table-actions">
                      <Can permission="performance.update"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label="Edit performance review" onClick={() => openEditModal(record)}><IconEdit /></button></Can>
                      <Can permission="performance.delete"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label="Delete performance review" onClick={() => setRecordToDelete(record)}><IconTrash /></button></Can>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toast notifications={notifications} onDismiss={dismiss} />

      <PerformanceFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        staff={staffOptions}
        initialValues={
          editingRecord
            ? performanceToFormValues(editingRecord)
            : { ...EMPTY_PERFORMANCE_FORM_VALUES, staff_id: String(employeeId) }
        }
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Delete performance review?"
        message="This will permanently delete this performance review. This action cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default PerformancePanel;

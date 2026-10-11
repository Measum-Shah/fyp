import React, { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import ExperienceFormModal from "./ExperienceFormModal";
import Toast from "./Toast";
import { useExperiencesByStaff } from "../hooks/useExperiencesByStaff";
import { useNotification } from "../hooks/useNotification";
import { experienceAPI } from "../services/experience.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import { experienceToFormValues, toCreatePayload, toUpdatePayload } from "../services/experience.validation";
import { EMPTY_EXPERIENCE_FORM_VALUES } from "../services/experience.types";
import type { Experience, ExperienceFormValues } from "../services/experience.types";
import { Can } from "./Can";

interface ExperiencesPanelProps {
  employeeId: number;
  employeeName: string;
}

const IconPlus = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const IconEdit = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>);
const IconTrash = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

// ─── ExperiencesPanel ─────────────────────────────────────────────────────────
// Embedded in the Employee Profile page's "Experience" tab. Mirrors
// StaffQualificationsPanel's structure, reusing the existing
// ExperienceFormModal (previously only used by the standalone
// ExperiencesPage) by locking its "Employee" picker to a single option.
const ExperiencesPanel: React.FC<ExperiencesPanelProps> = ({ employeeId, employeeName }) => {
  const { experiences, loading, error, refetch } = useExperiencesByStaff(employeeId);
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<Experience | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [recordToDelete, setRecordToDelete] = useState<Experience | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const staffOptions = [{ id: employeeId, name: employeeName }];

  const openCreateModal = () => { setModalMode("create"); setEditingRecord(null); setServerErrors({}); setModalOpen(true); };
  const openEditModal = (record: Experience) => { setModalMode("edit"); setEditingRecord(record); setServerErrors({}); setModalOpen(true); };
  const closeModal = () => { if (submitting) return; setModalOpen(false); setEditingRecord(null); };

  const handleSubmit = async (values: ExperienceFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        await experienceAPI.create(toCreatePayload(values));
        notifySuccess("Experience record was added successfully.");
      } else if (editingRecord) {
        await experienceAPI.update(editingRecord.id, toUpdatePayload(values));
        notifySuccess("Experience record was updated successfully.");
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
      await experienceAPI.remove(recordToDelete.id);
      notifySuccess("Experience record was deleted successfully.");
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
        <h3 className="hr-form-section-title" style={{ margin: 0 }}>Experience</h3>
        <Can permission="experience.create"><button type="button" className="hr-btn hr-btn-secondary hr-btn-sm" onClick={openCreateModal}>
          <IconPlus />Add Experience
        </button></Can>
      </div>

      {loading && <p className="hr-field-hint">Loading experience records…</p>}
      {!loading && error && <p className="hr-field-error">{error}</p>}
      {!loading && !error && experiences.length === 0 && (
        <p className="hr-field-hint">No previous experience has been added for this employee yet.</p>
      )}

      {!loading && !error && experiences.length > 0 && (
        <div className="hr-table-wrap hr-table-wrap-compact">
          <table className="hr-table">
            <thead>
              <tr>
                <th>Company / Employer</th>
                <th>Designation</th>
                <th>From</th>
                <th>To</th>
                <th className="hr-table-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {experiences.map((record) => (
                <tr key={record.id}>
                  <td className="hr-table-name">{record.name}</td>
                  <td>{record.designation}</td>
                  <td>{formatDate(record.from_date)}</td>
                  <td>{formatDate(record.to_date)}</td>
                  <td>
                    <div className="hr-table-actions">
                      <Can permission="experience.update"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label="Edit experience" onClick={() => openEditModal(record)}><IconEdit /></button></Can>
                      <Can permission="experience.delete"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label="Delete experience" onClick={() => setRecordToDelete(record)}><IconTrash /></button></Can>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toast notifications={notifications} onDismiss={dismiss} />

      <ExperienceFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        staff={staffOptions}
        initialValues={
          editingRecord
            ? experienceToFormValues(editingRecord)
            : { ...EMPTY_EXPERIENCE_FORM_VALUES, staff_id: String(employeeId) }
        }
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Delete experience record?"
        message="This will permanently delete this experience record. This action cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default ExperiencesPanel;

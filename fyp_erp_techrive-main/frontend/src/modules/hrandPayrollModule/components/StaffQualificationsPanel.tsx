import React, { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import StaffQualificationFormModal from "./StaffQualificationFormModal";
import { useStaffQualifications } from "../hooks/useStaffQualifications";
import { useNotification } from "../hooks/useNotification";
import Toast from "./Toast";
import { staffQualificationAPI, resolveAttachmentUrl } from "../services/staffQualification.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import {
  staffQualificationToFormValues,
  toCreatePayload,
  toUpdatePayload,
} from "../services/staffQualification.validation";
import type {
  StaffQualification,
  StaffQualificationFormValues,
} from "../services/staffQualification.types";
import { Can } from "./Can";

interface StaffQualificationsPanelProps {
  employeeId: number;
  employeeName: string;
}

const IconPlus = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const IconEdit = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>);
const IconTrash = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);
const IconFile = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>);

const StaffQualificationsPanel: React.FC<StaffQualificationsPanelProps> = ({ employeeId, employeeName }) => {
  const { qualifications, loading, error, refetch } = useStaffQualifications(employeeId);
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<StaffQualification | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [recordToDelete, setRecordToDelete] = useState<StaffQualification | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreateModal = () => { setModalMode("create"); setEditingRecord(null); setServerErrors({}); setModalOpen(true); };
  const openEditModal = (record: StaffQualification) => { setModalMode("edit"); setEditingRecord(record); setServerErrors({}); setModalOpen(true); };
  const closeModal = () => { if (submitting) return; setModalOpen(false); setEditingRecord(null); };

  const handleSubmit = async (values: StaffQualificationFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        await staffQualificationAPI.create(toCreatePayload(employeeId, values));
        notifySuccess("Qualification was added successfully.");
      } else if (editingRecord) {
        await staffQualificationAPI.update(editingRecord.id, toUpdatePayload(employeeId, values));
        notifySuccess("Qualification was updated successfully.");
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
      await staffQualificationAPI.remove(recordToDelete.id);
      notifySuccess("Qualification was deleted successfully.");
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
        <h3 className="hr-form-section-title" style={{ margin: 0 }}>Qualifications</h3>
        <Can permission="staff_qualification.create"><button type="button" className="hr-btn hr-btn-secondary hr-btn-sm" onClick={openCreateModal}>
          <IconPlus />Add Qualification
        </button></Can>
      </div>

      {loading && <p className="hr-field-hint">Loading qualifications…</p>}
      {!loading && error && <p className="hr-field-error">{error}</p>}
      {!loading && !error && qualifications.length === 0 && (
        <p className="hr-field-hint">No qualifications have been added for this employee yet.</p>
      )}

      {!loading && !error && qualifications.length > 0 && (
        <div className="hr-table-wrap hr-table-wrap-compact">
          <table className="hr-table">
            <thead>
              <tr>
                <th>Degree</th>
                <th>Institute</th>
                <th>Board / University</th>
                <th>Year</th>
                <th>Grade / CGPA</th>
                <th>Attachment</th>
                <th className="hr-table-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {qualifications.map((record) => {
                const attachmentUrl = resolveAttachmentUrl(record.attachment);
                return (
                  <tr key={record.id}>
                    <td className="hr-table-name">{record.degree}</td>
                    <td>{record.institute ?? "—"}</td>
                    <td>{record.board_or_university ?? "—"}</td>
                    <td>{record.passing_year ?? "—"}</td>
                    <td>{record.grade_or_cgpa ?? "—"}</td>
                    <td>
                      {attachmentUrl ? (
                        <a href={attachmentUrl} target="_blank" rel="noreferrer" className="hr-attachment-link">
                          <IconFile />View
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <div className="hr-table-actions">
                        <Can permission="staff_qualification.update"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label="Edit qualification" onClick={() => openEditModal(record)}><IconEdit /></button></Can>
                        <Can permission="staff_qualification.delete"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label="Delete qualification" onClick={() => setRecordToDelete(record)}><IconTrash /></button></Can>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Toast notifications={notifications} onDismiss={dismiss} />

      <StaffQualificationFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        employeeName={employeeName}
        initialValues={editingRecord ? staffQualificationToFormValues(editingRecord) : undefined}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Delete qualification?"
        message="This will permanently delete this qualification record. This action cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default StaffQualificationsPanel;

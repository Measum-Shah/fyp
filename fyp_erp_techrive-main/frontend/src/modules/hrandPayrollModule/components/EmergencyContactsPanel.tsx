import React, { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import EmergencyContactFormModal from "./EmergencyContactFormModal";
import Toast from "./Toast";
import { useEmergencyContactsByStaff } from "../hooks/useEmergencyContactsByStaff";
import { useNotification } from "../hooks/useNotification";
import { emergencyContactAPI } from "../services/emergencyContact.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import { emergencyContactToFormValues, toCreatePayload, toUpdatePayload } from "../services/emergencyContact.validation";
import { EMPTY_EMERGENCY_CONTACT_FORM_VALUES } from "../services/emergencyContact.types";
import type { EmergencyContact, EmergencyContactFormValues } from "../services/emergencyContact.types";
import { Can } from "./Can";

interface EmergencyContactsPanelProps {
  employeeId: number;
  employeeName: string;
}

const IconPlus = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const IconEdit = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>);
const IconTrash = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);

// ─── EmergencyContactsPanel ───────────────────────────────────────────────────
// Embedded in the Employee Profile page's "Emergency Contacts" tab. Mirrors
// StaffQualificationsPanel's structure, reusing the existing
// EmergencyContactFormModal (previously only used by the standalone
// EmergencyContactsPage) by locking its "Employee" picker to a single option.
const EmergencyContactsPanel: React.FC<EmergencyContactsPanelProps> = ({ employeeId, employeeName }) => {
  const { contacts, loading, error, refetch } = useEmergencyContactsByStaff(employeeId);
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<EmergencyContact | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [recordToDelete, setRecordToDelete] = useState<EmergencyContact | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const staffOptions = [{ id: employeeId, name: employeeName }];

  const openCreateModal = () => { setModalMode("create"); setEditingRecord(null); setServerErrors({}); setModalOpen(true); };
  const openEditModal = (record: EmergencyContact) => { setModalMode("edit"); setEditingRecord(record); setServerErrors({}); setModalOpen(true); };
  const closeModal = () => { if (submitting) return; setModalOpen(false); setEditingRecord(null); };

  const handleSubmit = async (values: EmergencyContactFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        await emergencyContactAPI.create(toCreatePayload(values));
        notifySuccess("Emergency contact was added successfully.");
      } else if (editingRecord) {
        await emergencyContactAPI.update(editingRecord.id, toUpdatePayload(values));
        notifySuccess("Emergency contact was updated successfully.");
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
      await emergencyContactAPI.remove(recordToDelete.id);
      notifySuccess("Emergency contact was deleted successfully.");
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
        <h3 className="hr-form-section-title" style={{ margin: 0 }}>Emergency Contacts</h3>
        <Can permission="emergency_contact.create"><button type="button" className="hr-btn hr-btn-secondary hr-btn-sm" onClick={openCreateModal}>
          <IconPlus />Add Emergency Contact
        </button></Can>
      </div>

      {loading && <p className="hr-field-hint">Loading emergency contacts…</p>}
      {!loading && error && <p className="hr-field-error">{error}</p>}
      {!loading && !error && contacts.length === 0 && (
        <p className="hr-field-hint">No emergency contacts have been added for this employee yet.</p>
      )}

      {!loading && !error && contacts.length > 0 && (
        <div className="hr-table-wrap hr-table-wrap-compact">
          <table className="hr-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Relation</th>
                <th>Phone</th>
                <th>Email</th>
                <th className="hr-table-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((record) => (
                <tr key={record.id}>
                  <td className="hr-table-name">{record.name}</td>
                  <td>{record.relation}</td>
                  <td>{record.phone || "—"}</td>
                  <td>{record.email || "—"}</td>
                  <td>
                    <div className="hr-table-actions">
                      <Can permission="emergency_contact.update"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label="Edit emergency contact" onClick={() => openEditModal(record)}><IconEdit /></button></Can>
                      <Can permission="emergency_contact.delete"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label="Delete emergency contact" onClick={() => setRecordToDelete(record)}><IconTrash /></button></Can>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toast notifications={notifications} onDismiss={dismiss} />

      <EmergencyContactFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        staff={staffOptions}
        initialValues={
          editingRecord
            ? emergencyContactToFormValues(editingRecord)
            : { ...EMPTY_EMERGENCY_CONTACT_FORM_VALUES, staff_id: String(employeeId) }
        }
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Delete emergency contact?"
        message="This will permanently delete this emergency contact. This action cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default EmergencyContactsPanel;

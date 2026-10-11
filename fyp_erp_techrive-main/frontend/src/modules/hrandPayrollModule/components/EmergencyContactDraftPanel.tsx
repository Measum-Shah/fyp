import React, { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import EmergencyContactFormModal from "./EmergencyContactFormModal";
import { EMPTY_EMERGENCY_CONTACT_FORM_VALUES } from "../services/emergencyContact.types";
import type { EmergencyContactFormValues } from "../services/emergencyContact.types";

// A local (not-yet-saved) emergency contact row, keyed for React + editing
// purposes only — never sent to the API directly.
export interface DraftEmergencyContact extends EmergencyContactFormValues {
  _key: string;
}

interface EmergencyContactDraftPanelProps {
  employeeName?: string;
  items: DraftEmergencyContact[];
  onAdd: (values: EmergencyContactFormValues) => void;
  onUpdate: (key: string, values: EmergencyContactFormValues) => void;
  onRemove: (key: string) => void;
}

const IconPlus = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const IconEdit = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>);
const IconTrash = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);

// Same UI/UX as EmergencyContactsPanel, but for use on the Add Employee
// page — where there is no employee id yet to attach records to. Rows are
// kept in local state (owned by the parent page) and only sent to the API
// once the employee has actually been created. Reuses the existing
// EmergencyContactFormModal by locking its "Employee" picker to a single
// placeholder option, the same trick EmergencyContactsPanel uses once a
// real employee id exists.
const EmergencyContactDraftPanel: React.FC<EmergencyContactDraftPanelProps> = ({
  employeeName = "New Employee",
  items,
  onAdd,
  onUpdate,
  onRemove,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<DraftEmergencyContact | null>(null);

  const staffOptions = [{ id: 0, name: employeeName }];

  const openCreateModal = () => { setModalMode("create"); setEditingKey(null); setModalOpen(true); };
  const openEditModal = (record: DraftEmergencyContact) => { setModalMode("edit"); setEditingKey(record._key); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingKey(null); };

  const editingRecord = editingKey ? items.find((i) => i._key === editingKey) ?? null : null;

  const handleSubmit = (values: EmergencyContactFormValues) => {
    if (modalMode === "create") {
      onAdd(values);
    } else if (editingKey) {
      onUpdate(editingKey, values);
    }
    setModalOpen(false);
    setEditingKey(null);
  };

  const handleConfirmDelete = () => {
    if (!recordToDelete) return;
    onRemove(recordToDelete._key);
    setRecordToDelete(null);
  };

  return (
    <>
      <div className="hr-subsection-header">
        <h3 className="hr-form-section-title" style={{ margin: 0 }}>Emergency Contacts</h3>
        <button type="button" className="hr-btn hr-btn-secondary hr-btn-sm" onClick={openCreateModal}>
          <IconPlus />Add Emergency Contact
        </button>
      </div>

      {items.length === 0 && (
        <p className="hr-field-hint">
          No emergency contacts added yet. They&apos;ll be saved once you create the employee below.
        </p>
      )}

      {items.length > 0 && (
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
              {items.map((record) => (
                <tr key={record._key}>
                  <td className="hr-table-name">{record.name}</td>
                  <td>{record.relation}</td>
                  <td>{record.phone || "—"}</td>
                  <td>{record.email || "—"}</td>
                  <td>
                    <div className="hr-table-actions">
                      <button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label="Edit emergency contact" onClick={() => openEditModal(record)}><IconEdit /></button>
                      <button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label="Remove emergency contact" onClick={() => setRecordToDelete(record)}><IconTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <EmergencyContactFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord._key}` : "create"}
        open={modalOpen}
        mode={modalMode}
        staff={staffOptions}
        initialValues={
          editingRecord ?? { ...EMPTY_EMERGENCY_CONTACT_FORM_VALUES, staff_id: "0" }
        }
        submitting={false}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Remove emergency contact?"
        message="This will remove this emergency contact from the list. It hasn't been saved yet, so this can't be undone."
        confirmLabel="Remove"
        danger
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default EmergencyContactDraftPanel;

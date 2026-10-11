import React, { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import StaffAssetFormModal from "./StaffAssetFormModal";
import { resolveAttachmentUrl } from "../services/staffAsset.service";
import type { StaffAssetFormValues } from "../services/staffAsset.types";

// A local (not-yet-saved) asset row, keyed for React + editing purposes
// only — never sent to the API directly.
export interface DraftStaffAsset extends StaffAssetFormValues {
  _key: string;
}

interface StaffAssetsDraftPanelProps {
  employeeName?: string;
  items: DraftStaffAsset[];
  onAdd: (values: StaffAssetFormValues) => void;
  onUpdate: (key: string, values: StaffAssetFormValues) => void;
  onRemove: (key: string) => void;
}

const IconPlus = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const IconEdit = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>);
const IconTrash = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);
const IconFile = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>);

// Same UI/UX as StaffAssetsPanel, but for use on the Add Employee page —
// where there is no employee id yet to attach records to. Rows are kept in
// local state (owned by the parent page) and only sent to the API once the
// employee has actually been created.
const StaffAssetsDraftPanel: React.FC<StaffAssetsDraftPanelProps> = ({
  employeeName = "this employee",
  items,
  onAdd,
  onUpdate,
  onRemove,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<DraftStaffAsset | null>(null);

  const openCreateModal = () => { setModalMode("create"); setEditingKey(null); setModalOpen(true); };
  const openEditModal = (record: DraftStaffAsset) => { setModalMode("edit"); setEditingKey(record._key); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditingKey(null); };

  const editingRecord = editingKey ? items.find((i) => i._key === editingKey) ?? null : null;

  const handleSubmit = (values: StaffAssetFormValues) => {
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
        <h3 className="hr-form-section-title" style={{ margin: 0 }}>Assets</h3>
        <button type="button" className="hr-btn hr-btn-secondary hr-btn-sm" onClick={openCreateModal}>
          <IconPlus />Add Asset
        </button>
      </div>

      {items.length === 0 && (
        <p className="hr-field-hint">
          No assets added yet. They&apos;ll be saved once you create the employee below.
        </p>
      )}

      {items.length > 0 && (
        <div className="hr-table-wrap hr-table-wrap-compact">
          <table className="hr-table">
            <thead>
              <tr>
                <th>Asset Name</th>
                <th>Type</th>
                <th>Serial No.</th>
                <th>Issue Date</th>
                <th>Return Date</th>
                <th>Condition</th>
                <th>Attachment</th>
                <th className="hr-table-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((record) => {
                const attachmentUrl = resolveAttachmentUrl(record.attachment);
                return (
                  <tr key={record._key}>
                    <td className="hr-table-name">{record.asset_name}</td>
                    <td>{record.asset_type || "—"}</td>
                    <td>{record.serial_number || "—"}</td>
                    <td>{record.issue_date || "—"}</td>
                    <td>{record.return_date || "—"}</td>
                    <td>{record.condition || "—"}</td>
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
                        <button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label="Edit asset" onClick={() => openEditModal(record)}><IconEdit /></button>
                        <button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label="Remove asset" onClick={() => setRecordToDelete(record)}><IconTrash /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <StaffAssetFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord._key}` : "create"}
        open={modalOpen}
        mode={modalMode}
        employeeName={employeeName}
        initialValues={editingRecord ?? undefined}
        submitting={false}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Remove asset?"
        message="This will remove this asset from the list. It hasn't been saved yet, so this can't be undone."
        confirmLabel="Remove"
        danger
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default StaffAssetsDraftPanel;

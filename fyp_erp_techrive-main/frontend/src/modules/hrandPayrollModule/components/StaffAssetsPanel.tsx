import React, { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import StaffAssetFormModal from "./StaffAssetFormModal";
import { useStaffAssets } from "../hooks/useStaffAssets";
import { useNotification } from "../hooks/useNotification";
import Toast from "./Toast";
import { staffAssetAPI, resolveAttachmentUrl } from "../services/staffAsset.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import { staffAssetToFormValues, toCreatePayload, toUpdatePayload } from "../services/staffAsset.validation";
import type { StaffAsset, StaffAssetFormValues } from "../services/staffAsset.types";
import { Can } from "./Can";

interface StaffAssetsPanelProps {
  employeeId: number;
  employeeName: string;
}

const IconPlus = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const IconEdit = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>);
const IconTrash = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);
const IconFile = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>);

const StaffAssetsPanel: React.FC<StaffAssetsPanelProps> = ({ employeeId, employeeName }) => {
  const { assets, loading, error, refetch } = useStaffAssets(employeeId);
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<StaffAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [recordToDelete, setRecordToDelete] = useState<StaffAsset | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreateModal = () => { setModalMode("create"); setEditingRecord(null); setServerErrors({}); setModalOpen(true); };
  const openEditModal = (record: StaffAsset) => { setModalMode("edit"); setEditingRecord(record); setServerErrors({}); setModalOpen(true); };
  const closeModal = () => { if (submitting) return; setModalOpen(false); setEditingRecord(null); };

  const handleSubmit = async (values: StaffAssetFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        await staffAssetAPI.create(toCreatePayload(employeeId, values));
        notifySuccess("Asset was added successfully.");
      } else if (editingRecord) {
        await staffAssetAPI.update(editingRecord.id, toUpdatePayload(employeeId, values));
        notifySuccess("Asset was updated successfully.");
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
      await staffAssetAPI.remove(recordToDelete.id);
      notifySuccess("Asset was deleted successfully.");
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
        <h3 className="hr-form-section-title" style={{ margin: 0 }}>Assets</h3>
        <Can permission="staff_asset.create"><button type="button" className="hr-btn hr-btn-secondary hr-btn-sm" onClick={openCreateModal}>
          <IconPlus />Add Asset
        </button></Can>
      </div>

      {loading && <p className="hr-field-hint">Loading assets…</p>}
      {!loading && error && <p className="hr-field-error">{error}</p>}
      {!loading && !error && assets.length === 0 && (
        <p className="hr-field-hint">No assets have been assigned to this employee yet.</p>
      )}

      {!loading && !error && assets.length > 0 && (
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
              {assets.map((record) => {
                const attachmentUrl = resolveAttachmentUrl(record.attachment);
                return (
                  <tr key={record.id}>
                    <td className="hr-table-name">{record.asset_name}</td>
                    <td>{record.asset_type ?? "—"}</td>
                    <td>{record.serial_number ?? "—"}</td>
                    <td>{record.issue_date ? record.issue_date.slice(0, 10) : "—"}</td>
                    <td>{record.return_date ? record.return_date.slice(0, 10) : "—"}</td>
                    <td>{record.condition ?? "—"}</td>
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
                        <Can permission="staff_asset.update"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label="Edit asset" onClick={() => openEditModal(record)}><IconEdit /></button></Can>
                        <Can permission="staff_asset.delete"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label="Delete asset" onClick={() => setRecordToDelete(record)}><IconTrash /></button></Can>
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

      <StaffAssetFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        employeeName={employeeName}
        initialValues={editingRecord ? staffAssetToFormValues(editingRecord) : undefined}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Delete asset?"
        message="This will permanently delete this asset record. This action cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default StaffAssetsPanel;

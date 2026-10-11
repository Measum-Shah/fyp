import React, { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import FamilyFormModal from "./FamilyFormModal";
import Toast from "./Toast";
import { useFamiliesByStaff } from "../hooks/useFamiliesByStaff";
import { useNotification } from "../hooks/useNotification";
import { familyAPI } from "../services/family.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import { familyToFormValues, toCreatePayload, toUpdatePayload } from "../services/family.validation";
import { EMPTY_FAMILY_FORM_VALUES } from "../services/family.types";
import type { Family, FamilyFormValues } from "../services/family.types";
import { Can } from "./Can";

interface FamilyPanelProps {
  employeeId: number;
  employeeName: string;
}

const IconPlus = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const IconEdit = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>);
const IconTrash = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);

// ─── FamilyPanel ──────────────────────────────────────────────────────────────
// Embedded in the Employee Profile page's "Family Members" tab. Mirrors
// StaffQualificationsPanel's structure, reusing the existing FamilyFormModal
// (previously only used by the standalone FamiliesPage) by locking its
// "Employee" picker to a single option.
const FamilyPanel: React.FC<FamilyPanelProps> = ({ employeeId, employeeName }) => {
  const { families, loading, error, refetch } = useFamiliesByStaff(employeeId);
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<Family | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [recordToDelete, setRecordToDelete] = useState<Family | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const staffOptions = [{ id: employeeId, name: employeeName }];

  const openCreateModal = () => { setModalMode("create"); setEditingRecord(null); setServerErrors({}); setModalOpen(true); };
  const openEditModal = (record: Family) => { setModalMode("edit"); setEditingRecord(record); setServerErrors({}); setModalOpen(true); };
  const closeModal = () => { if (submitting) return; setModalOpen(false); setEditingRecord(null); };

  const handleSubmit = async (values: FamilyFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        await familyAPI.create(toCreatePayload(values));
        notifySuccess("Family member was added successfully.");
      } else if (editingRecord) {
        await familyAPI.update(editingRecord.id, toUpdatePayload(values));
        notifySuccess("Family member was updated successfully.");
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
      await familyAPI.remove(recordToDelete.id);
      notifySuccess("Family member was deleted successfully.");
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
        <h3 className="hr-form-section-title" style={{ margin: 0 }}>Family Members</h3>
        <Can permission="family.create"><button type="button" className="hr-btn hr-btn-secondary hr-btn-sm" onClick={openCreateModal}>
          <IconPlus />Add Family Member
        </button></Can>
      </div>

      {loading && <p className="hr-field-hint">Loading family members…</p>}
      {!loading && error && <p className="hr-field-error">{error}</p>}
      {!loading && !error && families.length === 0 && (
        <p className="hr-field-hint">No family members have been added for this employee yet.</p>
      )}

      {!loading && !error && families.length > 0 && (
        <div className="hr-table-wrap hr-table-wrap-compact">
          <table className="hr-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Relation</th>
                <th>Gender</th>
                <th>Phone</th>
                <th>CNIC</th>
                <th>Workplace</th>
                <th className="hr-table-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {families.map((record) => (
                <tr key={record.id}>
                  <td className="hr-table-name">{record.name}</td>
                  <td>{record.relation}</td>
                  <td>{record.gender || "—"}</td>
                  <td>{record.phone || "—"}</td>
                  <td>{record.cnic || "—"}</td>
                  <td>{record.workplace || "—"}</td>
                  <td>
                    <div className="hr-table-actions">
                      <Can permission="family.update"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label="Edit family member" onClick={() => openEditModal(record)}><IconEdit /></button></Can>
                      <Can permission="family.delete"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label="Delete family member" onClick={() => setRecordToDelete(record)}><IconTrash /></button></Can>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Toast notifications={notifications} onDismiss={dismiss} />

      <FamilyFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        staff={staffOptions}
        initialValues={
          editingRecord
            ? familyToFormValues(editingRecord)
            : { ...EMPTY_FAMILY_FORM_VALUES, staff_id: String(employeeId) }
        }
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Delete family member?"
        message="This will permanently delete this family member record. This action cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default FamilyPanel;

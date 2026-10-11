import React, { useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import EobiFormModal from "../components/EobiFormModal";
import { useEobiRegister } from "../hooks/useEobiRegister";
import { useStaffLookup } from "../hooks/useStaffLookup";
import { useLookups } from "../hooks/useLookups";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useNotification } from "../hooks/useNotification";
import { eobiAPI } from "../services/eobi.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import { eobiEntryToFormValues, toCreatePayload, toUpdatePayload } from "../services/eobi.validation";
import { EOBI_STATUS } from "../services/eobi.types";
import type { EobiEntry, EobiFormValues } from "../services/eobi.types";
import "./employee-module.css";
import { Can } from "../components/Can";

const IconHome = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconPlus = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconShield = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
  </svg>
);
const IconAlertTriangle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
  </svg>
);
const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const EobiRegisterPage: React.FC = () => {
  const { entries, meta, page, setPage, loading, error, refetch } = useEobiRegister();
  const { staff } = useStaffLookup();
  const { branches: campuses } = useLookups();
  const { companies: schools } = useCompanyLookup();

  const campusLabel = (id: number | null) => (id == null ? "—" : campuses.find((c) => c.id === id)?.name ?? `#${id}`);
  const schoolLabel = (id: number | null) => (id == null ? "—" : schools.find((s) => s.id === id)?.name ?? `#${id}`);
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<EobiEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [recordToDelete, setRecordToDelete] = useState<EobiEntry | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreateModal = () => { setModalMode("create"); setEditingRecord(null); setServerErrors({}); setModalOpen(true); };
  const openEditModal = (record: EobiEntry) => { setModalMode("edit"); setEditingRecord(record); setServerErrors({}); setModalOpen(true); };
  const closeModal = () => { if (submitting) return; setModalOpen(false); setEditingRecord(null); };

  const handleSubmit = async (values: EobiFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        await eobiAPI.create(toCreatePayload(values));
        notifySuccess("Register entry was added successfully.");
      } else if (editingRecord) {
        await eobiAPI.update(editingRecord.id, toUpdatePayload(values));
        notifySuccess("Register entry was updated successfully.");
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
      await eobiAPI.remove(recordToDelete.id);
      notifySuccess("Register entry was deleted successfully.");
      setRecordToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showBigLoadingState = loading && entries.length === 0 && !error;
  const showErrorState = !loading && error && entries.length === 0;
  const showEmptyState = !loading && !error && entries.length === 0;
  const showTable = !showBigLoadingState && !showErrorState && !showEmptyState;

  return (
    <div className="hr-page">
      <div className="hr-page-inner">
        <div className="hr-page-header">
          <div>
            <nav className="breadcrumb">
              <Link to="/dashboard" className="breadcrumb-item"><IconHome /> Dashboard</Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item">HR &amp; Payroll</span>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item breadcrumb-current">EOBI / EPF Register</span>
            </nav>
            <h1 className="hr-page-title">EOBI / EPF Register</h1>
          </div>
          <Can permission="eobi.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}><IconPlus />Add Entry</button></Can>
        </div>


        {showBigLoadingState && (
          <div className="hr-table-wrap"><div className="hr-state">
            <span className="spinner-wrap"><span className="spinner" /></span>
            <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>Loading register entries…</p>
          </div></div>
        )}

        {showErrorState && (
          <div className="hr-table-wrap"><div className="hr-state hr-state-error">
            <div className="hr-state-icon"><IconAlertTriangle /></div>
            <p className="hr-state-title">Couldn't load register entries</p>
            <p className="hr-state-message">{error}</p>
            <button type="button" className="hr-btn hr-btn-primary" onClick={refetch}>Try again</button>
          </div></div>
        )}

        {showEmptyState && (
          <div className="hr-table-wrap"><div className="hr-state">
            <div className="hr-state-icon"><IconShield /></div>
            <p className="hr-state-title">No register entries yet</p>
            <p className="hr-state-message">Add an employee's EOBI/EPF contribution to get started.</p>
            <Can permission="eobi.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}><IconPlus />Add Entry</button></Can>
          </div></div>
        )}

        {showTable && (
          <>
            <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
              <div className="hr-table-wrap">
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Employee ID</th><th>Campus</th><th>School</th><th>EOBI Amount</th><th>EPF Amount</th><th>Status</th>
                      <th className="hr-table-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((record) => (
                      <tr key={record.id}>
                        <td className="hr-table-name">#{record.staff_id}</td>
                        <td>{campusLabel(record.branch_id)}</td>
                        <td>{schoolLabel(record.company_id)}</td>
                        <td>{record.eobi_amount}</td>
                        <td>{record.epf_amount}</td>
                        <td>
                          <span className={`profile-status ${record.status === EOBI_STATUS.PAID ? "status-active" : "status-inactive"}`}>
                            {record.status ?? "Unknown"}
                          </span>
                        </td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="eobi.update"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label="Edit register entry" onClick={() => openEditModal(record)}><IconEdit /></button></Can>
                            <Can permission="eobi.delete"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label="Delete register entry" onClick={() => setRecordToDelete(record)}><IconTrash /></button></Can>
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

      <EobiFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingRecord ? eobiEntryToFormValues(editingRecord) : undefined}
        staff={staff}
        schools={schools}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Delete register entry?"
        message={recordToDelete ? "This will permanently delete this EOBI/EPF register entry. This action cannot be undone." : ""}
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default EobiRegisterPage;

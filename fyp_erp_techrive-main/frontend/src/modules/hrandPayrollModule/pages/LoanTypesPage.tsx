import React, { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import LoanTypeFormModal from "../components/LoanTypeFormModal";
import { useLoanTypes } from "../hooks/useLoanTypes";
import { useNotification } from "../hooks/useNotification";
import { loanTypeAPI } from "../services/loanType.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import { loanTypeToFormValues, toCreatePayload, toUpdatePayload } from "../services/loanType.validation";
import type { LoanType, LoanTypeFormValues } from "../services/loanType.types";
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
const IconTag = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" /><line x1="7" y1="7" x2="7.01" y2="7" />
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

const LoanTypesPage: React.FC = () => {
  const { loanTypes, meta, page, setPage, search, changeSearch, loading, error, refetch } = useLoanTypes();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<LoanType | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [recordToDelete, setRecordToDelete] = useState<LoanType | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreateModal = () => { setModalMode("create"); setEditingRecord(null); setServerErrors({}); setModalOpen(true); };
  const openEditModal = (record: LoanType) => { setModalMode("edit"); setEditingRecord(record); setServerErrors({}); setModalOpen(true); };
  const closeModal = () => { if (submitting) return; setModalOpen(false); setEditingRecord(null); };

  const handleSubmit = async (values: LoanTypeFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        const res = await loanTypeAPI.create(toCreatePayload(values));
        notifySuccess(`Loan type "${res.data.loan_type}" was added successfully.`);
      } else if (editingRecord) {
        const res = await loanTypeAPI.update(editingRecord.loan_id, toUpdatePayload(values));
        notifySuccess(`Loan type "${res.data.loan_type}" was updated successfully.`);
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
      await loanTypeAPI.remove(recordToDelete.loan_id);
      notifySuccess(`Loan type "${recordToDelete.loan_type}" was deleted successfully.`);
      setRecordToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showBigLoadingState = loading && loanTypes.length === 0 && !error;
  const showErrorState = !loading && error && loanTypes.length === 0;
  const showEmptyState = !loading && !error && loanTypes.length === 0;
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
              <span className="breadcrumb-item breadcrumb-current">Loan Types</span>
            </nav>
            <h1 className="hr-page-title">Loan Types</h1>
          </div>
          <Can permission="loan_type.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}><IconPlus />Add Loan Type</button></Can>
        </div>


        <div className="hr-page-toolbar">
          <SearchBar value={search} onChange={changeSearch} placeholder="Search by loan type name…" />
        </div>

        {showBigLoadingState && (
          <div className="hr-table-wrap"><div className="hr-state">
            <span className="spinner-wrap"><span className="spinner" /></span>
            <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>Loading loan types…</p>
          </div></div>
        )}

        {showErrorState && (
          <div className="hr-table-wrap"><div className="hr-state hr-state-error">
            <div className="hr-state-icon"><IconAlertTriangle /></div>
            <p className="hr-state-title">Couldn't load loan types</p>
            <p className="hr-state-message">{error}</p>
            <button type="button" className="hr-btn hr-btn-primary" onClick={refetch}>Try again</button>
          </div></div>
        )}

        {showEmptyState && (
          <div className="hr-table-wrap"><div className="hr-state">
            <div className="hr-state-icon"><IconTag /></div>
            <p className="hr-state-title">{search ? "No matching loan types" : "No loan types yet"}</p>
            <p className="hr-state-message">{search ? `No loan types match "${search}".` : "Add loan types here so they show up as options on the Loan Request form."}</p>
            {!search && <Can permission="loan_type.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}><IconPlus />Add Loan Type</button></Can>}
          </div></div>
        )}

        {showTable && (
          <>
            <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
              <div className="hr-table-wrap">
                <table className="hr-table">
                  <thead>
                    <tr><th>Loan Type</th><th>Description</th><th className="hr-table-actions-col">Actions</th></tr>
                  </thead>
                  <tbody>
                    {loanTypes.map((record) => (
                      <tr key={record.loan_id}>
                        <td className="hr-table-name">{record.loan_type}</td>
                        <td>{record.description}</td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="loan_type.update"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label={`Edit ${record.loan_type}`} onClick={() => openEditModal(record)}><IconEdit /></button></Can>
                            <Can permission="loan_type.delete"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label={`Delete ${record.loan_type}`} onClick={() => setRecordToDelete(record)}><IconTrash /></button></Can>
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

      <LoanTypeFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord.loan_id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingRecord ? loanTypeToFormValues(editingRecord) : undefined}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Delete loan type?"
        message={recordToDelete ? `This will permanently delete the loan type "${recordToDelete.loan_type}". Loan requests already using this type as free text are not affected.` : ""}
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default LoanTypesPage;

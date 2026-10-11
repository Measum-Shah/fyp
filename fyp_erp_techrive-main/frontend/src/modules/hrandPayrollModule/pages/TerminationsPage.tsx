import React, { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import TerminationFormModal from "../components/TerminationFormModal";
import { useTerminations } from "../hooks/useTerminations";
import { useStaffLookup } from "../hooks/useStaffLookup";
import { useNotification } from "../hooks/useNotification";
import { terminationAPI } from "../services/termination.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import { terminationToFormValues, toCreatePayload, toUpdatePayload } from "../services/termination.validation";
import type { Termination, TerminationFormValues } from "../services/termination.types";
import "./employee-module.css";
import { Can } from "../components/Can";

const IconHome = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>);
const IconPlus = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>);
const IconUserX = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="18" y1="8" x2="23" y2="13" /><line x1="23" y1="8" x2="18" y2="13" /></svg>);
const IconAlertTriangle = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>);
const IconEdit = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" /></svg>);
const IconTrash = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>);

const TerminationsPage: React.FC = () => {
  const { terminations, meta, page, setPage, search, changeSearch, loading, error, refetch } = useTerminations();
  const { staff } = useStaffLookup();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<Termination | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [recordToDelete, setRecordToDelete] = useState<Termination | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreateModal = () => { setModalMode("create"); setEditingRecord(null); setServerErrors({}); setModalOpen(true); };
  const openEditModal = (record: Termination) => { setModalMode("edit"); setEditingRecord(record); setServerErrors({}); setModalOpen(true); };
  const closeModal = () => { if (submitting) return; setModalOpen(false); setEditingRecord(null); };

  const handleSubmit = async (values: TerminationFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        await terminationAPI.create(toCreatePayload(values));
        notifySuccess("Termination was recorded — the employee has been marked Inactive.");
      } else if (editingRecord) {
        await terminationAPI.update(editingRecord.id, toUpdatePayload(values));
        notifySuccess("Termination was updated successfully.");
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
      await terminationAPI.remove(recordToDelete.id);
      notifySuccess("Termination record was deleted successfully.");
      setRecordToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showBigLoadingState = loading && terminations.length === 0 && !error;
  const showErrorState = !loading && error && terminations.length === 0;
  const showEmptyState = !loading && !error && terminations.length === 0;
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
              <span className="breadcrumb-item breadcrumb-current">Terminations</span>
            </nav>
            <h1 className="hr-page-title">Terminations</h1>
          </div>
          <Can permission="termination.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}><IconPlus />Record Termination</button></Can>
        </div>


        <div className="hr-page-toolbar">
          <SearchBar value={search} onChange={changeSearch} placeholder="Search by reason…" />
        </div>

        {showBigLoadingState && (<div className="hr-table-wrap"><div className="hr-state"><span className="spinner-wrap"><span className="spinner" /></span><p className="hr-state-message" style={{ marginTop: "0.75rem" }}>Loading terminations…</p></div></div>)}
        {showErrorState && (<div className="hr-table-wrap"><div className="hr-state hr-state-error"><div className="hr-state-icon"><IconAlertTriangle /></div><p className="hr-state-title">Couldn't load terminations</p><p className="hr-state-message">{error}</p><button type="button" className="hr-btn hr-btn-primary" onClick={refetch}>Try again</button></div></div>)}
        {showEmptyState && (<div className="hr-table-wrap"><div className="hr-state"><div className="hr-state-icon"><IconUserX /></div><p className="hr-state-title">{search ? "No matching terminations" : "No terminations yet"}</p><p className="hr-state-message">{search ? `No terminations match "${search}".` : "Record a termination to get started."}</p>{!search && <Can permission="termination.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}><IconPlus />Record Termination</button></Can>}</div></div>)}

        {showTable && (
          <>
            <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
              <div className="hr-table-wrap">
                <table className="hr-table">
                  <thead>
                    <tr><th>Reason</th><th>Prior Warnings</th><th>Acknowledged</th><th className="hr-table-actions-col">Actions</th></tr>
                  </thead>
                  <tbody>
                    {terminations.map((record) => (
                      <tr key={record.id}>
                        <td className="hr-table-name">{record.reason}</td>
                        <td>{record.warnings}</td>
                        <td>
                          <span className={`profile-status ${record.acknowledge === "yes" ? "status-active" : "status-inactive"}`}>{record.acknowledge === "yes" ? "Yes" : "No"}</span>
                        </td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="termination.update"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label="Edit termination" onClick={() => openEditModal(record)}><IconEdit /></button></Can>
                            <Can permission="termination.delete"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label="Delete termination" onClick={() => setRecordToDelete(record)}><IconTrash /></button></Can>
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

      <TerminationFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingRecord ? terminationToFormValues(editingRecord) : undefined}
        staff={staff}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Delete termination record?"
        message="This permanently deletes this termination record. It does not reinstate the employee — that's a separate decision made from the Employee record."
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default TerminationsPage;

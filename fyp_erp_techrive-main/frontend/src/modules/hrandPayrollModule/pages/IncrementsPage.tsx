import React, { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import IncrementFormModal from "../components/IncrementFormModal";
import { useIncrements } from "../hooks/useIncrements";
import { useStaffLookup } from "../hooks/useStaffLookup";
import { useNotification } from "../hooks/useNotification";
import { incrementAPI } from "../services/increment.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import { incrementToFormValues, toCreatePayload, toUpdatePayload } from "../services/increment.validation";
import { INCREMENT_STATUS } from "../services/increment.types";
import type { Increment, IncrementFormValues } from "../services/increment.types";
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
const IconTrendingUp = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
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

const IncrementsPage: React.FC = () => {
  const { increments, meta, page, setPage, search, changeSearch, loading, error, refetch } = useIncrements();
  const { staff } = useStaffLookup();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<Increment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [statusSavingId, setStatusSavingId] = useState<number | null>(null);

  const [recordToDelete, setRecordToDelete] = useState<Increment | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreateModal = () => { setModalMode("create"); setEditingRecord(null); setServerErrors({}); setModalOpen(true); };
  const openEditModal = (record: Increment) => { setModalMode("edit"); setEditingRecord(record); setServerErrors({}); setModalOpen(true); };
  const closeModal = () => { if (submitting) return; setModalOpen(false); setEditingRecord(null); };

  const handleSubmit = async (values: IncrementFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        await incrementAPI.create(toCreatePayload(values));
        notifySuccess("Increment request was submitted successfully.");
      } else if (editingRecord) {
        await incrementAPI.update(editingRecord.id, toUpdatePayload(values));
        notifySuccess("Increment request was updated successfully.");
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

  const handleStatusChange = async (record: Increment, value: string) => {
    setStatusSavingId(record.id);
    try {
      await incrementAPI.updateStatus(record.id, { status: value });
      notifySuccess("Status updated.");
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setStatusSavingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    setDeleteLoading(true);
    try {
      await incrementAPI.remove(recordToDelete.id);
      notifySuccess("Increment request was deleted successfully.");
      setRecordToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showBigLoadingState = loading && increments.length === 0 && !error;
  const showErrorState = !loading && error && increments.length === 0;
  const showEmptyState = !loading && !error && increments.length === 0;
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
              <span className="breadcrumb-item breadcrumb-current">Increments</span>
            </nav>
            <h1 className="hr-page-title">Salary Increments</h1>
          </div>
          <Can permission="increment.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}><IconPlus />New Increment Request</button></Can>
        </div>


        <div className="hr-page-toolbar">
          <SearchBar value={search} onChange={changeSearch} placeholder="Search by reason…" />
        </div>

        {showBigLoadingState && (
          <div className="hr-table-wrap"><div className="hr-state">
            <span className="spinner-wrap"><span className="spinner" /></span>
            <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>Loading increment requests…</p>
          </div></div>
        )}

        {showErrorState && (
          <div className="hr-table-wrap"><div className="hr-state hr-state-error">
            <div className="hr-state-icon"><IconAlertTriangle /></div>
            <p className="hr-state-title">Couldn't load increment requests</p>
            <p className="hr-state-message">{error}</p>
            <button type="button" className="hr-btn hr-btn-primary" onClick={refetch}>Try again</button>
          </div></div>
        )}

        {showEmptyState && (
          <div className="hr-table-wrap"><div className="hr-state">
            <div className="hr-state-icon"><IconTrendingUp /></div>
            <p className="hr-state-title">{search ? "No matching increment requests" : "No increment requests yet"}</p>
            <p className="hr-state-message">{search ? `No requests match "${search}". Try a different search term.` : "Submit an employee's salary increment request to get started."}</p>
            {!search && <Can permission="increment.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}><IconPlus />New Increment Request</button></Can>}
          </div></div>
        )}

        {showTable && (
          <>
            <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
              <div className="hr-table-wrap">
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Reason</th><th>Previous Gross</th><th>New Gross</th><th>Amount</th>
                      <th>Status</th>
                      <th className="hr-table-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {increments.map((record) => (
                      <tr key={record.id}>
                        <td className="hr-table-name">{record.reason}</td>
                        <td>{record.previous_gross_salary ?? "—"}</td>
                        <td>{record.New_salary_increment ?? "—"}</td>
                        <td>{record.Amount ?? "—"}</td>
                        <td>
                          <Can
                            permission="increment.approve"
                            fallback={<span>{record.status ?? INCREMENT_STATUS.PENDING}</span>}
                          >
                            <select
                              className="field-input hr-select"
                              value={record.status ?? INCREMENT_STATUS.PENDING}
                              disabled={statusSavingId === record.id}
                              onChange={(e) => handleStatusChange(record, e.target.value)}
                            >
                              <option value={INCREMENT_STATUS.PENDING}>Pending</option>
                              <option value={INCREMENT_STATUS.APPROVED}>Approved</option>
                              <option value={INCREMENT_STATUS.REJECTED}>Rejected</option>
                            </select>
                          </Can>
                        </td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="increment.update"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label="Edit increment request" onClick={() => openEditModal(record)}><IconEdit /></button></Can>
                            <Can permission="increment.delete"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label="Delete increment request" onClick={() => setRecordToDelete(record)}><IconTrash /></button></Can>
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

      <IncrementFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingRecord ? incrementToFormValues(editingRecord) : undefined}
        staff={staff}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Delete increment request?"
        message={recordToDelete ? `This will permanently delete this increment request. Only requests still Pending can be deleted.` : ""}
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default IncrementsPage;

import React, { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import FiscalYearFormModal from "../components/FiscalYearFormModal";
import { useFiscalYears } from "../hooks/useFiscalYears";
import { useNotification } from "../hooks/useNotification";
import { fiscalYearAPI } from "../services/fiscalYear.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import { fiscalYearToFormValues, toCreatePayload, toUpdatePayload } from "../services/fiscalYear.validation";
import { FISCAL_YEAR_STATUS } from "../services/fiscalYear.types";
import type { FiscalYear, FiscalYearFormValues } from "../services/fiscalYear.types";
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
const IconCalendar = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
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
const IconSliders = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

const formatDate = (value: string | null) => (value ? value.slice(0, 10) : "—");

const FiscalYearsPage: React.FC = () => {
  const { fiscalYears, meta, page, setPage, search, changeSearch, loading, error, refetch } = useFiscalYears();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<FiscalYear | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [recordToDelete, setRecordToDelete] = useState<FiscalYear | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreateModal = () => { setModalMode("create"); setEditingRecord(null); setServerErrors({}); setModalOpen(true); };
  const openEditModal = (record: FiscalYear) => { setModalMode("edit"); setEditingRecord(record); setServerErrors({}); setModalOpen(true); };
  const closeModal = () => { if (submitting) return; setModalOpen(false); setEditingRecord(null); };

  const handleSubmit = async (values: FiscalYearFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        const res = await fiscalYearAPI.create(toCreatePayload(values));
        notifySuccess(`Fiscal year "${res.data.name}" was added successfully.`);
      } else if (editingRecord) {
        const res = await fiscalYearAPI.update(editingRecord.id, toUpdatePayload(values));
        notifySuccess(`Fiscal year "${res.data.name}" was updated successfully.`);
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
      await fiscalYearAPI.remove(recordToDelete.id);
      notifySuccess(`Fiscal year "${recordToDelete.name}" was deleted successfully.`);
      setRecordToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showBigLoadingState = loading && fiscalYears.length === 0 && !error;
  const showErrorState = !loading && error && fiscalYears.length === 0;
  const showEmptyState = !loading && !error && fiscalYears.length === 0;
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
              <span className="breadcrumb-item breadcrumb-current">Fiscal Years</span>
            </nav>
            <h1 className="hr-page-title">Fiscal Years</h1>
          </div>
          <Can permission="fiscal_year.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}><IconPlus />Add Fiscal Year</button></Can>
        </div>

        <div className="hr-page-toolbar">
          <SearchBar value={search} onChange={changeSearch} placeholder="Search by fiscal year name…" />
        </div>

        {showBigLoadingState && (
          <div className="hr-table-wrap"><div className="hr-state">
            <span className="spinner-wrap"><span className="spinner" /></span>
            <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>Loading fiscal years…</p>
          </div></div>
        )}

        {showErrorState && (
          <div className="hr-table-wrap"><div className="hr-state hr-state-error">
            <div className="hr-state-icon"><IconAlertTriangle /></div>
            <p className="hr-state-title">Couldn't load fiscal years</p>
            <p className="hr-state-message">{error}</p>
            <button type="button" className="hr-btn hr-btn-primary" onClick={refetch}>Try again</button>
          </div></div>
        )}

        {showEmptyState && (
          <div className="hr-table-wrap"><div className="hr-state">
            <div className="hr-state-icon"><IconCalendar /></div>
            <p className="hr-state-title">{search ? "No matching fiscal years" : "No fiscal years yet"}</p>
            <p className="hr-state-message">{search ? `No fiscal years match "${search}".` : "Add a fiscal year here, then set up its tax slabs and pick it on new Salary Sheets."}</p>
            {!search && <Can permission="fiscal_year.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}><IconPlus />Add Fiscal Year</button></Can>}
          </div></div>
        )}

        {showTable && (
          <>
            <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
              <div className="hr-table-wrap">
                <table className="hr-table">
                  <thead>
                    <tr><th>Name</th><th>Start Date</th><th>End Date</th><th>Status</th><th className="hr-table-actions-col">Actions</th></tr>
                  </thead>
                  <tbody>
                    {fiscalYears.map((record) => (
                      <tr key={record.id}>
                        <td className="hr-table-name">{record.name}</td>
                        <td>{formatDate(record.start_date)}</td>
                        <td>{formatDate(record.end_date)}</td>
                        <td>
                          <span className={`hr-badge ${record.status === FISCAL_YEAR_STATUS.ACTIVE ? "hr-badge-success" : "hr-badge-muted"}`}>
                            {record.status === FISCAL_YEAR_STATUS.ACTIVE ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="tax_slab.view">
                              <Link to={`/hr/tax-slabs?fiscal_year_id=${record.id}`} className="hr-btn hr-btn-ghost hr-btn-icon" aria-label={`Tax slabs for ${record.name}`} title="Tax Slabs"><IconSliders /></Link>
                            </Can>
                            <Can permission="fiscal_year.update"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label={`Edit ${record.name}`} onClick={() => openEditModal(record)}><IconEdit /></button></Can>
                            <Can permission="fiscal_year.delete"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label={`Delete ${record.name}`} onClick={() => setRecordToDelete(record)}><IconTrash /></button></Can>
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

      <FiscalYearFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingRecord ? fiscalYearToFormValues(editingRecord) : undefined}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Delete fiscal year?"
        message={recordToDelete ? `This will permanently delete the fiscal year "${recordToDelete.name}" and its tax slabs will no longer be selectable. Salary sheets already using it are not affected.` : ""}
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default FiscalYearsPage;

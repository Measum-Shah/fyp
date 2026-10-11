import React, { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import DeductionFormulaFormModal from "../components/DeductionFormulaFormModal";
import { useDeductionFormulas } from "../hooks/useDeductionFormulas";
import { useNotification } from "../hooks/useNotification";
import { deductionFormulaAPI } from "../services/payrollDeductionFormula.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import {
  deductionFormulaToFormValues,
  toCreatePayload,
  toUpdatePayload,
} from "../services/payrollDeductionFormula.validation";
import {
  DEDUCTION_FORMULA_BASE_TYPE,
  DEDUCTION_FORMULA_DIVISOR_TYPE,
  DEDUCTION_FORMULA_STATUS,
} from "../services/payrollDeductionFormula.types";
import type { DeductionFormula, DeductionFormulaFormValues } from "../services/payrollDeductionFormula.types";
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
const IconCalculator = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="8" y1="6" x2="16" y2="6" />
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

const formatBaseType = (record: DeductionFormula) =>
  record.base_type === DEDUCTION_FORMULA_BASE_TYPE.GROSS_SALARY ? "Gross Salary" : "Basic Salary";

const formatDivisor = (record: DeductionFormula) =>
  record.divisor_type === DEDUCTION_FORMULA_DIVISOR_TYPE.FIXED_30 ? "Fixed 30 days" : "Calendar days in month";

const DeductionFormulasPage: React.FC = () => {
  const { deductionFormulas, meta, page, setPage, search, changeSearch, loading, error, refetch } = useDeductionFormulas();
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<DeductionFormula | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [recordToDelete, setRecordToDelete] = useState<DeductionFormula | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const openCreateModal = () => { setModalMode("create"); setEditingRecord(null); setServerErrors({}); setModalOpen(true); };
  const openEditModal = (record: DeductionFormula) => { setModalMode("edit"); setEditingRecord(record); setServerErrors({}); setModalOpen(true); };
  const closeModal = () => { if (submitting) return; setModalOpen(false); setEditingRecord(null); };

  const handleSubmit = async (values: DeductionFormulaFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        const res = await deductionFormulaAPI.create(toCreatePayload(values));
        notifySuccess(`Deduction formula "${res.data.name}" was added successfully.`);
      } else if (editingRecord) {
        const res = await deductionFormulaAPI.update(editingRecord.id, toUpdatePayload(values));
        notifySuccess(`Deduction formula "${res.data.name}" was updated successfully.`);
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
      await deductionFormulaAPI.remove(recordToDelete.id);
      notifySuccess(`Deduction formula "${recordToDelete.name}" was deleted successfully.`);
      setRecordToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showBigLoadingState = loading && deductionFormulas.length === 0 && !error;
  const showErrorState = !loading && error && deductionFormulas.length === 0;
  const showEmptyState = !loading && !error && deductionFormulas.length === 0;
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
              <span className="breadcrumb-item breadcrumb-current">Deduction Formulas</span>
            </nav>
            <h1 className="hr-page-title">Deduction Formulas</h1>
          </div>
          <Can permission="payroll_deduction_formula.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}><IconPlus />Add Formula</button></Can>
        </div>

        <p style={{ marginTop: "-0.5rem", marginBottom: "1rem", color: "var(--text-muted, #6b7280)", fontSize: "0.9rem" }}>
          Controls how an unpaid leave day or an absent day is converted into a Rupee deduction on the automated Payroll Run.
          Only the formula marked <strong>Default</strong> is actually used — everything else here is inactive/for reference.
        </p>

        <div className="hr-page-toolbar">
          <SearchBar value={search} onChange={changeSearch} placeholder="Search by formula name…" />
        </div>

        {showBigLoadingState && (
          <div className="hr-table-wrap"><div className="hr-state">
            <span className="spinner-wrap"><span className="spinner" /></span>
            <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>Loading deduction formulas…</p>
          </div></div>
        )}

        {showErrorState && (
          <div className="hr-table-wrap"><div className="hr-state hr-state-error">
            <div className="hr-state-icon"><IconAlertTriangle /></div>
            <p className="hr-state-title">Couldn't load deduction formulas</p>
            <p className="hr-state-message">{error}</p>
            <button type="button" className="hr-btn hr-btn-primary" onClick={refetch}>Try again</button>
          </div></div>
        )}

        {showEmptyState && (
          <div className="hr-table-wrap"><div className="hr-state">
            <div className="hr-state-icon"><IconCalculator /></div>
            <p className="hr-state-title">{search ? "No matching deduction formulas" : "No deduction formulas yet"}</p>
            <p className="hr-state-message">{search ? `No formulas match "${search}".` : "Add a formula — e.g. Basic Salary ÷ Calendar Days — and mark it Default so Payroll Run can deduct unpaid leave/absent days automatically."}</p>
            {!search && <Can permission="payroll_deduction_formula.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}><IconPlus />Add Formula</button></Can>}
          </div></div>
        )}

        {showTable && (
          <>
            <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
              <div className="hr-table-wrap">
                <table className="hr-table">
                  <thead>
                    <tr><th>Name</th><th>Base</th><th>Divide By</th><th>Default</th><th>Status</th><th className="hr-table-actions-col">Actions</th></tr>
                  </thead>
                  <tbody>
                    {deductionFormulas.map((record) => (
                      <tr key={record.id}>
                        <td className="hr-table-name">{record.name}</td>
                        <td>{formatBaseType(record)}</td>
                        <td>{formatDivisor(record)}</td>
                        <td>
                          {record.is_default === 1 ? (
                            <span className="hr-badge hr-badge-success">Default</span>
                          ) : (
                            <span className="hr-badge hr-badge-muted">—</span>
                          )}
                        </td>
                        <td>
                          <span className={`hr-badge ${record.status === DEDUCTION_FORMULA_STATUS.ACTIVE ? "hr-badge-success" : "hr-badge-muted"}`}>
                            {record.status === DEDUCTION_FORMULA_STATUS.ACTIVE ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="payroll_deduction_formula.update"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label={`Edit ${record.name}`} onClick={() => openEditModal(record)}><IconEdit /></button></Can>
                            <Can permission="payroll_deduction_formula.delete"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label={`Delete ${record.name}`} onClick={() => setRecordToDelete(record)}><IconTrash /></button></Can>
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

      <DeductionFormulaFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingRecord ? deductionFormulaToFormValues(editingRecord) : undefined}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Delete deduction formula?"
        message={recordToDelete ? `This will permanently delete "${recordToDelete.name}". ${recordToDelete.is_default === 1 ? "This is currently the DEFAULT formula — deleting it means Payroll Run will skip leave/attendance deduction entirely until another formula is marked default." : ""}` : ""}
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default DeductionFormulasPage;

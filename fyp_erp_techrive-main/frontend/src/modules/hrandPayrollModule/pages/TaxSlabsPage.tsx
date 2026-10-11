import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import TaxSlabFormModal from "../components/TaxSlabFormModal";
import { useTaxSlabsForFiscalYear } from "../hooks/useTaxSlabs";
import { useFiscalYearLookup } from "../hooks/useFiscalYears";
import { useNotification } from "../hooks/useNotification";
import { taxSlabAPI } from "../services/taxSlab.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import { taxSlabToFormValues, toCreatePayload, toUpdatePayload } from "../services/taxSlab.validation";
import { EMPTY_TAX_SLAB_FORM_VALUES, TAX_SLAB_STATUS } from "../services/taxSlab.types";
import type { TaxSlab, TaxSlabFormValues } from "../services/taxSlab.types";
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
const IconSliders = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
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

const formatRs = (value: number) => `Rs. ${value.toLocaleString()}`;

const TaxSlabsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { fiscalYears, loading: fiscalYearsLoading } = useFiscalYearLookup();

  const paramFiscalYearId = searchParams.get("fiscal_year_id");
  const [selectedFiscalYearId, setSelectedFiscalYearId] = useState<number | null>(
    paramFiscalYearId ? Number(paramFiscalYearId) : null
  );

  // Default to the first fiscal year once the lookup loads, if none was
  // requested via ?fiscal_year_id=
  useEffect(() => {
    if (selectedFiscalYearId === null && fiscalYears.length > 0) {
      setSelectedFiscalYearId(fiscalYears[0].id);
    }
  }, [fiscalYears, selectedFiscalYearId]);

  const { slabs, missingUnboundedTopSlabWarning, loading, error, refetch } = useTaxSlabsForFiscalYear(selectedFiscalYearId);
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<TaxSlab | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [recordToDelete, setRecordToDelete] = useState<TaxSlab | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleFiscalYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value);
    setSelectedFiscalYearId(id);
    setSearchParams({ fiscal_year_id: String(id) });
  };

  const openCreateModal = () => { setModalMode("create"); setEditingRecord(null); setServerErrors({}); setModalOpen(true); };
  const openEditModal = (record: TaxSlab) => { setModalMode("edit"); setEditingRecord(record); setServerErrors({}); setModalOpen(true); };
  const closeModal = () => { if (submitting) return; setModalOpen(false); setEditingRecord(null); };

  const handleSubmit = async (values: TaxSlabFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      if (modalMode === "create") {
        await taxSlabAPI.create(toCreatePayload(values));
        notifySuccess("Tax slab was added successfully.");
      } else if (editingRecord) {
        await taxSlabAPI.update(editingRecord.id, toUpdatePayload(values));
        notifySuccess("Tax slab was updated successfully.");
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
      await taxSlabAPI.remove(recordToDelete.id);
      notifySuccess("Tax slab was deleted successfully.");
      setRecordToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showBigLoadingState = (loading || fiscalYearsLoading) && slabs.length === 0 && !error;
  const showErrorState = !loading && error && slabs.length === 0;
  const showNoFiscalYears = !fiscalYearsLoading && fiscalYears.length === 0;
  const showEmptyState = !loading && !error && !showNoFiscalYears && slabs.length === 0;
  const showTable = !showBigLoadingState && !showErrorState && !showNoFiscalYears && !showEmptyState;

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
              <span className="breadcrumb-item breadcrumb-current">Tax Slabs</span>
            </nav>
            <h1 className="hr-page-title">Tax Slabs</h1>
          </div>
          <Can permission="tax_slab.create">
            <button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal} disabled={selectedFiscalYearId === null}>
              <IconPlus />Add Tax Slab
            </button>
          </Can>
        </div>

        <div className="hr-page-toolbar">
          <div className="field" style={{ maxWidth: 320 }}>
            <label className="field-label" htmlFor="ts-fy-filter">Fiscal Year</label>
            <select
              id="ts-fy-filter"
              className="field-input hr-select"
              value={selectedFiscalYearId ?? ""}
              onChange={handleFiscalYearChange}
              disabled={fiscalYearsLoading || fiscalYears.length === 0}
            >
              {fiscalYears.map((fy) => <option key={fy.id} value={fy.id}>{fy.name}</option>)}
            </select>
          </div>
        </div>

        {showNoFiscalYears && (
          <div className="hr-table-wrap"><div className="hr-state">
            <div className="hr-state-icon"><IconSliders /></div>
            <p className="hr-state-title">No fiscal years yet</p>
            <p className="hr-state-message">Add a fiscal year first, then come back here to set up its tax slabs.</p>
            <Can permission="fiscal_year.create"><Link to="/hr/fiscal-years" className="hr-btn hr-btn-primary">Go to Fiscal Years</Link></Can>
          </div></div>
        )}

        {showBigLoadingState && (
          <div className="hr-table-wrap"><div className="hr-state">
            <span className="spinner-wrap"><span className="spinner" /></span>
            <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>Loading tax slabs…</p>
          </div></div>
        )}

        {showErrorState && (
          <div className="hr-table-wrap"><div className="hr-state hr-state-error">
            <div className="hr-state-icon"><IconAlertTriangle /></div>
            <p className="hr-state-title">Couldn't load tax slabs</p>
            <p className="hr-state-message">{error}</p>
            <button type="button" className="hr-btn hr-btn-primary" onClick={refetch}>Try again</button>
          </div></div>
        )}

        {showTable && missingUnboundedTopSlabWarning && (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.6rem",
              background: "rgba(234, 179, 8, 0.12)",
              border: "1px solid rgba(234, 179, 8, 0.4)",
              color: "#a16207",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
            }}
          >
            <IconAlertTriangle />
            <div>
              <strong>No unbounded top slab configured.</strong> Every active slab for this fiscal year has a
              finite maximum amount. Any employee whose taxable income exceeds the highest max amount will get
              ₨0 tax calculated automatically. Add (or edit) the top slab and leave its Maximum Amount blank to
              fix this.
            </div>
          </div>
        )}

        {showEmptyState && (
          <div className="hr-table-wrap"><div className="hr-state">
            <div className="hr-state-icon"><IconSliders /></div>
            <p className="hr-state-title">No tax slabs for this fiscal year</p>
            <p className="hr-state-message">Add slabs here to build the progressive tax ladder — Salary Sheets under this fiscal year will use it to auto-calculate tax.</p>
            <Can permission="tax_slab.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}><IconPlus />Add Tax Slab</button></Can>
          </div></div>
        )}

        {showTable && (
          <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
            <div className="hr-table-wrap">
              <table className="hr-table">
                <thead>
                  <tr><th>#</th><th>Income Range</th><th>Fixed Amount</th><th>Tax %</th><th>Status</th><th className="hr-table-actions-col">Actions</th></tr>
                </thead>
                <tbody>
                  {slabs.map((slab) => (
                    <tr key={slab.id}>
                      <td>{slab.slab_order}</td>
                      <td>{formatRs(slab.min_amount)} – {slab.max_amount === null ? "and above" : formatRs(slab.max_amount)}</td>
                      <td>{formatRs(slab.fixed_amount)}</td>
                      <td>{slab.tax_percent}%</td>
                      <td>
                        <span className={`hr-badge ${slab.status === TAX_SLAB_STATUS.ACTIVE ? "hr-badge-success" : "hr-badge-muted"}`}>
                          {slab.status === TAX_SLAB_STATUS.ACTIVE ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="hr-table-actions">
                          <Can permission="tax_slab.update"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label={`Edit slab ${slab.slab_order}`} onClick={() => openEditModal(slab)}><IconEdit /></button></Can>
                          <Can permission="tax_slab.delete"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label={`Delete slab ${slab.slab_order}`} onClick={() => setRecordToDelete(slab)}><IconTrash /></button></Can>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Toast notifications={notifications} onDismiss={dismiss} />

      <TaxSlabFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord.id}` : `create-${selectedFiscalYearId}`}
        open={modalOpen}
        mode={modalMode}
        fiscalYears={fiscalYears}
        lockFiscalYear={modalMode === "create"}
        initialValues={editingRecord ? taxSlabToFormValues(editingRecord) : EMPTY_TAX_SLAB_FORM_VALUES(selectedFiscalYearId ?? undefined)}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Delete tax slab?"
        message={recordToDelete ? `This will permanently delete slab #${recordToDelete.slab_order} (${formatRs(recordToDelete.min_amount)} – ${recordToDelete.max_amount === null ? "and above" : formatRs(recordToDelete.max_amount)}).` : ""}
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default TaxSlabsPage;

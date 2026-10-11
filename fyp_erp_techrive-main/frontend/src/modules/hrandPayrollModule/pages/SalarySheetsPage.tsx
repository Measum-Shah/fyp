import React, { useState } from "react";
import { Link } from "react-router-dom";
import SearchBar from "../components/SearchBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import SalaryFormModal from "../components/SalaryFormModal";
import SalaryApprovalModal from "../components/SalaryApprovalModal";
import DownloadSalarySlipModal from "../components/DownloadSalarySlipModal";
import CalculationInfoPopover from "../components/CalculationInfoPopover";
import { useSalarySheets } from "../hooks/useSalarySheets";
import { useStaffLookup } from "../hooks/useStaffLookup";
import { useNotification } from "../hooks/useNotification";
import { salaryAPI } from "../services/salary.service";
import { getApiErrorMessage, getApiFieldErrors } from "../services/employee.service";
import { salaryToFormValues, toCreatePayload, toUpdatePayload } from "../services/salary.validation";
import { SALARY_STATUS, MONTH_OPTIONS } from "../services/salary.types";
import type { SalaryFormValues, SalarySheet, UpdateSalaryApprovalPayload } from "../services/salary.types";
import "./employee-module.css";
import { Can } from "../components/Can";

/* ── Icons ─────────────────────────────────────────────────────────────── */
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
const IconFile = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
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
const IconCheckSquare = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);
const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const monthLabel = (id: string | null) => MONTH_OPTIONS.find((m) => m.value === id)?.label ?? id ?? "—";

const SalarySheetsPage: React.FC = () => {
  const { sheets, meta, page, setPage, search, changeSearch, loading, error, refetch } = useSalarySheets();
  const { staff } = useStaffLookup();
  const { notifications, notifySuccess, notifyError, notifyWarning, dismiss } = useNotification();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingRecord, setEditingRecord] = useState<SalarySheet | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});

  const [approvalRecord, setApprovalRecord] = useState<SalarySheet | null>(null);
  const [slipRecord, setSlipRecord] = useState<SalarySheet | null>(null);
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);

  const [recordToDelete, setRecordToDelete] = useState<SalarySheet | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 2026-08-22: "how was this calculated" breakdown card for the sheet
  // just created/updated — see CalculationInfoPopover.tsx. Populated only
  // when the backend actually auto-calculated something this call;
  // persists until the user dismisses it or navigates away (not on a
  // timer, unlike Toast — these explanations are meant to be read).
  const [calculationBreakdown, setCalculationBreakdown] = useState<{
    sheetCode: string;
    tax: string | null;
    eobi: string | null;
    epf: string | null;
  } | null>(null);

  const openCreateModal = () => { setModalMode("create"); setEditingRecord(null); setServerErrors({}); setModalOpen(true); };
  const openEditModal = (record: SalarySheet) => { setModalMode("edit"); setEditingRecord(record); setServerErrors({}); setModalOpen(true); };
  const closeModal = () => { if (submitting) return; setModalOpen(false); setEditingRecord(null); };

  const handleSubmit = async (values: SalaryFormValues) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      let res;
      if (modalMode === "create") {
        res = await salaryAPI.create(toCreatePayload(values));
        notifySuccess(`Salary sheet "${res.data.sheet_code}" was generated successfully.`);
      } else if (editingRecord) {
        res = await salaryAPI.update(editingRecord.id, toUpdatePayload(values));
        notifySuccess(`Salary sheet "${res.data.sheet_code}" was updated successfully.`);
      }
      if (res?.data.tax_slab_gap_warning) {
        notifyWarning(
          `Tax was auto-calculated as ₨0 because "${res.data.sheet_code}"'s taxable income falls in a gap between configured tax slabs. Check the Tax Slabs page for this fiscal year.`
        );
      }
      const { tax_calculation_breakdown, eobi_calculation_breakdown, epf_calculation_breakdown } = res?.data ?? {};
      if (res && (tax_calculation_breakdown || eobi_calculation_breakdown || epf_calculation_breakdown)) {
        setCalculationBreakdown({
          sheetCode: res.data.sheet_code,
          tax: tax_calculation_breakdown ?? null,
          eobi: eobi_calculation_breakdown ?? null,
          epf: epf_calculation_breakdown ?? null,
        });
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

  const handleApprovalSubmit = async (payload: UpdateSalaryApprovalPayload) => {
    if (!approvalRecord) return;
    setApprovalSubmitting(true);
    try {
      const res = await salaryAPI.updateApproval(approvalRecord.id, payload);
      notifySuccess(`Approval status for "${res.data.sheet_code}" was updated.`);
      setApprovalRecord(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setApprovalSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    setDeleteLoading(true);
    try {
      await salaryAPI.remove(recordToDelete.id);
      notifySuccess(`Salary sheet "${recordToDelete.sheet_code}" was deleted successfully.`);
      setRecordToDelete(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setDeleteLoading(false);
    }
  };

  const showBigLoadingState = loading && sheets.length === 0 && !error;
  const showErrorState = !loading && error && sheets.length === 0;
  const showEmptyState = !loading && !error && sheets.length === 0;
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
              <span className="breadcrumb-item breadcrumb-current">Salary Sheets</span>
            </nav>
            <h1 className="hr-page-title">Salary Sheets</h1>
          </div>
          <Can permission="salary.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
            <IconPlus />Generate Sheet
          </button></Can>
        </div>

        {calculationBreakdown && (
          <div
            className="alert alert-success"
            style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "1rem" }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", alignItems: "center" }}>
              <strong>"{calculationBreakdown.sheetCode}" — how the auto-calculated figures were derived:</strong>
              {calculationBreakdown.tax && (
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  Tax <CalculationInfoPopover breakdown={calculationBreakdown.tax} label="How was Tax calculated?" />
                </span>
              )}
              {calculationBreakdown.eobi && (
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  EOBI <CalculationInfoPopover breakdown={calculationBreakdown.eobi} label="How was EOBI calculated?" />
                </span>
              )}
              {calculationBreakdown.epf && (
                <span style={{ display: "inline-flex", alignItems: "center" }}>
                  EPF <CalculationInfoPopover breakdown={calculationBreakdown.epf} label="How was EPF calculated?" />
                </span>
              )}
            </div>
            <button
              type="button"
              className="hr-btn hr-btn-ghost hr-btn-icon"
              aria-label="Dismiss"
              onClick={() => setCalculationBreakdown(null)}
              style={{ flexShrink: 0 }}
            >
              ×
            </button>
          </div>
        )}

        <div className="hr-page-toolbar">
          <SearchBar value={search} onChange={changeSearch} placeholder="Search by employee name or sheet code…" />
        </div>

        {showBigLoadingState && (
          <div className="hr-table-wrap"><div className="hr-state">
            <span className="spinner-wrap"><span className="spinner" /></span>
            <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>Loading salary sheets…</p>
          </div></div>
        )}

        {showErrorState && (
          <div className="hr-table-wrap"><div className="hr-state hr-state-error">
            <div className="hr-state-icon"><IconAlertTriangle /></div>
            <p className="hr-state-title">Couldn't load salary sheets</p>
            <p className="hr-state-message">{error}</p>
            <button type="button" className="hr-btn hr-btn-primary" onClick={refetch}>Try again</button>
          </div></div>
        )}

        {showEmptyState && (
          <div className="hr-table-wrap"><div className="hr-state">
            <div className="hr-state-icon"><IconFile /></div>
            <p className="hr-state-title">{search ? "No matching salary sheets" : "No salary sheets yet"}</p>
            <p className="hr-state-message">
              {search ? `No sheets match "${search}". Try a different search term.` : "Generate the first monthly salary sheet to get started."}
            </p>
            {!search && (
              <Can permission="salary.create"><button type="button" className="hr-btn hr-btn-primary" onClick={openCreateModal}>
                <IconPlus />Generate Sheet
              </button></Can>
            )}
          </div></div>
        )}

        {showTable && (
          <>
            <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
              <div className="hr-table-wrap">
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Sheet Code</th>
                      <th>Employee</th>
                      <th>Period</th>
                      <th>Gross Salary</th>
                      <th>Tax</th>
                      <th>Net Salary</th>
                      <th>Status</th>
                      <th className="hr-table-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sheets.map((record) => (
                      <tr key={record.id}>
                        <td className="hr-table-name">{record.sheet_code}</td>
                        <td>{record.name ?? "—"}</td>
                        <td>{monthLabel(record.month_id)} {record.year_id}</td>
                        <td>{record.gross_salary}</td>
                        <td>
                          {record.tax_amount ?? "—"}
                          {record.tax_calculation_breakdown && (
                            <CalculationInfoPopover
                              breakdown={record.tax_calculation_breakdown}
                              label="How was Tax calculated?"
                            />
                          )}
                        </td>
                        <td>{record.net_salary ?? "—"}</td>
                        <td>
                          <span
                            className={`profile-status ${
                              record.salary_status === SALARY_STATUS.ACTIVE || record.salary_status === SALARY_STATUS.APPROVED
                                ? "status-active"
                                : record.salary_status === SALARY_STATUS.PAID
                                ? "status-active"
                                : "status-inactive"
                            }`}
                            style={
                              record.salary_status === SALARY_STATUS.INACTIVE ||
                              record.salary_status === SALARY_STATUS.PENDING ||
                              record.ceo_salary_status === "Pending"
                                ? { background: "rgba(234, 179, 8, 0.15)", color: "#eab308" }
                                : undefined
                            }
                          >
                            {record.salary_status === SALARY_STATUS.INACTIVE ||
                            record.salary_status === SALARY_STATUS.PENDING ||
                            record.ceo_salary_status === "Pending"
                              ? "Inactive (Pending CEO)"
                              : record.salary_status ?? "Unknown"}
                          </span>
                        </td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="salary.approve"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label={`Manage CEO approval for ${record.sheet_code}`} title={`Manage CEO approval for ${record.sheet_code}`} onClick={() => setApprovalRecord(record)}>
                              <IconCheckSquare />
                            </button></Can>
                            <Can permission="report.salary_slips"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label={`Download salary slip for ${record.sheet_code}`} onClick={() => setSlipRecord(record)}>
                              <IconDownload />
                            </button></Can>
                            <Can permission="salary.update"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon" aria-label={`Edit ${record.sheet_code}`} onClick={() => openEditModal(record)}>
                              <IconEdit />
                            </button></Can>
                            <Can permission="salary.delete"><button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label={`Delete ${record.sheet_code}`} onClick={() => setRecordToDelete(record)}>
                              <IconTrash />
                            </button></Can>
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

      <SalaryFormModal
        key={modalMode === "edit" && editingRecord ? `edit-${editingRecord.id}` : "create"}
        open={modalOpen}
        mode={modalMode}
        initialValues={editingRecord ? salaryToFormValues(editingRecord) : undefined}
        staff={staff}
        submitting={submitting}
        serverErrors={serverErrors}
        onSubmit={handleSubmit}
        onCancel={closeModal}
      />

      <SalaryApprovalModal
        open={approvalRecord !== null}
        record={approvalRecord}
        submitting={approvalSubmitting}
        onSubmit={handleApprovalSubmit}
        onCancel={() => setApprovalRecord(null)}
      />

      <DownloadSalarySlipModal
        open={slipRecord !== null}
        branchId={slipRecord?.branch_id ?? null}
        staffId={slipRecord?.staff_id ?? null}
        monthId={slipRecord?.month_id ?? null}
        yearId={slipRecord?.year_id ?? null}
        onClose={() => setSlipRecord(null)}
      />

      <ConfirmDialog
        open={recordToDelete !== null}
        title="Delete salary sheet?"
        message={recordToDelete ? `This will deactivate the salary sheet "${recordToDelete.sheet_code}". Sheets that have already entered the approval workflow cannot be deleted.` : ""}
        confirmLabel="Delete"
        danger
        loading={deleteLoading}
        onCancel={() => setRecordToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default SalarySheetsPage;

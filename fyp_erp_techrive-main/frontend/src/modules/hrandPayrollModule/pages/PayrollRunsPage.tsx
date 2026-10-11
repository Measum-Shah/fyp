import React, { useState } from "react";
import { Link } from "react-router-dom";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import GeneratePayrollRunModal from "../components/GeneratePayrollRunModal";
import PayrollConfirmModal from "../components/PayrollConfirmModal";
import { usePayrollRunMembers } from "../hooks/usePayrollRun";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { useNotification } from "../hooks/useNotification";
import { payrollRunAPI } from "../services/payrollRun.service";
import { getApiErrorMessage } from "../services/employee.service";
import { PAYROLL_RUN_STATUS_LABEL } from "../services/payrollRun.types";
import type { GenerateRunFormValues, PayrollRunMember } from "../services/payrollRun.types";
import { EMPTY_GENERATE_RUN_FORM_VALUES } from "../services/payrollRun.types";
import "./employee-module.css";
import { Can } from "../components/Can";

const IconHome = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconPlay = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);
const IconLayers = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
  </svg>
);
const IconAlertTriangle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const PayrollRunsPage: React.FC = () => {
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  // Company → Branch cascade for the toolbar's viewing filter (separate from
  // the Generate modal's own company/branch selection).
  const [scopeCompanyId, setScopeCompanyId] = useState<number | null>(null);
  const { companies } = useCompanyLookup();
  const { branches } = useBranchesLookup(scopeCompanyId);

  const [scopeBranchId, setScopeBranchId] = useState<number | null>(null);
  const [scopeMonthYear, setScopeMonthYear] = useState<string>(EMPTY_GENERATE_RUN_FORM_VALUES.month_year);

  const handleScopeCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setScopeCompanyId(e.target.value ? Number(e.target.value) : null);
    // A branch from the old company is no longer valid/visible — clear it.
    setScopeBranchId(null);
  };

  const { members, meta, page, setPage, loading, error, refetch } = usePayrollRunMembers(
    scopeBranchId,
    scopeMonthYear
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [memberToRemove, setMemberToRemove] = useState<PayrollRunMember | null>(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  // The Generate Payroll form's submission doesn't call the API directly —
  // it's held here until the person confirms the precaution dialog below.
  // Cancelling that dialog just re-opens the form (setModalOpen(true)); its
  // internal state (selected employees, loaded eligible list, etc.) is
  // untouched since GeneratePayrollRunModal stays mounted the whole time,
  // only hidden while `open` is false.
  const [pendingRun, setPendingRun] = useState<{
    values: GenerateRunFormValues;
    staffIds: number[];
    staffIdsWithoutActiveBankAccount: number[];
  } | null>(null);

  const handleGenerateRequested = (
    values: GenerateRunFormValues,
    staffIds: number[],
    staffIdsWithoutActiveBankAccount: number[]
  ) => {
    setModalOpen(false);
    setPendingRun({ values, staffIds, staffIdsWithoutActiveBankAccount });
  };

  const handleCancelConfirm = () => {
    setPendingRun(null);
    setModalOpen(true);
  };

  // This is the actual disbursement — every sheet created here is saved
  // with salary_status: Paid immediately (see payrollRun.service.ts), not
  // a draft awaiting approval. Only runs once the person has explicitly
  // confirmed via PayrollConfirmModal; there's no other path to it.
  const handleConfirmGenerate = async () => {
    if (!pendingRun) return;
    const { values, staffIds } = pendingRun;
    setSubmitting(true);
    try {
      const res = await payrollRunAPI.create({
        branch_id: Number(values.branch_id),
        month_year: values.month_year,
        ledger_id: Number(values.ledger_id),
        financial_year: Number(values.financial_year),
        staff_ids: staffIds,
      });

      const { generated, skipped } = res.data;
      if (generated.length > 0) {
        notifySuccess(
          `Salary for ${generated.length} employee${generated.length === 1 ? "" : "s"} has been generated and credited to their bank accounts.`
        );
      }
      if (skipped.length > 0) {
        notifyError(`${skipped.length} employee(s) were skipped: ${skipped.map((s) => `${s.staff_name} (${s.reason})`).join("; ")}`);
      }

      setPendingRun(null);
      setScopeBranchId(Number(values.branch_id));
      setScopeMonthYear(values.month_year);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    setRemoveLoading(true);
    try {
      await payrollRunAPI.removeMember(memberToRemove.id);
      notifySuccess(`${memberToRemove.employee_name} was removed from this payroll run.`);
      setMemberToRemove(null);
      refetch();
    } catch (err) {
      notifyError(getApiErrorMessage(err));
    } finally {
      setRemoveLoading(false);
    }
  };

  const hasScope = scopeBranchId !== null && scopeMonthYear !== "";
  const showBigLoadingState = hasScope && loading && members.length === 0 && !error;
  const showErrorState = hasScope && !loading && error && members.length === 0;
  const showEmptyState = hasScope && !loading && !error && members.length === 0;
  const showTable = hasScope && !showBigLoadingState && !showErrorState && !showEmptyState;

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
              <span className="breadcrumb-item breadcrumb-current">Payroll Runs</span>
            </nav>
            <h1 className="hr-page-title">Payroll Runs</h1>
          </div>
          <Can permission="payroll_run.generate">
            <button type="button" className="hr-btn hr-btn-primary" onClick={() => setModalOpen(true)}>
              <IconPlay />Generate Payroll Run
            </button>
          </Can>
        </div>


        <div className="hr-page-toolbar" style={{ gap: "0.75rem" }}>
          <select
            className="field-input hr-select"
            style={{ maxWidth: "220px" }}
            value={scopeCompanyId ?? ""}
            onChange={handleScopeCompanyChange}
          >
            <option value="">Select a school / university…</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            className="field-input hr-select"
            style={{ maxWidth: "240px" }}
            value={scopeBranchId ?? ""}
            onChange={(e) => setScopeBranchId(e.target.value ? Number(e.target.value) : null)}
            disabled={scopeCompanyId == null}
          >
            <option value="">{scopeCompanyId == null ? "Select a school / university first…" : "Select a campus to view its runs…"}</option>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <input
            type="month"
            className="field-input"
            style={{ maxWidth: "180px" }}
            value={scopeMonthYear}
            onChange={(e) => setScopeMonthYear(e.target.value)}
          />
        </div>

        {!hasScope && (
          <div className="hr-table-wrap"><div className="hr-state">
            <div className="hr-state-icon"><IconLayers /></div>
            <p className="hr-state-title">Pick a campus and month</p>
            <p className="hr-state-message">Select a campus and month above to view its payroll run, or generate a new one.</p>
          </div></div>
        )}

        {showBigLoadingState && (
          <div className="hr-table-wrap"><div className="hr-state">
            <span className="spinner-wrap"><span className="spinner" /></span>
            <p className="hr-state-message" style={{ marginTop: "0.75rem" }}>Loading payroll run…</p>
          </div></div>
        )}

        {showErrorState && (
          <div className="hr-table-wrap"><div className="hr-state hr-state-error">
            <div className="hr-state-icon"><IconAlertTriangle /></div>
            <p className="hr-state-title">Couldn't load this payroll run</p>
            <p className="hr-state-message">{error}</p>
            <button type="button" className="hr-btn hr-btn-primary" onClick={refetch}>Try again</button>
          </div></div>
        )}

        {showEmptyState && (
          <div className="hr-table-wrap"><div className="hr-state">
            <div className="hr-state-icon"><IconLayers /></div>
            <p className="hr-state-title">No payroll run for this campus/month yet</p>
            <p className="hr-state-message">Generate one to batch-create salary sheets for every eligible employee.</p>
            <Can permission="payroll_run.generate">
              <button type="button" className="hr-btn hr-btn-primary" onClick={() => setModalOpen(true)}>
                <IconPlay />Generate Payroll Run
              </button>
            </Can>
          </div></div>
        )}

        {showTable && (
          <>
            <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s" }}>
              <div className="hr-table-wrap">
                <table className="hr-table">
                  <thead>
                    <tr>
                      <th>Employee (Reg. No.)</th><th>Net Salary</th><th>Sheet Status</th><th>Run Status</th>
                      <th className="hr-table-actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => (
                      <tr key={m.id}>
                        <td className="hr-table-name">{m.employee_name} {m.reg_no ? `(${m.reg_no})` : ""}</td>
                        <td>{m.net_salary ?? "—"}</td>
                        <td>
                          <span className={`profile-status ${m.salary_status === "Approved" || m.salary_status === "Paid" ? "status-active" : "status-inactive"}`}>
                            {m.salary_status ?? "—"}
                          </span>
                        </td>
                        <td>{PAYROLL_RUN_STATUS_LABEL[m.status] ?? "Unknown"}</td>
                        <td>
                          <div className="hr-table-actions">
                            <Can permission="payroll_run.delete">
                              <button type="button" className="hr-btn hr-btn-ghost hr-btn-icon hr-table-delete-btn" aria-label={`Remove ${m.employee_name} from this run`} onClick={() => setMemberToRemove(m)}>
                                <IconX />
                              </button>
                            </Can>
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

      <PayrollConfirmModal
        open={pendingRun !== null}
        employeeCount={pendingRun?.staffIds.length ?? 0}
        withoutActiveBankAccountCount={pendingRun?.staffIdsWithoutActiveBankAccount.length ?? 0}
        monthLabel={
          pendingRun
            ? new Date(`${pendingRun.values.month_year}-01`).toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })
            : undefined
        }
        submitting={submitting}
        onConfirm={handleConfirmGenerate}
        onCancel={handleCancelConfirm}
      />

      <Toast notifications={notifications} onDismiss={dismiss} />

      <GeneratePayrollRunModal
        open={modalOpen}
        submitting={submitting}
        onSubmit={handleGenerateRequested}
        onCancel={() => setModalOpen(false)}
      />

      <ConfirmDialog
        open={memberToRemove !== null}
        title="Remove from payroll run?"
        message={memberToRemove ? `This removes "${memberToRemove.employee_name}" from this payroll run only — their already-generated salary sheet is not deleted and can still be managed from Salary Sheets.` : ""}
        confirmLabel="Remove"
        danger
        loading={removeLoading}
        onCancel={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemove}
      />
    </div>
  );
};

export default PayrollRunsPage;

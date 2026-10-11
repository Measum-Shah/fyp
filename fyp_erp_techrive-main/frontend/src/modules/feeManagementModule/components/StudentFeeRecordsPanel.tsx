import React, { useCallback, useEffect, useState } from "react";
import feeAPI from "../services/feeApi";
import type { FeeLookups } from "../hooks/useFeeLookups";
import { getErrorMessage } from "../hooks/useFeeLookups";
import {
  FeeField,
  FeeInput,
  FeeLoading,
  FeeModal,
  FeeSelect,
  FeeStatusBadge,
  FeeTable,
  FeeTextarea,
} from "./FeeUI";
import type { ConfirmState } from "./FeeModulePanels";
import FeeDocumentView from "./FeeDocumentView";
import type { FeeDocumentModel } from "../utils/feeDocumentModel";
import { buildFeeDocumentModel } from "../utils/feeDocumentModel";
import { printFeeDocument } from "../utils/feeDocumentPrint";
import { downloadFeeDocumentPdf } from "../utils/feeDocumentPdf";
import { FeeStudentPhoto } from "./FeeStudentPhoto";

type PanelProps = {
  lookups: FeeLookups | null;
  branchFilter?: number;
  showAlert: (t: "success" | "error" | "info", m: string) => void;
  setConfirm: React.Dispatch<React.SetStateAction<ConfirmState>>;
  onChanged: () => void;
};

const money = (v: unknown) => `₨ ${Number(v || 0).toLocaleString()}`;

const statusClass = (status: string) => {
  if (status === "Paid") return "fee-badge-active";
  if (status === "Overdue") return "fee-badge-inactive";
  return "fee-badge fee-scope-pill";
};

export const StudentFeeRecordsPanel: React.FC<PanelProps> = ({
  lookups,
  branchFilter,
  showAlert,
}) => {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [docModal, setDocModal] = useState<{
    open: boolean;
    title: string;
    model: FeeDocumentModel | null;
  }>({ open: false, title: "", model: null });
  const [payModal, setPayModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [automateModal, setAutomateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [payForm, setPayForm] = useState({
    fee_master_basic_id: "",
    fee_masters_id: "",
    amount: "",
    note: "",
  });
  const [settingsForm, setSettingsForm] = useState({
    basic_fee: "",
    discount: "",
    installment_id: "",
    program_id: "",
    status: "1",
  });
  const [automateForm, setAutomateForm] = useState({
    total_fee: "",
    tuition_fee: "",
    annual_fee: "",
    per_month_fee: "0",
    no_of_installments: "1",
    computer_fee: "0",
    ib_fee: "0",
    fee_structure_code: "",
    status: "1",
  });

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feeAPI.listStudentFeeRecords({
        branch_id: branchFilter,
        search: search || undefined,
        status: statusFilter || undefined,
        limit: 100,
      });
      setRows(res.data.data.items || []);
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [branchFilter, search, statusFilter, showAlert]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openDashboard = async (studentId: number) => {
    setSelectedStudentId(studentId);
    setDashLoading(true);
    try {
      const res = await feeAPI.getStudentFeeDashboard(studentId);
      setDashboard(res.data.data);
    } catch (err) {
      showAlert("error", getErrorMessage(err));
      setDashboard(null);
    } finally {
      setDashLoading(false);
    }
  };

  const refreshDashboard = async () => {
    if (selectedStudentId) await openDashboard(selectedStudentId);
    await loadList();
  };

  const closeDocModal = () => setDocModal({ open: false, title: "", model: null });

  const openInvoice = async (basicId: number) => {
    try {
      const res = await feeAPI.getStudentInvoice(basicId);
      setDocModal({
        open: true,
        title: "Fee Invoice",
        model: buildFeeDocumentModel(res.data.data, "invoice"),
      });
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    }
  };

  const openReceipt = async (basicId: number) => {
    try {
      const res = await feeAPI.getStudentReceipt(basicId);
      setDocModal({
        open: true,
        title: "Fee Receipt",
        model: buildFeeDocumentModel(res.data.data, "receipt"),
      });
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    }
  };

  const printDocument = () => {
    if (!docModal.model) return;
    printFeeDocument(docModal.model);
  };

  const downloadDocumentPdf = () => {
    if (!docModal.model) return;
    try {
      downloadFeeDocumentPdf(docModal.model);
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    }
  };

  const student = dashboard?.student as Record<string, unknown> | undefined;
  const summary = dashboard?.summary as Record<string, unknown> | undefined;
  const statements = (dashboard?.statements as Array<Record<string, unknown>>) || [];
  const history = (dashboard?.payment_history as Array<Record<string, unknown>>) || [];
  const settings = dashboard?.settings as Record<string, unknown> | null;
  const automate = (dashboard?.automate as Array<Record<string, unknown>>) || [];

  const savePayment = async () => {
    if (!payForm.fee_master_basic_id || !payForm.amount) {
      showAlert("error", "Statement and amount are required");
      return;
    }
    setSaving(true);
    try {
      await feeAPI.recordStudentPayment({
        fee_master_basic_id: Number(payForm.fee_master_basic_id),
        fee_masters_id: payForm.fee_masters_id
          ? Number(payForm.fee_masters_id)
          : undefined,
        amount: Number(payForm.amount),
        note: payForm.note || null,
      });
      showAlert("success", "Payment recorded on student fee lines");
      setPayModal(false);
      await refreshDashboard();
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    if (!selectedStudentId) return;
    setSaving(true);
    try {
      await feeAPI.upsertStudentFeeSettings({
        student_id: selectedStudentId,
        program_id: settingsForm.program_id
          ? Number(settingsForm.program_id)
          : undefined,
        installment_id: settingsForm.installment_id
          ? Number(settingsForm.installment_id)
          : undefined,
        basic_fee: settingsForm.basic_fee || "0",
        discount: settingsForm.discount || "0",
        status: settingsForm.status,
      });
      showAlert("success", "Student fee settings saved");
      setSettingsModal(false);
      await refreshDashboard();
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveAutomate = async () => {
    if (!selectedStudentId) return;
    setSaving(true);
    try {
      await feeAPI.upsertFeeAutomate({
        student_id: String(selectedStudentId),
        total_fee: automateForm.total_fee || null,
        tuition_fee: automateForm.tuition_fee || null,
        annual_fee: automateForm.annual_fee || null,
        per_month_fee: automateForm.per_month_fee || "0",
        no_of_installments: Number(automateForm.no_of_installments || 1),
        computer_fee: Number(automateForm.computer_fee || 0),
        ib_fee: Number(automateForm.ib_fee || 0),
        fee_structure_code: automateForm.fee_structure_code || null,
        status: Number(automateForm.status),
        branch_id: branchFilter,
      });
      showAlert("success", "Fee automate profile saved");
      setAutomateModal(false);
      await refreshDashboard();
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="fee-panel-header">
        <div>
          <h3>Student Fee Records</h3>
          <p>
            Centralized dues, payments, statements, invoices and receipts.
          </p>
        </div>
        <div className="fee-panel-actions">
          <FeeInput
            placeholder="Search student name / reg no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FeeSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "No Record", label: "No Record" },
              { value: "Paid", label: "Paid" },
              { value: "Partial", label: "Partial" },
              { value: "Unpaid", label: "Unpaid" },
              { value: "Overdue", label: "Overdue" },
            ]}
            placeholder="All statuses"
          />
        </div>
      </div>

      {!selectedStudentId ? (
        <FeeTable
          loading={loading}
          rows={rows}
          rowKey={(r) => Number((r.student as { id: number }).id)}
          emptyTitle="No student fee records yet"
          emptyDescription="Assign a fee structure to individual students under Assignments, then open their fee dashboard here."
          columns={[
            {
              key: "student",
              header: "Student",
              render: (r) => {
                const s = r.student as { name: string; reg_no?: string };
                return (
                  <div>
                    <strong>{s.name}</strong>
                    <div className="fee-hint">{s.reg_no || "No reg no"}</div>
                  </div>
                );
              },
            },
            {
              key: "dues",
              header: "Total Dues",
              render: (r) => money((r.summary as { total_dues: number }).total_dues),
            },
            {
              key: "paid",
              header: "Paid",
              render: (r) => money((r.summary as { total_paid: number }).total_paid),
            },
            {
              key: "balance",
              header: "Outstanding",
              render: (r) =>
                money((r.summary as { outstanding_balance: number }).outstanding_balance),
            },
            {
              key: "overdue",
              header: "Overdue",
              render: (r) =>
                money((r.summary as { overdue_amount: number }).overdue_amount),
            },
            {
              key: "status",
              header: "Status",
              render: (r) => {
                const st = (r.summary as { fee_status: string }).fee_status;
                return (
                  <span className={`fee-badge ${statusClass(st)}`}>{st}</span>
                );
              },
            },
            {
              key: "actions",
              header: "Actions",
              render: (r) => (
                <button
                  type="button"
                  className="fee-link-btn"
                  onClick={() => openDashboard(Number((r.student as { id: number }).id))}
                >
                  Open Dashboard
                </button>
              ),
            },
          ]}
        />
      ) : dashLoading || !dashboard ? (
        <FeeLoading label="Loading student fee dashboard…" />
      ) : (
        <div className="fee-student-dash">
          <div className="fee-panel-header">
            <div className="fee-student-identity">
              <FeeStudentPhoto
                studentImage={
                  typeof student?.student_image === "string"
                    ? student.student_image
                    : null
                }
                alt={`${(student?.name as string) || "Student"} passport photo`}
              />
              <div>
                <button
                  type="button"
                  className="fee-link-btn"
                  onClick={() => {
                    setSelectedStudentId(null);
                    setDashboard(null);
                  }}
                >
                  ← Back to list
                </button>
                <h3 style={{ marginTop: "0.55rem" }}>
                  {(student?.name as string) || "Student"}{" "}
                  <span className="fee-hint">
                    {(student?.reg_no as string) || ""}
                  </span>
                </h3>
                <p>
                  {[
                    (student?.branch as { name?: string } | null)?.name,
                    (student?.program as { name?: string } | null)?.name,
                    (student?.class as { name?: string } | null)?.name,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Academic profile"}
                </p>
              </div>
            </div>
            <div className="fee-panel-actions">
              <button
                type="button"
                className="fee-btn fee-btn-primary"
                onClick={() => {
                  setPayForm({
                    fee_master_basic_id: statements[0]
                      ? String(statements[0].id)
                      : "",
                    fee_masters_id: "",
                    amount: "",
                    note: "",
                  });
                  setPayModal(true);
                }}
              >
                Record Payment
              </button>
              <button
                type="button"
                className="fee-btn fee-btn-ghost"
                onClick={() => {
                  setSettingsForm({
                    basic_fee: String(settings?.basic_fee || summary?.total_dues || "0"),
                    discount: String(settings?.discount || "0"),
                    installment_id: String(settings?.installment_id || ""),
                    program_id: String(
                      settings?.program_id || student?.program_id || ""
                    ),
                    status: String(settings?.status || "1"),
                  });
                  setSettingsModal(true);
                }}
              >
                Fee Settings
              </button>
              <button
                type="button"
                className="fee-btn fee-btn-ghost"
                onClick={() => {
                  const existing = automate[0];
                  setAutomateForm({
                    total_fee: String(existing?.total_fee || summary?.total_dues || ""),
                    tuition_fee: String(existing?.tuition_fee || ""),
                    annual_fee: String(existing?.annual_fee || ""),
                    per_month_fee: String(existing?.per_month_fee || "0"),
                    no_of_installments: String(existing?.no_of_installments || "1"),
                    computer_fee: String(existing?.computer_fee || "0"),
                    ib_fee: String(existing?.ib_fee || "0"),
                    fee_structure_code: String(existing?.fee_structure_code || ""),
                    status: String(existing?.status ?? "1"),
                  });
                  setAutomateModal(true);
                }}
              >
                Automate Profile
              </button>
            </div>
          </div>

          <div className="fee-overview-grid">
            <div className="fee-overview-card">
              <span className="fee-overview-value">{money(summary?.total_dues)}</span>
              <span className="fee-overview-label">Total Dues</span>
            </div>
            <div className="fee-overview-card">
              <span className="fee-overview-value">{money(summary?.total_paid)}</span>
              <span className="fee-overview-label">Total Paid</span>
            </div>
            <div className="fee-overview-card">
              <span className="fee-overview-value">
                {money(summary?.outstanding_balance)}
              </span>
              <span className="fee-overview-label">Outstanding Balance</span>
            </div>
            <div className="fee-overview-card">
              <span className="fee-overview-value">{money(summary?.overdue_amount)}</span>
              <span className="fee-overview-label">Overdue Amount</span>
            </div>
            <div className="fee-overview-card">
              <span className="fee-overview-value">{money(summary?.late_fee_amount)}</span>
              <span className="fee-overview-label">Late Fee</span>
            </div>
            <div className="fee-overview-card">
              <span className="fee-overview-value">
                {money(summary?.total_outstanding_with_late)}
              </span>
              <span className="fee-overview-label">Total With Late Fee</span>
            </div>
            <div className="fee-overview-card">
              <span className="fee-overview-value">
                <span className={`fee-badge ${statusClass(String(summary?.fee_status))}`}>
                  {String(summary?.fee_status)}
                </span>
              </span>
              <span className="fee-overview-label">Current Fee Status</span>
            </div>
            <div className="fee-overview-card">
              <span className="fee-overview-value">
                {Number(summary?.assignment_count || 0)}
              </span>
              <span className="fee-overview-label">Fee Statements</span>
            </div>
          </div>

          <div className="fee-dash-section">
            <h4>Detailed Fee Statements</h4>
            <FeeTable
              rows={statements}
              rowKey={(r) => Number(r.id)}
              emptyTitle="No fee statements for this student"
              columns={[
                {
                  key: "bill",
                  header: "Bill / ID",
                  render: (r) => String(r.bill_no || `STMT-${r.id}`),
                },
                {
                  key: "structure",
                  header: "Structure",
                  render: (r) => <code>{String(r.fee_structure_code)}</code>,
                },
                {
                  key: "due",
                  header: "Due",
                  render: (r) => money(r.due_amount),
                },
                {
                  key: "paid",
                  header: "Paid",
                  render: (r) => money(r.paid_amount),
                },
                {
                  key: "bal",
                  header: "Balance",
                  render: (r) => money(r.balance),
                },
                {
                  key: "late",
                  header: "Late Fee",
                  render: (r) =>
                    money(
                      (r.late_fee as { late_fee_amount?: number } | undefined)
                        ?.late_fee_amount
                    ),
                },
                {
                  key: "total",
                  header: "Total Due",
                  render: (r) => money(r.total_outstanding_with_late ?? r.balance),
                },
                {
                  key: "dates",
                  header: "Due Period",
                  render: (r) =>
                    `${String(r.fee_due_date_start || "—").toString().slice(0, 10)} → ${String(r.fee_due_date_end || "—").toString().slice(0, 10)}`,
                },
                {
                  key: "st",
                  header: "Status",
                  render: (r) => (
                    <span className={`fee-badge ${statusClass(String(r.statement_status))}`}>
                      {String(r.statement_status)}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  header: "Documents",
                  render: (r) => (
                    <div className="fee-row-actions">
                      <button
                        type="button"
                        className="fee-link-btn"
                        onClick={() => openInvoice(Number(r.id))}
                      >
                        Invoice
                      </button>
                      <button
                        type="button"
                        className="fee-link-btn"
                        onClick={() => openReceipt(Number(r.id))}
                      >
                        Receipt
                      </button>
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <div className="fee-dash-section">
            <h4>Payment History</h4>
            <FeeTable
              rows={history}
              rowKey={(r) => Number(r.id)}
              emptyTitle="No payments recorded yet"
              emptyDescription="Use Record Payment to apply amounts against fee lines."
              columns={[
                {
                  key: "date",
                  header: "Date",
                  render: (r) =>
                    String(r.recorded_at || r.voucher_date || "—")
                      .toString()
                      .slice(0, 10),
                },
                {
                  key: "bill",
                  header: "Bill",
                  render: (r) => String(r.bill_no || `STMT-${r.fee_master_basic_id}`),
                },
                { key: "head", header: "Fee Head", render: (r) => String(r.fee_head) },
                { key: "amt", header: "Line Amount", render: (r) => money(r.fee_amount) },
                { key: "paid", header: "Paid", render: (r) => money(r.paid_amount) },
                { key: "rem", header: "Remaining", render: (r) => money(r.remaining) },
                {
                  key: "note",
                  header: "Note",
                  render: (r) => String(r.note || "—"),
                },
              ]}
            />
          </div>

          <div className="fee-dash-section fee-meta-grid">
            <div className="panel-card">
              <div className="panel-card-header">
                <h3>Student Fee Settings</h3>
              </div>
              {settings ? (
                <div className="profile-details">
                  <div className="profile-detail-row">
                    <span className="profile-detail-label">Basic Fee</span>
                    <span className="profile-detail-value">{String(settings.basic_fee)}</span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="profile-detail-label">Discount</span>
                    <span className="profile-detail-value">{String(settings.discount)}</span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="profile-detail-label">Installment ID</span>
                    <span className="profile-detail-value">
                      {String(settings.installment_id || "—")}
                    </span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="profile-detail-label">Status</span>
                    <FeeStatusBadge active={String(settings.status) === "1"} />
                  </div>
                </div>
              ) : (
                <p className="fee-hint">No settings saved yet.</p>
              )}
            </div>

            <div className="panel-card">
              <div className="panel-card-header">
                <h3>Fee Automate Profile</h3>
              </div>
              {automate[0] ? (
                <div className="profile-details">
                  <div className="profile-detail-row">
                    <span className="profile-detail-label">Total Fee</span>
                    <span className="profile-detail-value">{String(automate[0].total_fee)}</span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="profile-detail-label">Tuition</span>
                    <span className="profile-detail-value">{String(automate[0].tuition_fee)}</span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="profile-detail-label">Per Month</span>
                    <span className="profile-detail-value">
                      {String(automate[0].per_month_fee)}
                    </span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="profile-detail-label">Installments</span>
                    <span className="profile-detail-value">
                      {String(automate[0].no_of_installments)}
                    </span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="profile-detail-label">Structure</span>
                    <span className="profile-detail-value">
                      {String(automate[0].fee_structure_code || "—")}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="fee-hint">No automate profile yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <FeeModal
        open={payModal}
        title="Record Payment"
        onClose={() => setPayModal(false)}
        footer={
          <>
            <button type="button" className="fee-btn fee-btn-ghost" onClick={() => setPayModal(false)}>
              Cancel
            </button>
            <button type="button" className="fee-btn fee-btn-primary" onClick={savePayment} disabled={saving}>
              {saving ? "Saving…" : "Apply Payment"}
            </button>
          </>
        }
      >
        <div className="fee-form-grid">
          <FeeField label="Fee Statement" required>
            <FeeSelect
              value={payForm.fee_master_basic_id}
              onChange={(e) =>
                setPayForm((f) => ({ ...f, fee_master_basic_id: e.target.value }))
              }
              options={statements.map((s) => ({
                value: Number(s.id),
                label: `${String(s.bill_no || `STMT-${s.id}`)} · Bal ${money(s.balance)}`,
              }))}
            />
          </FeeField>
          <FeeField label="Amount" required>
            <FeeInput
              type="number"
              min={1}
              value={payForm.amount}
              onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </FeeField>
          <FeeField label="Specific Fee Line (optional)">
            <FeeSelect
              value={payForm.fee_masters_id}
              onChange={(e) =>
                setPayForm((f) => ({ ...f, fee_masters_id: e.target.value }))
              }
              options={((statements.find((s) => String(s.id) === payForm.fee_master_basic_id)
                ?.lines as Array<Record<string, unknown>>) || []).map((l) => ({
                value: Number(l.id),
                label: `${String(l.fee_head)} · paid ${money(l.fee_paid_amount)} / ${money(l.fee_amount)}`,
              }))}
              placeholder="Auto-distribute across unpaid lines"
            />
          </FeeField>
          <FeeField label="Note">
            <FeeTextarea
              value={payForm.note}
              onChange={(e) => setPayForm((f) => ({ ...f, note: e.target.value }))}
              rows={2}
            />
          </FeeField>
        </div>
      </FeeModal>

      <FeeModal
        open={settingsModal}
        title="Student Fee Settings"
        onClose={() => setSettingsModal(false)}
        footer={
          <>
            <button type="button" className="fee-btn fee-btn-ghost" onClick={() => setSettingsModal(false)}>
              Cancel
            </button>
            <button type="button" className="fee-btn fee-btn-primary" onClick={saveSettings} disabled={saving}>
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </>
        }
      >
        <div className="fee-form-grid">
          <FeeField label="Program">
            <FeeSelect
              value={settingsForm.program_id}
              onChange={(e) =>
                setSettingsForm((f) => ({ ...f, program_id: e.target.value }))
              }
              options={(lookups?.programs || []).map((p) => ({
                value: p.id,
                label: p.name,
              }))}
            />
          </FeeField>
          <FeeField label="Installment Plan">
            <FeeSelect
              value={settingsForm.installment_id}
              onChange={(e) =>
                setSettingsForm((f) => ({ ...f, installment_id: e.target.value }))
              }
              options={(lookups?.installmentPlans || []).map((i) => ({
                value: i.id,
                label: i.name || `Plan #${i.id}`,
              }))}
            />
          </FeeField>
          <FeeField label="Basic Fee">
            <FeeInput
              value={settingsForm.basic_fee}
              onChange={(e) =>
                setSettingsForm((f) => ({ ...f, basic_fee: e.target.value }))
              }
            />
          </FeeField>
          <FeeField label="Discount">
            <FeeInput
              value={settingsForm.discount}
              onChange={(e) =>
                setSettingsForm((f) => ({ ...f, discount: e.target.value }))
              }
            />
          </FeeField>
        </div>
      </FeeModal>

      <FeeModal
        open={automateModal}
        title="Fee Automate Profile"
        onClose={() => setAutomateModal(false)}
        wide
        footer={
          <>
            <button type="button" className="fee-btn fee-btn-ghost" onClick={() => setAutomateModal(false)}>
              Cancel
            </button>
            <button type="button" className="fee-btn fee-btn-primary" onClick={saveAutomate} disabled={saving}>
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </>
        }
      >
        <div className="fee-form-grid">
          <FeeField label="Total Fee">
            <FeeInput
              value={automateForm.total_fee}
              onChange={(e) => setAutomateForm((f) => ({ ...f, total_fee: e.target.value }))}
            />
          </FeeField>
          <FeeField label="Tuition Fee">
            <FeeInput
              value={automateForm.tuition_fee}
              onChange={(e) => setAutomateForm((f) => ({ ...f, tuition_fee: e.target.value }))}
            />
          </FeeField>
          <FeeField label="Annual Fee">
            <FeeInput
              value={automateForm.annual_fee}
              onChange={(e) => setAutomateForm((f) => ({ ...f, annual_fee: e.target.value }))}
            />
          </FeeField>
          <FeeField label="Per Month Fee">
            <FeeInput
              value={automateForm.per_month_fee}
              onChange={(e) => setAutomateForm((f) => ({ ...f, per_month_fee: e.target.value }))}
            />
          </FeeField>
          <FeeField label="No. of Installments">
            <FeeInput
              type="number"
              min={1}
              value={automateForm.no_of_installments}
              onChange={(e) =>
                setAutomateForm((f) => ({ ...f, no_of_installments: e.target.value }))
              }
            />
          </FeeField>
          <FeeField label="Fee Structure Code">
            <FeeSelect
              value={automateForm.fee_structure_code}
              onChange={(e) =>
                setAutomateForm((f) => ({ ...f, fee_structure_code: e.target.value }))
              }
              options={(lookups?.feeStructureCodes || []).map((s) => ({
                value: s.fee_structure_code,
                label: s.fee_structure_code,
              }))}
            />
          </FeeField>
        </div>
      </FeeModal>

      <FeeModal
        open={docModal.open}
        title={docModal.title}
        onClose={closeDocModal}
        wide
        footer={
          <>
            <button type="button" className="fee-btn fee-btn-ghost" onClick={closeDocModal}>
              Close
            </button>
            <button
              type="button"
              className="fee-btn fee-btn-ghost"
              onClick={printDocument}
              disabled={!docModal.model}
            >
              Print
            </button>
            <button
              type="button"
              className="fee-btn fee-btn-primary"
              onClick={downloadDocumentPdf}
              disabled={!docModal.model}
            >
              Download PDF
            </button>
          </>
        }
      >
        {docModal.model && <FeeDocumentView model={docModal.model} />}
      </FeeModal>
    </div>
  );
};

export default StudentFeeRecordsPanel;

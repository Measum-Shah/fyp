import React, { useCallback, useEffect, useMemo, useState } from "react";
import feeAPI from "../services/feeApi";
import type { FeeLookups } from "../hooks/useFeeLookups";
import { getErrorMessage } from "../hooks/useFeeLookups";
import {
  FeeField,
  FeeInput,
  FeeLoading,
  FeeModal,
  FeeSelect,
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

const stmtPayable = (s: Record<string, unknown>) =>
  Number(s.total_outstanding_with_late ?? s.balance ?? 0);

const stmtLateFee = (s: Record<string, unknown>) =>
  Number((s.late_fee as { late_fee_amount?: number } | undefined)?.late_fee_amount ?? 0);

const OFFLINE_MODES = ["Cash", "Cheque", "Bank Transfer"] as const;
const ONLINE_MODES = ["Stripe", "PayPal"] as const;

export const PaymentProcessingPanel: React.FC<PanelProps> = ({
  branchFilter,
  showAlert,
}) => {
  const [search, setSearch] = useState("");
  const [studentOptions, setStudentOptions] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [workspace, setWorkspace] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [sandboxModal, setSandboxModal] = useState(false);
  const [docModal, setDocModal] = useState<{
    open: boolean;
    title: string;
    model: FeeDocumentModel | null;
  }>({ open: false, title: "", model: null });
  const [saving, setSaving] = useState(false);
  const [sandboxSession, setSandboxSession] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [payForm, setPayForm] = useState({
    fee_master_basic_id: "",
    amount: "",
    payment_mode: "Cash",
    fee_masters_id: "",
    note: "",
    reference_no: "",
    paid_date: new Date().toISOString().slice(0, 10),
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const dashboard = workspace?.dashboard as Record<string, unknown> | undefined;
  const summary = dashboard?.summary as Record<string, unknown> | undefined;
  const student = dashboard?.student as Record<string, unknown> | undefined;
  const statements =
    (dashboard?.statements as Array<Record<string, unknown>>) || [];
  const history =
    (dashboard?.payment_history as Array<Record<string, unknown>>) || [];
  const transactions =
    (workspace?.payment_transactions as Array<Record<string, unknown>>) || [];
  const onlineTxns =
    (workspace?.online_transactions as Array<Record<string, unknown>>) || [];
  const emailStatus = workspace?.email_status as Record<string, unknown> | undefined;

  const searchStudents = useCallback(async () => {
    setSearching(true);
    try {
      const res = await feeAPI.listStudentFeeRecords({
        search: search || undefined,
        branch_id: branchFilter,
        limit: 50,
      });
      setStudentOptions(res.data.data.items || []);
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setSearching(false);
    }
  }, [search, branchFilter, showAlert]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      searchStudents();
    }, 250);
    return () => window.clearTimeout(t);
  }, [searchStudents]);

  const loadWorkspace = async (id: number) => {
    setStudentId(id);
    setLoading(true);
    try {
      const res = await feeAPI.getPaymentWorkspace(id);
      setWorkspace(res.data.data);
    } catch (err) {
      showAlert("error", getErrorMessage(err));
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    if (studentId) await loadWorkspace(studentId);
  };

  const selectedStatement = useMemo(
    () => statements.find((s) => String(s.id) === payForm.fee_master_basic_id),
    [statements, payForm.fee_master_basic_id]
  );

  const openPayModal = (basicId?: number) => {
    const stmt = basicId
      ? statements.find((s) => Number(s.id) === basicId)
      : statements.find((s) => Number(s.balance) > 0) || statements[0];
    setPayForm({
      fee_master_basic_id: stmt ? String(stmt.id) : "",
      amount: stmt ? String(stmtPayable(stmt)) : "",
      payment_mode: "Cash",
      fee_masters_id: "",
      note: "",
      reference_no: "",
      paid_date: new Date().toISOString().slice(0, 10),
    });
    setReceiptFile(null);
    setPayModal(true);
  };

  const setFullAmount = () => {
    if (selectedStatement) {
      setPayForm((f) => ({ ...f, amount: String(stmtPayable(selectedStatement)) }));
    }
  };

  const processOffline = async () => {
    if (!studentId || !payForm.fee_master_basic_id || !payForm.amount) {
      showAlert("error", "Student, invoice and amount are required");
      return;
    }
    if ((ONLINE_MODES as readonly string[]).includes(payForm.payment_mode)) {
      showAlert("error", "Use Pay Now for Stripe / PayPal sandbox payments");
      return;
    }
    setSaving(true);
    try {
      const needsUpload =
        receiptFile &&
        (payForm.payment_mode === "Cheque" || payForm.payment_mode === "Bank Transfer");

      let payload: Record<string, unknown> | FormData;
      if (needsUpload) {
        const fd = new FormData();
        fd.append("student_id", String(studentId));
        fd.append("fee_master_basic_id", payForm.fee_master_basic_id);
        fd.append("amount", payForm.amount);
        fd.append("payment_mode", payForm.payment_mode);
        if (payForm.fee_masters_id) fd.append("fee_masters_id", payForm.fee_masters_id);
        if (payForm.note) fd.append("note", payForm.note);
        if (payForm.reference_no) fd.append("reference_no", payForm.reference_no);
        if (payForm.paid_date) fd.append("paid_date", payForm.paid_date);
        fd.append("receipt_image", receiptFile);
        payload = fd;
      } else {
        payload = {
          student_id: studentId,
          fee_master_basic_id: Number(payForm.fee_master_basic_id),
          amount: Number(payForm.amount),
          payment_mode: payForm.payment_mode,
          fee_masters_id: payForm.fee_masters_id
            ? Number(payForm.fee_masters_id)
            : undefined,
          note: payForm.note || null,
          reference_no: payForm.reference_no || null,
          paid_date: payForm.paid_date || null,
        };
      }

      const res = await feeAPI.processFeePayment(payload);
      showAlert(
        "success",
        `Payment recorded · ${res.data.data.payment.payment_status} · Balance ${money(res.data.data.payment.remaining_balance)}`
      );
      const notifications = res.data.data.notifications as {
        triggered?: boolean;
        results?: Array<{ status: string }>;
      } | null;
      if (notifications?.triggered && notifications.results?.some((r) => r.status === "Skipped")) {
        showAlert(
          "info",
          "Payment confirmation logged. Configure email/SMS in Alerts & Notifications to deliver messages."
        );
      }
      setPayModal(false);
      await refresh();
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const startOnlinePay = async (mode: "Stripe" | "PayPal") => {
    if (!studentId || !payForm.fee_master_basic_id || !payForm.amount) {
      showAlert("error", "Select invoice and amount first");
      return;
    }
    setSaving(true);
    try {
      const res = await feeAPI.initiateOnlinePayment({
        student_id: studentId,
        fee_master_basic_id: Number(payForm.fee_master_basic_id),
        amount: Number(payForm.amount),
        payment_mode: mode,
        fee_masters_id: payForm.fee_masters_id
          ? Number(payForm.fee_masters_id)
          : undefined,
      });
      setSandboxSession(res.data.data);
      setPayModal(false);
      setSandboxModal(true);
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const finalizeOnline = async (status: "success" | "failed" | "cancelled") => {
    if (!sandboxSession?.transaction_number) return;
    setSaving(true);
    try {
      const res = await feeAPI.completeOnlinePayment({
        transaction_number: String(sandboxSession.transaction_number),
        status,
        gateway_reference: `${sandboxSession.provider}-SBX-${Date.now()}`,
      });
      if (status === "success" && res.data.data.payment_recorded) {
        showAlert(
          "success",
          `Sandbox payment successful · Invoice ${res.data.data.payment?.invoice_status || "updated"}`
        );
        if (res.data.data.email && !res.data.data.email.sent) {
          showAlert(
            "info",
            res.data.data.email.reason === "EMAIL_NOT_CONFIGURED"
              ? "Payment confirmation logged. Configure email_settings (or SMTP_*) in Alerts & Notifications."
              : "Payment confirmation queued for configured mail transport."
          );
        } else if (res.data.data.notifications?.triggered) {
          showAlert("info", "Payment confirmation notification processed.");
        }
      } else {
        showAlert(
          "info",
          res.data.data.message || `Online payment marked as ${status}`
        );
      }
      setSandboxModal(false);
      setSandboxSession(null);
      await refresh();
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const closeDocModal = () => setDocModal({ open: false, title: "", model: null });

  const openInvoice = async (basicId: number) => {
    try {
      const res = await feeAPI.getStudentInvoice(basicId);
      setDocModal({
        open: true,
        title: "Invoice",
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
        title: "Receipt",
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

  return (
    <div>
      <div className="fee-panel-header">
        <div>
          <h3>Payment Processing</h3>
          <p>
            Collect fees via Cash, Cheque, Bank Transfer, Stripe Sandbox or
            PayPal Sandbox. Updates invoices, receipts and dues automatically.
          </p>
        </div>
      </div>

      <div className="fee-pay-search">
        <FeeInput
          placeholder="Search student by name or registration no…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {searching && <span className="fee-hint">Searching…</span>}
      </div>

      {!studentId ? (
        <FeeTable
          loading={searching && !studentOptions.length}
          rows={studentOptions}
          rowKey={(r) => Number((r.student as { id: number }).id)}
          emptyTitle="No students with fee records"
          emptyDescription="Assign fees under Assignments and Student Fee Records first, then process payments here."
          columns={[
            {
              key: "name",
              header: "Student",
              render: (r) => {
                const s = r.student as { name: string; reg_no?: string };
                return (
                  <div>
                    <strong>{s.name}</strong>
                    <div className="fee-hint">{s.reg_no || ""}</div>
                  </div>
                );
              },
            },
            {
              key: "dues",
              header: "Total Fee",
              render: (r) => money((r.summary as { total_dues: number }).total_dues),
            },
            {
              key: "paid",
              header: "Paid",
              render: (r) => money((r.summary as { total_paid: number }).total_paid),
            },
            {
              key: "out",
              header: "Outstanding",
              render: (r) =>
                money((r.summary as { outstanding_balance: number }).outstanding_balance),
            },
            {
              key: "status",
              header: "Status",
              render: (r) => String((r.summary as { fee_status: string }).fee_status),
            },
            {
              key: "act",
              header: "Action",
              render: (r) => (
                <button
                  type="button"
                  className="fee-btn fee-btn-primary"
                  onClick={() => loadWorkspace(Number((r.student as { id: number }).id))}
                >
                  Select Student
                </button>
              ),
            },
          ]}
        />
      ) : loading || !workspace ? (
        <FeeLoading label="Loading payment workspace…" />
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
                alt={`${String(student?.name || "Student")} passport photo`}
              />
              <div>
                <button
                  type="button"
                  className="fee-link-btn"
                  onClick={() => {
                    setStudentId(null);
                    setWorkspace(null);
                  }}
                >
                  ← Change student
                </button>
                <h3 style={{ marginTop: "0.5rem" }}>
                  {String(student?.name)}{" "}
                  <span className="fee-hint">{String(student?.reg_no || "")}</span>
                </h3>
                <p>
                  {[
                    (student?.branch as { name?: string } | null)?.name,
                    (student?.program as { name?: string } | null)?.name,
                    (student?.class as { name?: string } | null)?.name,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
            <div className="fee-panel-actions">
              <button
                type="button"
                className="fee-btn fee-btn-primary"
                onClick={() => openPayModal()}
                disabled={!statements.some((s) => Number(s.balance) > 0)}
              >
                Collect Payment
              </button>
              <button type="button" className="fee-btn fee-btn-ghost" onClick={refresh}>
                Refresh
              </button>
            </div>
          </div>

          <div className="fee-overview-grid">
            <div className="fee-overview-card">
              <span className="fee-overview-value">{money(summary?.total_dues)}</span>
              <span className="fee-overview-label">Total Fee</span>
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
              <span className="fee-overview-value">{String(summary?.fee_status)}</span>
              <span className="fee-overview-label">Payment Status</span>
            </div>
            <div className="fee-overview-card">
              <span className="fee-overview-value">{transactions.length}</span>
              <span className="fee-overview-label">Payment Transactions</span>
            </div>
          </div>

          {!emailStatus?.configured && (
            <div className="fee-alert fee-alert-info" style={{ marginTop: "0.75rem" }}>
              Email receipt workflow is prepared. Connect SMTP via{" "}
              <code>email_settings</code> (status=1) or <code>SMTP_*</code> env — see{" "}
              <code>feeEmail.service.ts</code>.
            </div>
          )}

          <div className="fee-dash-section">
            <h4>Invoices</h4>
            <FeeTable
              rows={statements}
              rowKey={(r) => Number(r.id)}
              emptyTitle="No invoices"
              columns={[
                {
                  key: "bill",
                  header: "Bill",
                  render: (r) => String(r.bill_no || `STMT-${r.id}`),
                },
                { key: "due", header: "Due", render: (r) => money(r.due_amount) },
                { key: "paid", header: "Paid", render: (r) => money(r.paid_amount) },
                { key: "bal", header: "Balance", render: (r) => money(r.balance) },
                {
                  key: "st",
                  header: "Status",
                  render: (r) => String(r.statement_status),
                },
                {
                  key: "act",
                  header: "Actions",
                  render: (r) => (
                    <div className="fee-row-actions">
                      <button
                        type="button"
                        className="fee-link-btn"
                        onClick={() => openInvoice(Number(r.id))}
                      >
                        View Invoice
                      </button>
                      <button
                        type="button"
                        className="fee-link-btn"
                        onClick={() => openReceipt(Number(r.id))}
                      >
                        Receipt
                      </button>
                      {Number(r.balance) > 0 && (
                        <button
                          type="button"
                          className="fee-link-btn"
                          onClick={() => openPayModal(Number(r.id))}
                        >
                          Pay Now
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>

          <div className="fee-dash-section">
            <h4>Payment Transactions (`fee_collections`)</h4>
            <FeeTable
              rows={transactions}
              rowKey={(r) => Number(r.id)}
              emptyTitle="No payments collected yet"
              columns={[
                {
                  key: "date",
                  header: "Paid Date",
                  render: (r) => String(r.paid_date || "—").slice(0, 10),
                },
                { key: "bill", header: "Bill", render: (r) => String(r.bill_no) },
                { key: "mode", header: "Mode", render: (r) => String(r.payment_mode) },
                { key: "amt", header: "Amount", render: (r) => money(r.paid_amount) },
                { key: "bal", header: "Balance After", render: (r) => money(r.balance) },
                {
                  key: "type",
                  header: "Type",
                  render: (r) => (Number(r.all_paid) === 1 ? "Full" : "Partial"),
                },
                {
                  key: "voucher",
                  header: "Voucher",
                  render: (r) => <code>{String(r.voucher_sequence)}</code>,
                },
                {
                  key: "proof",
                  header: "Proof",
                  render: (r) => {
                    const imgPath = r.receipt_image_path as string | null;
                    if (!imgPath) return "—";
                    const url = `http://localhost:5000${imgPath}`;
                    return (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="fee-link-btn"
                      >
                        View
                      </a>
                    );
                  },
                },
              ]}
            />
          </div>

          <div className="fee-dash-section">
            <h4>Online Gateway Log (`api_payment_transaction`)</h4>
            <FeeTable
              rows={onlineTxns}
              rowKey={(r) => Number(r.id)}
              emptyTitle="No online sandbox transactions"
              columns={[
                {
                  key: "txn",
                  header: "Transaction",
                  render: (r) => <code>{String(r.transaction_number)}</code>,
                },
                { key: "bill", header: "Bill", render: (r) => String(r.bill_no) },
                { key: "amt", header: "Amount", render: (r) => money(r.amount) },
                {
                  key: "gw",
                  header: "Gateway State",
                  render: (r) => {
                    const g = r.gateway as { mode?: string; state?: string };
                    return `${g?.mode || "—"} · ${g?.state || "—"}`;
                  },
                },
              ]}
            />
          </div>

          <div className="fee-dash-section">
            <h4>Line Payment History</h4>
            <FeeTable
              rows={history}
              rowKey={(r) => Number(r.id)}
              emptyTitle="No line payments yet"
              columns={[
                {
                  key: "d",
                  header: "Date",
                  render: (r) => String(r.recorded_at || "—").slice(0, 10),
                },
                { key: "h", header: "Fee Head", render: (r) => String(r.fee_head) },
                { key: "p", header: "Paid", render: (r) => money(r.paid_amount) },
                { key: "r", header: "Remaining", render: (r) => money(r.remaining) },
              ]}
            />
          </div>
        </div>
      )}

      <FeeModal
        open={payModal}
        title="Collect Payment"
        onClose={() => setPayModal(false)}
        wide
        footer={
          <>
            <button type="button" className="fee-btn fee-btn-ghost" onClick={() => setPayModal(false)}>
              Cancel
            </button>
            {(ONLINE_MODES as readonly string[]).includes(payForm.payment_mode) ? (
              <button
                type="button"
                className="fee-btn fee-btn-primary"
                disabled={saving}
                onClick={() =>
                  startOnlinePay(payForm.payment_mode as "Stripe" | "PayPal")
                }
              >
                {saving ? "Starting…" : `Pay Now (${payForm.payment_mode} Sandbox)`}
              </button>
            ) : (
              <button
                type="button"
                className="fee-btn fee-btn-primary"
                disabled={saving}
                onClick={processOffline}
              >
                {saving ? "Processing…" : "Record Payment"}
              </button>
            )}
          </>
        }
      >
        <div className="fee-form-grid">
          <FeeField label="Invoice" required>
            <FeeSelect
              value={payForm.fee_master_basic_id}
              onChange={(e) => {
                const stmt = statements.find((s) => String(s.id) === e.target.value);
                setPayForm((f) => ({
                  ...f,
                  fee_master_basic_id: e.target.value,
                  amount: stmt ? String(stmt.balance || 0) : f.amount,
                }));
              }}
              options={statements.map((s) => ({
                value: Number(s.id),
                label: `${String(s.bill_no || `STMT-${s.id}`)} · Bal ${money(s.balance)} · ${String(s.statement_status)}`,
              }))}
            />
          </FeeField>
          <FeeField label="Payment Mode" required>
            <FeeSelect
              value={payForm.payment_mode}
              onChange={(e) =>
                setPayForm((f) => ({ ...f, payment_mode: e.target.value }))
              }
              options={[...OFFLINE_MODES, ...ONLINE_MODES].map((m) => ({
                value: m,
                label: m,
              }))}
              placeholder="Mode"
            />
          </FeeField>
          <FeeField label="Amount" required hint="Cannot exceed outstanding plus applicable late fee">
            <div className="fee-amount-row">
              <FeeInput
                type="number"
                min={1}
                step="0.01"
                value={payForm.amount}
                onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
              />
              <button type="button" className="fee-btn fee-btn-ghost" onClick={setFullAmount}>
                Full
              </button>
            </div>
          </FeeField>
          <FeeField label="Paid Date">
            <FeeInput
              type="date"
              value={payForm.paid_date}
              onChange={(e) => setPayForm((f) => ({ ...f, paid_date: e.target.value }))}
            />
          </FeeField>
          {(payForm.payment_mode === "Cheque" ||
            payForm.payment_mode === "Bank Transfer") && (
            <>
              <FeeField label="Reference No">
                <FeeInput
                  value={payForm.reference_no}
                  onChange={(e) =>
                    setPayForm((f) => ({ ...f, reference_no: e.target.value }))
                  }
                  placeholder="Cheque / transfer reference"
                />
              </FeeField>
              <div className="fee-field">
                <label
                  className="fee-label"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Receipt Image
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.55rem 0.75rem",
                    border: "1px dashed var(--input-border, #c5ced8)",
                    borderRadius: "8px",
                    background: "var(--input-bg, #f8fafc)",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                    style={{ flexShrink: 0, opacity: 0.75 }}
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    style={{ fontSize: "0.9rem", flex: 1, minWidth: 0 }}
                  />
                </div>
                <p className="fee-hint">
                  Upload proof of payment (JPG, PNG, WEBP · max 5 MB)
                </p>
                {receiptFile && (
                  <span className="fee-hint" style={{ marginTop: "0.25rem", display: "block" }}>
                    Selected: {receiptFile.name}
                  </span>
                )}
              </div>
            </>
          )}
          <FeeField label="Note">
            <FeeTextarea
              value={payForm.note}
              onChange={(e) => setPayForm((f) => ({ ...f, note: e.target.value }))}
              rows={2}
            />
          </FeeField>
        </div>
        {selectedStatement && (
          <p className="fee-hint" style={{ marginTop: "0.75rem" }}>
            Outstanding on this invoice: <strong>{money(selectedStatement.balance)}</strong>
            {stmtLateFee(selectedStatement) > 0 && (
              <>
                {" "}
                · Late fee: <strong>{money(stmtLateFee(selectedStatement))}</strong> · Total
                payable: <strong>{money(stmtPayable(selectedStatement))}</strong>
              </>
            )}
            {" · "}
            Enter full amount for Full Payment, or less for Partial Payment.
          </p>
        )}
      </FeeModal>

      <FeeModal
        open={sandboxModal}
        title={`${String(sandboxSession?.provider || "Online")} Sandbox Checkout`}
        onClose={() => {
          setSandboxModal(false);
          setSandboxSession(null);
        }}
        footer={
          <>
            <button
              type="button"
              className="fee-btn fee-btn-ghost"
              disabled={saving}
              onClick={() => finalizeOnline("cancelled")}
            >
              Cancel Payment
            </button>
            <button
              type="button"
              className="fee-btn fee-btn-danger"
              disabled={saving}
              onClick={() => finalizeOnline("failed")}
            >
              Simulate Failure
            </button>
            <button
              type="button"
              className="fee-btn fee-btn-primary"
              disabled={saving}
              onClick={() => finalizeOnline("success")}
            >
              {saving ? "Confirming…" : "Simulate Successful Payment"}
            </button>
          </>
        }
      >
        <div className="fee-sandbox-box">
          <p>
            <strong>Sandbox / Test Mode only</strong> — no live charges are made.
          </p>
          <div className="profile-details">
            <div className="profile-detail-row">
              <span className="profile-detail-label">Provider</span>
              <span className="profile-detail-value">
                {String(sandboxSession?.provider)}
              </span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-label">Session</span>
              <span className="profile-detail-value">
                <code>{String(sandboxSession?.transaction_number)}</code>
              </span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-label">Bill</span>
              <span className="profile-detail-value">
                {String(sandboxSession?.bill_no)}
              </span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-label">Amount</span>
              <span className="profile-detail-value">
                {money(sandboxSession?.amount)}
              </span>
            </div>
          </div>
          <p className="fee-hint" style={{ marginTop: "0.75rem" }}>
            On success the ERP will save the payment, update outstanding balance,
            refresh invoice status, generate receipt, and trigger the email receipt
            workflow.
          </p>
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

export default PaymentProcessingPanel;

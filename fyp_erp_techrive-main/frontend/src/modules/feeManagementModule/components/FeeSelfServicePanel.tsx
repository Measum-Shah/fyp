import React, { useCallback, useEffect, useState } from "react";
import feeAPI from "../services/feeApi";
import { getErrorMessage } from "../hooks/useFeeLookups";
import { FeeField, FeeInput, FeeLoading, FeeSelect, FeeTable } from "./FeeUI";
import type { FeeAccessProfile } from "../hooks/useFeeAccess";

type Props = {
  profile: FeeAccessProfile;
  showAlert: (t: "success" | "error" | "info", m: string) => void;
};

const money = (v: unknown) => `₨ ${Number(v || 0).toLocaleString()}`;

export const FeeSelfServicePanel: React.FC<Props> = ({ profile, showAlert }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentId, setStudentId] = useState<number | undefined>(
    profile.linked_student_ids[0]
  );
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [payForm, setPayForm] = useState({
    fee_master_basic_id: "",
    amount: "",
    payment_mode: "Cash",
    reference_no: "",
    note: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feeAPI.getMyFeeDashboard(studentId);
      setPayload(res.data.data as Record<string, unknown>);
      const sid = Number((res.data.data as { student_id?: number }).student_id);
      if (sid) setStudentId(sid);
    } catch (err) {
      showAlert("error", getErrorMessage(err, "Failed to load your fee information"));
    } finally {
      setLoading(false);
    }
  }, [studentId, showAlert]);

  useEffect(() => {
    load();
  }, [load]);

  const dashboard = (payload?.dashboard as Record<string, unknown>) || {};
  const summary = (dashboard.summary as Record<string, unknown>) || {};
  const statements = (dashboard.statements as Array<Record<string, unknown>>) || [];
  const history = (dashboard.payment_history as Array<Record<string, unknown>>) || [];
  const student = (dashboard.student as Record<string, unknown>) || {};

  const submitPayment = async () => {
    if (!payForm.fee_master_basic_id || !payForm.amount) {
      showAlert("error", "Select an invoice and enter an amount");
      return;
    }
    setSaving(true);
    try {
      await feeAPI.payMyFees({
        student_id: studentId,
        fee_master_basic_id: Number(payForm.fee_master_basic_id),
        amount: Number(payForm.amount),
        payment_mode: payForm.payment_mode,
        reference_no: payForm.reference_no || null,
        note: payForm.note || null,
      });
      showAlert("success", "Payment submitted for your fee account");
      setPayForm({
        fee_master_basic_id: "",
        amount: "",
        payment_mode: "Cash",
        reference_no: "",
        note: "",
      });
      await load();
    } catch (err) {
      showAlert("error", getErrorMessage(err, "Payment failed"));
    } finally {
      setSaving(false);
    }
  };

  if (loading && !payload) {
    return <FeeLoading label="Loading your fee information…" />;
  }

  if (!profile.linked_student_ids.length) {
    return (
      <div className="fee-panel">
        <div className="fee-empty">
          <h4>No linked student fee profile</h4>
          <p>
            Your account is not linked to a student fee record. Contact the institution
            administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fee-panel fee-notif-panel">
      <header className="fee-notif-header">
        <div>
          <div className="fee-notif-title-row">
            <h3>My Fee Information</h3>
          </div>
          <p className="fee-notif-desc">
            View your own fee summary, outstanding balance, invoices, and payment history.
            You cannot access other students&apos; records.
          </p>
        </div>
      </header>

      {profile.linked_student_ids.length > 1 && (
        <div className="fee-report-filters">
          <FeeField label="Student">
            <FeeSelect
              value={String(studentId || "")}
              onChange={(e) => setStudentId(Number(e.target.value))}
              options={profile.linked_student_ids.map((id) => ({
                value: String(id),
                label: `Student #${id}`,
              }))}
              placeholder="Select student"
            />
          </FeeField>
        </div>
      )}

      <div className="fee-report-stat-grid">
        <div className="fee-report-stat">
          <span className="fee-report-stat-value">{String(student.name || "—")}</span>
          <span className="fee-report-stat-label">Student</span>
        </div>
        <div className="fee-report-stat">
          <span className="fee-report-stat-value">{money(summary.total_dues)}</span>
          <span className="fee-report-stat-label">Total Dues</span>
        </div>
        <div className="fee-report-stat">
          <span className="fee-report-stat-value">{money(summary.total_paid)}</span>
          <span className="fee-report-stat-label">Total Paid</span>
        </div>
        <div className="fee-report-stat">
          <span className="fee-report-stat-value">{money(summary.outstanding_balance)}</span>
          <span className="fee-report-stat-label">Outstanding</span>
        </div>
      </div>

      <div className="panel-card">
        <h4>Statements / Invoices</h4>
        <FeeTable
          columns={[
            { key: "bill", header: "Bill No", render: (r) => String(r.bill_no || `STMT-${r.id}`) },
            { key: "due", header: "Due", render: (r) => money(r.due_amount) },
            { key: "paid", header: "Paid", render: (r) => money(r.paid_amount) },
            { key: "bal", header: "Balance", render: (r) => money(r.balance) },
            {
              key: "late",
              header: "Late Fee",
              render: (r) =>
                money((r.late_fee as Record<string, unknown> | undefined)?.late_fee_amount),
            },
            { key: "status", header: "Status", render: (r) => String(r.statement_status || "—") },
            {
              key: "actions",
              header: "Documents",
              render: (r) => (
                <div className="fee-row-actions">
                  <button
                    type="button"
                    className="fee-link-btn"
                    onClick={async () => {
                      try {
                        await feeAPI.getMyInvoice(Number(r.id));
                        showAlert("success", "Invoice loaded");
                      } catch (err) {
                        showAlert("error", getErrorMessage(err));
                      }
                    }}
                  >
                    Invoice
                  </button>
                  <button
                    type="button"
                    className="fee-link-btn"
                    onClick={async () => {
                      try {
                        await feeAPI.getMyReceipt(Number(r.id));
                        showAlert("success", "Receipt loaded");
                      } catch (err) {
                        showAlert("error", getErrorMessage(err));
                      }
                    }}
                  >
                    Receipt
                  </button>
                </div>
              ),
            },
          ]}
          rows={statements}
          rowKey={(r) => Number(r.id)}
          emptyTitle="No fee statements"
          emptyDescription="No fee statements are linked to your account yet."
        />
      </div>

      {profile.capabilities.includes("PAY_OWN_FEES") && (
        <div className="panel-card">
          <h4>Pay my fees</h4>
          <p className="fee-hint">Payments apply only to your linked student fee records.</p>
          <div className="fee-form-grid">
            <FeeField label="Invoice" required>
              <FeeSelect
                value={payForm.fee_master_basic_id}
                onChange={(e) => {
                  const stmt = statements.find((s) => String(s.id) === e.target.value);
                  setPayForm((f) => ({
                    ...f,
                    fee_master_basic_id: e.target.value,
                    amount: stmt ? String(stmt.balance || "") : f.amount,
                  }));
                }}
                options={statements
                  .filter((s) => Number(s.balance) > 0)
                  .map((s) => ({
                    value: String(s.id),
                    label: `${s.bill_no || `STMT-${s.id}`} · Bal ${money(s.balance)}`,
                  }))}
                placeholder="Select invoice"
              />
            </FeeField>
            <FeeField label="Amount" required>
              <FeeInput
                type="number"
                min="0"
                step="0.01"
                value={payForm.amount}
                onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </FeeField>
            <FeeField label="Payment mode">
              <FeeSelect
                value={payForm.payment_mode}
                onChange={(e) => setPayForm((f) => ({ ...f, payment_mode: e.target.value }))}
                options={[
                  { value: "Cash", label: "Cash" },
                  { value: "Bank Transfer", label: "Bank Transfer" },
                  { value: "Cheque", label: "Cheque" },
                ]}
                placeholder="Mode"
              />
            </FeeField>
            <FeeField label="Reference">
              <FeeInput
                value={payForm.reference_no}
                onChange={(e) => setPayForm((f) => ({ ...f, reference_no: e.target.value }))}
              />
            </FeeField>
          </div>
          <div className="fee-form-actions" style={{ marginTop: "0.85rem" }}>
            <button
              type="button"
              className="fee-btn fee-btn-primary"
              disabled={saving}
              onClick={submitPayment}
            >
              {saving ? "Submitting…" : "Submit Payment"}
            </button>
          </div>
        </div>
      )}

      <div className="panel-card">
        <h4>Payment history</h4>
        <FeeTable
          columns={[
            { key: "bill", header: "Bill", render: (r) => String(r.bill_no || "—") },
            { key: "amt", header: "Amount", render: (r) => money(r.paid_amount) },
            { key: "mode", header: "Mode", render: (r) => String(r.payment_mode || "—") },
            { key: "date", header: "Date", render: (r) => String(r.paid_date || "—") },
          ]}
          rows={history}
          rowKey={(r) => Number(r.id)}
          emptyTitle="No payments yet"
          emptyDescription="Your payments will appear here after they are recorded."
        />
      </div>
    </div>
  );
};

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import feeAPI from "../services/feeApi";
import type { FeeLookups } from "../hooks/useFeeLookups";
import { getErrorMessage } from "../hooks/useFeeLookups";
import { FeeField, FeeInput, FeeLoading, FeeSelect, FeeTable } from "./FeeUI";
import type { ConfirmState } from "./FeeModulePanels";
import "./AlertsNotificationsPanel.css";

type PanelProps = {
  lookups: FeeLookups | null;
  branchFilter?: number;
  showAlert: (t: "success" | "error" | "info", m: string) => void;
  setConfirm: React.Dispatch<React.SetStateAction<ConfirmState>>;
  onChanged: () => void;
};

type SubTab = "settings" | "history" | "automation";

type RunJobKind =
  | "due_run"
  | "due_preview"
  | "overdue_run"
  | "overdue_preview";

type RunResultPayload = {
  job: RunJobKind;
  dry_run: boolean;
  processed: number;
  sent: number;
  pending: number;
  skipped: number;
  failed: number;
  message?: string;
  results: Array<Record<string, unknown>>;
};

const TYPE_LABELS: Record<string, string> = {
  DUE_REMINDER: "Due Reminder",
  PAYMENT_CONFIRM: "Payment Confirmation",
  OVERDUE: "Overdue",
};

const JOB_TITLES: Record<RunJobKind, string> = {
  due_run: "Due Date Reminders — Run result",
  due_preview: "Due Date Reminders — Preview",
  overdue_run: "Overdue Notices — Run result",
  overdue_preview: "Overdue Notices — Preview",
};

const formatMoney = (value: unknown) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

const regLabel = (row: Record<string, unknown>) => {
  const reg = String(row.reg_no || "").trim();
  const walkin = String(row.walkin_reg_no || "").trim();
  if (reg && walkin) return `${reg} / ${walkin}`;
  return reg || walkin || "—";
};

const channelRecipientLabel = (row: Record<string, unknown>) => {
  const channel = String(row.channel || "").toUpperCase();
  const email = String(row.recipient_email || "").trim();
  const phone = String(row.recipient_phone || "").trim();
  const name = String(row.recipient || row.recipient_name || "").trim();
  const contact =
    channel === "EMAIL" ? email || "—" : channel === "SMS" ? phone || "—" : email || phone || "—";
  if (name && channel) return `${name} · ${channel} · ${contact}`;
  if (channel) return `${channel} · ${contact}`;
  return name || contact || "—";
};

const STATUS_CLASS: Record<string, string> = {
  Sent: "fee-notif-status--sent",
  Pending: "fee-notif-status--pending",
  Failed: "fee-notif-status--failed",
  Skipped: "fee-notif-status--skipped",
};

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const StatIcon = ({ children }: { children: React.ReactNode }) => (
  <span className="fee-notif-stat-icon" aria-hidden="true">
    {children}
  </span>
);

const ProviderPill = ({
  label,
  configured,
}: {
  label: string;
  configured: boolean;
}) => (
  <span className={`fee-notif-pill ${configured ? "fee-notif-pill--ok" : "fee-notif-pill--warn"}`}>
    {configured ? "● Configured" : "○ Not configured"} · {label}
  </span>
);

const ToggleRow = ({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) => (
  <label className="fee-notif-toggle">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="fee-notif-toggle-text">
      <span className="fee-notif-toggle-label">{label}</span>
      {description && <span className="fee-notif-toggle-desc">{description}</span>}
    </span>
  </label>
);

export const AlertsNotificationsPanel: React.FC<PanelProps> = ({
  branchFilter,
  showAlert,
}) => {
  const [subTab, setSubTab] = useState<SubTab>("settings");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [runningJob, setRunningJob] = useState<RunJobKind | null>(null);
  const [runResult, setRunResult] = useState<RunResultPayload | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  const [workspace, setWorkspace] = useState<Record<string, unknown> | null>(null);
  const [logItems, setLogItems] = useState<Array<Record<string, unknown>>>([]);
  const [logFilter, setLogFilter] = useState({ type: "", status: "" });

  const [settingsForm, setSettingsForm] = useState({
    enabled: true,
    due_reminder_enabled: true,
    due_reminder_days: "7,3,1",
    due_email: true,
    due_sms: false,
    payment_enabled: true,
    payment_email: true,
    payment_sms: false,
    overdue_enabled: true,
    overdue_email: true,
    overdue_sms: false,
    overdue_include_late_fee: true,
  });

  const initialLoadDone = useRef(false);
  const showAlertRef = useRef(showAlert);
  showAlertRef.current = showAlert;

  const applySettingsToForm = (settings: Record<string, unknown>) => {
    const due = (settings.due_reminder as Record<string, unknown>) || {};
    const dueChannels = (due.channels as Record<string, boolean>) || {};
    const payment = (settings.payment_confirmation as Record<string, unknown>) || {};
    const paymentChannels = (payment.channels as Record<string, boolean>) || {};
    const overdue = (settings.overdue as Record<string, unknown>) || {};
    const overdueChannels = (overdue.channels as Record<string, boolean>) || {};

    setSettingsForm({
      enabled: settings.enabled !== false,
      due_reminder_enabled: due.enabled !== false,
      due_reminder_days: Array.isArray(due.days_before)
        ? (due.days_before as number[]).join(",")
        : "7,3,1",
      due_email: dueChannels.email !== false,
      due_sms: !!dueChannels.sms,
      payment_enabled: payment.enabled !== false,
      payment_email: paymentChannels.email !== false,
      payment_sms: !!paymentChannels.sms,
      overdue_enabled: overdue.enabled !== false,
      overdue_email: overdueChannels.email !== false,
      overdue_sms: !!overdueChannels.sms,
      overdue_include_late_fee: overdue.include_late_fee !== false,
    });
  };

  const loadWorkspace = useCallback(async () => {
    if (!initialLoadDone.current) setLoading(true);
    try {
      const res = await feeAPI.getNotificationWorkspace(branchFilter);
      const data = res.data.data as Record<string, unknown>;
      setWorkspace(data);
      applySettingsToForm((data.settings as Record<string, unknown>) || {});
    } catch (err) {
      showAlertRef.current(
        "error",
        getErrorMessage(err, "Failed to load notification workspace")
      );
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [branchFilter]);

  const loadLog = useCallback(async () => {
    try {
      const res = await feeAPI.listNotificationLog({
        page: 1,
        limit: 50,
        type: logFilter.type || undefined,
        status: logFilter.status || undefined,
      });
      setLogItems((res.data.data.items as Array<Record<string, unknown>>) || []);
    } catch (err) {
      showAlertRef.current("error", getErrorMessage(err, "Failed to load notification log"));
    }
  }, [logFilter.type, logFilter.status]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    if (subTab === "history") loadLog();
  }, [subTab, loadLog]);

  const summary = (workspace?.summary as Record<string, number>) || {};
  const providers = (workspace?.providers as Record<string, Record<string, unknown>>) || {};
  const scheduling = (workspace?.scheduling as Record<string, unknown>) || {};
  const emailProvider = providers.email || {};
  const smsProvider = providers.sms || {};
  const notificationsEnabled = settingsForm.enabled;

  const saveSettings = async () => {
    const days = settingsForm.due_reminder_days
      .split(",")
      .map((d) => Number(d.trim()))
      .filter((n) => Number.isFinite(n) && n >= 0);

    if (!days.length) {
      showAlert("error", "Enter at least one reminder day (e.g. 7,3,1)");
      return;
    }

    setSaving(true);
    try {
      await feeAPI.updateNotificationSettings({
        enabled: settingsForm.enabled,
        due_reminder: {
          enabled: settingsForm.due_reminder_enabled,
          days_before: days,
          channels: { email: settingsForm.due_email, sms: settingsForm.due_sms },
        },
        payment_confirmation: {
          enabled: settingsForm.payment_enabled,
          channels: { email: settingsForm.payment_email, sms: settingsForm.payment_sms },
        },
        overdue: {
          enabled: settingsForm.overdue_enabled,
          channels: { email: settingsForm.overdue_email, sms: settingsForm.overdue_sms },
          include_late_fee: settingsForm.overdue_include_late_fee,
        },
      });
      showAlert("success", "Notification settings saved");
      await loadWorkspace();
    } catch (err) {
      showAlert("error", getErrorMessage(err, "Failed to save settings"));
    } finally {
      setSaving(false);
    }
  };

  const parseRunPayload = (
    job: RunJobKind,
    dryRun: boolean,
    data: Record<string, unknown>
  ): RunResultPayload => ({
    job,
    dry_run: dryRun,
    processed: Number(data.processed) || 0,
    sent: Number(data.sent) || 0,
    pending: Number(data.pending) || 0,
    skipped: Number(data.skipped) || 0,
    failed: Number(data.failed) || 0,
    message: typeof data.message === "string" ? data.message : undefined,
    results: Array.isArray(data.results)
      ? (data.results as Array<Record<string, unknown>>)
      : [],
  });

  const runReminders = async (dryRun: boolean) => {
    const job: RunJobKind = dryRun ? "due_preview" : "due_run";
    setRunResult(null);
    setRunError(null);
    setRunningJob(job);
    try {
      const res = await feeAPI.runDueDateReminders({
        branch_id: branchFilter,
        dry_run: dryRun,
      });
      const data = (res.data.data as Record<string, unknown>) || {};
      const payload = parseRunPayload(job, dryRun, data);
      setRunResult(payload);

      if (dryRun) {
        showAlert(
          "info",
          payload.processed === 0
            ? "No eligible candidates found."
            : `Preview: ${payload.processed} due-reminder candidate(s)`
        );
      } else {
        showAlert(
          "success",
          payload.processed === 0
            ? "No eligible due-reminder candidates found for the selected branch/settings."
            : `Due reminders: ${payload.sent} sent, ${payload.pending} pending, ${payload.skipped} skipped, ${payload.failed} failed`
        );
        await loadLog();
      }
      await loadWorkspace();
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to run due reminders");
      setRunError(msg);
      showAlert("error", msg);
    } finally {
      setRunningJob(null);
    }
  };

  const runOverdue = async (dryRun: boolean) => {
    const job: RunJobKind = dryRun ? "overdue_preview" : "overdue_run";
    setRunResult(null);
    setRunError(null);
    setRunningJob(job);
    try {
      const res = await feeAPI.runOverdueNotifications({
        branch_id: branchFilter,
        dry_run: dryRun,
      });
      const data = (res.data.data as Record<string, unknown>) || {};
      const payload = parseRunPayload(job, dryRun, data);
      setRunResult(payload);

      if (dryRun) {
        showAlert(
          "info",
          payload.processed === 0
            ? "No eligible candidates found."
            : `Preview: ${payload.processed} overdue candidate(s)`
        );
      } else {
        showAlert(
          "success",
          payload.processed === 0
            ? "No eligible overdue candidates found for the selected branch/settings."
            : `Overdue notices: ${payload.sent} sent, ${payload.pending} pending, ${payload.skipped} skipped, ${payload.failed} failed`
        );
        await loadLog();
      }
      await loadWorkspace();
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to run overdue notifications");
      setRunError(msg);
      showAlert("error", msg);
    } finally {
      setRunningJob(null);
    }
  };

  const running = runningJob !== null;

  const logColumns = useMemo(
    () => [
      {
        key: "created_at",
        header: "Date / Time",
        render: (r: Record<string, unknown>) =>
          String(r.created_at || "")
            .slice(0, 19)
            .replace("T", " "),
      },
      {
        key: "type",
        header: "Type",
        render: (r: Record<string, unknown>) =>
          TYPE_LABELS[String(r.type)] || String(r.type),
      },
      {
        key: "recipient_name",
        header: "Recipient",
        render: (r: Record<string, unknown>) => String(r.recipient_name || "—"),
      },
      {
        key: "channel",
        header: "Channel",
        render: (r: Record<string, unknown>) => String(r.channel || "—").toUpperCase(),
      },
      {
        key: "status",
        header: "Status",
        render: (r: Record<string, unknown>) => (
          <span
            className={`fee-notif-status ${STATUS_CLASS[String(r.status)] || "fee-notif-status--skipped"}`}
          >
            {String(r.status)}
          </span>
        ),
      },
      {
        key: "fee_ref",
        header: "Fee / Student",
        render: (r: Record<string, unknown>) => {
          const meta = (r.metadata as Record<string, unknown>) || {};
          const parts = [
            r.fee_master_basic_id ? `Stmt #${r.fee_master_basic_id}` : null,
            meta.bill_no ? String(meta.bill_no) : null,
            r.student_id ? `Student #${r.student_id}` : null,
          ].filter(Boolean);
          return parts.length ? parts.join(" · ") : "—";
        },
      },
      {
        key: "failure_reason",
        header: "Notes",
        render: (r: Record<string, unknown>) =>
          String(r.failure_reason || r.subject || "—"),
      },
    ],
    []
  );

  const statCards = [
    {
      key: "sent",
      label: "Sent",
      value: summary.sent ?? 0,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    {
      key: "pending",
      label: "Pending",
      value: summary.pending ?? 0,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      key: "skipped",
      label: "Skipped",
      value: summary.skipped ?? 0,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      ),
    },
    {
      key: "due",
      label: "Due Today",
      value: summary.due_reminder_candidates ?? 0,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      key: "overdue",
      label: "Overdue",
      value: summary.overdue_candidates ?? 0,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
  ];

  if (loading && !workspace) return <FeeLoading label="Loading alerts & notifications…" />;

  return (
    <div className="fee-panel fee-notif-panel">
      <header className="fee-notif-header">
        <div>
          <div className="fee-notif-title-row">
            <span className="fee-notif-icon-wrap">
              <BellIcon />
            </span>
            <h3>Alerts & Notifications</h3>
          </div>
          <p className="fee-notif-desc">
            Configure and monitor due-date reminders, payment confirmations, and overdue
            notifications for students and parents using existing contact records.
          </p>
        </div>
      </header>

      <div className="fee-notif-stat-grid" role="list" aria-label="Notification statistics">
        {statCards.map((card) => (
          <div key={card.key} className="fee-notif-stat" role="listitem">
            <StatIcon>{card.icon}</StatIcon>
            <div className="fee-notif-stat-body">
              <span className="fee-notif-stat-value">{card.value}</span>
              <span className="fee-notif-stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="fee-notif-provider-card">
        <div>
          <h4>Delivery Provider Status</h4>
          <p>
            Notifications are logged with honest delivery status. Messages are only marked as sent
            when a real email or SMS transport delivers them.
          </p>
        </div>
        <div className="fee-notif-provider-badges">
          <ProviderPill label="Email" configured={!!emailProvider.configured} />
          <ProviderPill label="SMS" configured={!!smsProvider.configured} />
          <span className={`fee-notif-pill ${notificationsEnabled ? "fee-notif-pill--ok" : "fee-notif-pill--muted"}`}>
            {notificationsEnabled ? "● Notifications enabled" : "○ Notifications disabled"}
          </span>
        </div>
      </div>

      <nav className="fee-notif-tabs-row" aria-label="Notification sections">
        <div className="fee-segment">
          {(
            [
              ["settings", "Settings"],
              ["history", "Notification History"],
              ["automation", "Run & Automation"],
            ] as Array<[SubTab, string]>
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={subTab === key ? "active" : ""}
              onClick={() => setSubTab(key)}
              aria-current={subTab === key ? "page" : undefined}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {subTab === "settings" && (
        <div className="fee-notif-settings">
          <div className="panel-card fee-notif-global-card">
            <h4>Global Notification Settings</h4>
            <p className="fee-notif-card-desc">
              Master switch for all fee notification types. Individual categories can still be
              configured below.
            </p>
            <ToggleRow
              checked={settingsForm.enabled}
              onChange={(checked) => setSettingsForm((f) => ({ ...f, enabled: checked }))}
              label="Enable all fee notifications"
              description="When disabled, no reminders, confirmations, or overdue notices will be processed."
            />
          </div>

          <div className="fee-notif-settings-grid">
            <div className="panel-card">
              <h4>Due Date Reminders</h4>
              <p className="fee-notif-card-desc">
                Automated reminders before fee due dates based on configured day offsets.
              </p>
              <ToggleRow
                checked={settingsForm.due_reminder_enabled}
                onChange={(checked) =>
                  setSettingsForm((f) => ({ ...f, due_reminder_enabled: checked }))
                }
                label="Enable due date reminders"
              />
              <div className="fee-notif-field-block">
                <FeeField
                  label="Days before due date"
                  hint="Comma-separated values, e.g. 7,3,1"
                >
                  <FeeInput
                    value={settingsForm.due_reminder_days}
                    onChange={(e) =>
                      setSettingsForm((f) => ({ ...f, due_reminder_days: e.target.value }))
                    }
                    placeholder="7,3,1"
                  />
                </FeeField>
              </div>
              <div className="fee-notif-channel-group">
                <ToggleRow
                  checked={settingsForm.due_email}
                  onChange={(checked) => setSettingsForm((f) => ({ ...f, due_email: checked }))}
                  label="Email channel"
                  description="Send reminders to student and parent email addresses."
                />
                <ToggleRow
                  checked={settingsForm.due_sms}
                  onChange={(checked) => setSettingsForm((f) => ({ ...f, due_sms: checked }))}
                  label="SMS channel"
                  description="Requires an SMS provider to be configured in system settings."
                />
              </div>
            </div>

            <div className="panel-card">
              <h4>Payment Confirmation</h4>
              <p className="fee-notif-card-desc">
                Notify recipients automatically after a successful payment in Payment Processing.
              </p>
              <ToggleRow
                checked={settingsForm.payment_enabled}
                onChange={(checked) =>
                  setSettingsForm((f) => ({ ...f, payment_enabled: checked }))
                }
                label="Send after successful payment"
                description="Triggered when Payment Processing records a completed payment."
              />
              <div className="fee-notif-channel-group">
                <ToggleRow
                  checked={settingsForm.payment_email}
                  onChange={(checked) =>
                    setSettingsForm((f) => ({ ...f, payment_email: checked }))
                  }
                  label="Email channel"
                />
                <ToggleRow
                  checked={settingsForm.payment_sms}
                  onChange={(checked) =>
                    setSettingsForm((f) => ({ ...f, payment_sms: checked }))
                  }
                  label="SMS channel"
                />
              </div>
            </div>

            <div className="panel-card">
              <h4>Overdue Notifications</h4>
              <p className="fee-notif-card-desc">
                Notices for fees past due date, using Late Fee Management calculations.
              </p>
              <ToggleRow
                checked={settingsForm.overdue_enabled}
                onChange={(checked) =>
                  setSettingsForm((f) => ({ ...f, overdue_enabled: checked }))
                }
                label="Enable overdue notifications"
              />
              <ToggleRow
                checked={settingsForm.overdue_include_late_fee}
                onChange={(checked) =>
                  setSettingsForm((f) => ({ ...f, overdue_include_late_fee: checked }))
                }
                label="Include late fee in overdue message"
                description="Shows applied late fee and total outstanding from Late Fee Management."
              />
              <div className="fee-notif-channel-group">
                <ToggleRow
                  checked={settingsForm.overdue_email}
                  onChange={(checked) =>
                    setSettingsForm((f) => ({ ...f, overdue_email: checked }))
                  }
                  label="Email channel"
                />
                <ToggleRow
                  checked={settingsForm.overdue_sms}
                  onChange={(checked) =>
                    setSettingsForm((f) => ({ ...f, overdue_sms: checked }))
                  }
                  label="SMS channel"
                />
              </div>
            </div>
          </div>

          <div className="fee-notif-save-bar">
            <button
              type="button"
              className="fee-btn fee-btn-primary"
              onClick={saveSettings}
              disabled={saving}
            >
              {saving ? (
                "Saving…"
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {subTab === "history" && (
        <>
          <div className="fee-notif-history-toolbar">
            <FeeSelect
              value={logFilter.type}
              onChange={(e) => setLogFilter((f) => ({ ...f, type: e.target.value }))}
              options={[
                { value: "", label: "All types" },
                { value: "DUE_REMINDER", label: "Due Reminder" },
                { value: "PAYMENT_CONFIRM", label: "Payment Confirmation" },
                { value: "OVERDUE", label: "Overdue" },
              ]}
              aria-label="Filter by type"
            />
            <FeeSelect
              value={logFilter.status}
              onChange={(e) => setLogFilter((f) => ({ ...f, status: e.target.value }))}
              options={[
                { value: "", label: "All statuses" },
                { value: "Sent", label: "Sent" },
                { value: "Pending", label: "Pending" },
                { value: "Skipped", label: "Skipped" },
                { value: "Failed", label: "Failed" },
              ]}
              aria-label="Filter by status"
            />
            <button type="button" className="fee-btn fee-btn-ghost" onClick={loadLog}>
              Refresh
            </button>
          </div>
          <FeeTable
            columns={logColumns}
            rows={logItems}
            rowKey={(r) =>
              String(r.id ?? `${r.created_at}-${r.type}-${r.recipient}-${r.channel}`)
            }
            emptyTitle="No notifications logged yet"
            emptyDescription="Notifications will appear here after reminders, payments, or overdue notices are processed."
          />
        </>
      )}

      {subTab === "automation" && (
        <div>
          <p className="fee-notif-note">
            Run notification jobs manually, or schedule them to run automatically (for example, daily).
            Re-running will not send the same message twice. Without Email/SMS provider credentials,
            eligible deliveries are recorded as Pending or Skipped — not Sent.
          </p>
          {scheduling.note != null ? <p className="fee-notif-note">{String(scheduling.note)}</p> : null}

          <div className="fee-notif-automation-grid">
            <div className="fee-notif-action-card">
              <h4>Due Date Reminders</h4>
              <p>
                Scans fee records for upcoming due dates matching your configured reminder days
                and sends notifications to eligible recipients.
              </p>
              <div className="fee-notif-action-buttons">
                <button
                  type="button"
                  className="fee-btn fee-btn-primary"
                  disabled={running}
                  onClick={() => runReminders(false)}
                >
                  {runningJob === "due_run" ? "Running…" : "Run Due Reminders Now"}
                </button>
                <button
                  type="button"
                  className="fee-btn fee-btn-ghost"
                  disabled={running}
                  onClick={() => runReminders(true)}
                >
                  {runningJob === "due_preview" ? "Previewing…" : "Preview Only"}
                </button>
              </div>
            </div>

            <div className="fee-notif-action-card">
              <h4>Overdue Notices</h4>
              <p>
                Identifies overdue fees outside the grace period (including late fees) and sends
                overdue notifications once per day per fee record.
              </p>
              <div className="fee-notif-action-buttons">
                <button
                  type="button"
                  className="fee-btn fee-btn-primary"
                  disabled={running}
                  onClick={() => runOverdue(false)}
                >
                  {runningJob === "overdue_run" ? "Running…" : "Run Overdue Notices Now"}
                </button>
                <button
                  type="button"
                  className="fee-btn fee-btn-ghost"
                  disabled={running}
                  onClick={() => runOverdue(true)}
                >
                  {runningJob === "overdue_preview" ? "Previewing…" : "Preview Only"}
                </button>
              </div>
            </div>
          </div>

          {(runError || runResult) && (
            <div
              className={`fee-notif-run-result ${runError ? "fee-notif-run-result--error" : ""}`}
              role="status"
              aria-live="polite"
            >
              {runError && (
                <>
                  <h4>Run &amp; Automation — Error</h4>
                  <p className="fee-notif-run-result-msg">{runError}</p>
                </>
              )}

              {runResult && !runError && (
                <>
                  <h4>{JOB_TITLES[runResult.job]}</h4>

                  {runResult.processed === 0 ? (
                    <p className="fee-notif-run-result-msg">
                      {runResult.message ||
                        (runResult.dry_run
                          ? "No eligible candidates found."
                          : runResult.job.startsWith("due")
                            ? "No eligible due-reminder candidates found for the selected branch/settings."
                            : "No eligible overdue candidates found for the selected branch/settings.")}
                    </p>
                  ) : null}

                  {!runResult.dry_run && (
                    <div className="fee-notif-run-counts">
                      <div>
                        <span>Processed</span>
                        <strong>{runResult.processed}</strong>
                      </div>
                      <div>
                        <span>Sent</span>
                        <strong>{runResult.sent}</strong>
                      </div>
                      <div>
                        <span>Pending</span>
                        <strong>{runResult.pending}</strong>
                      </div>
                      <div>
                        <span>Skipped</span>
                        <strong>{runResult.skipped}</strong>
                      </div>
                      <div>
                        <span>Failed</span>
                        <strong>{runResult.failed}</strong>
                      </div>
                    </div>
                  )}

                  {runResult.processed > 0 && (
                    <>
                      {runResult.dry_run && (
                        <p className="fee-notif-run-result-msg">
                          Dry run only — nothing was sent. Showing {runResult.results.length}{" "}
                          preview row(s) for {runResult.processed} candidate(s).
                        </p>
                      )}

                      {runResult.results.length > 0 && (
                        <div className="fee-notif-run-table-wrap">
                          <table className="fee-notif-run-table">
                            <thead>
                              <tr>
                                <th>Student</th>
                                <th>Reg / Walk-in</th>
                                {(runResult.job === "overdue_run" ||
                                  runResult.job === "overdue_preview") && (
                                  <>
                                    <th>Bill</th>
                                    <th>Due date</th>
                                    <th>Outstanding</th>
                                    <th>Late fee</th>
                                    <th>Total</th>
                                  </>
                                )}
                                {(runResult.job === "due_run" ||
                                  runResult.job === "due_preview") && (
                                  <>
                                    <th>Bill</th>
                                    <th>Due date</th>
                                    <th>Reminder days</th>
                                  </>
                                )}
                                <th>Recipient / channel</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {runResult.results.map((row, idx) => (
                                <tr
                                  key={String(
                                    row.idempotency_key ||
                                      `${row.student_id}-${row.channel}-${idx}`
                                  )}
                                >
                                  <td>{String(row.student_name || "—")}</td>
                                  <td>{regLabel(row)}</td>
                                  {(runResult.job === "overdue_run" ||
                                    runResult.job === "overdue_preview") && (
                                    <>
                                      <td>{String(row.bill_no || "—")}</td>
                                      <td>{String(row.due_date || "—")}</td>
                                      <td>{formatMoney(row.outstanding)}</td>
                                      <td>{formatMoney(row.late_fee)}</td>
                                      <td>{formatMoney(row.total_outstanding)}</td>
                                    </>
                                  )}
                                  {(runResult.job === "due_run" ||
                                    runResult.job === "due_preview") && (
                                    <>
                                      <td>{String(row.bill_no || "—")}</td>
                                      <td>{String(row.due_date || "—")}</td>
                                      <td>
                                        {row.days_before != null
                                          ? String(row.days_before)
                                          : "—"}
                                      </td>
                                    </>
                                  )}
                                  <td>{channelRecipientLabel(row)}</td>
                                  <td>
                                    <span
                                      className={`fee-notif-status ${
                                        STATUS_CLASS[String(row.status)] ||
                                        (String(row.status) === "would_send"
                                          ? "fee-notif-status--pending"
                                          : "fee-notif-status--skipped")
                                      }`}
                                    >
                                      {String(row.status)}
                                      {row.reason ? ` — ${String(row.reason)}` : ""}
                                      {row.failure_reason
                                        ? ` — ${String(row.failure_reason)}`
                                        : ""}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}

                  {!runResult.dry_run && runResult.processed > 0 && (
                    <p className="fee-notif-run-result-hint">
                      Notification History was refreshed automatically. Pending usually means
                      delivery is waiting for a configured Email/SMS provider.
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <div className="fee-notif-code-block">
            These jobs can also be scheduled to run automatically, for example once a day.
            Use the buttons above to send due reminders or overdue notices now.
          </div>
        </div>
      )}
    </div>
  );
};

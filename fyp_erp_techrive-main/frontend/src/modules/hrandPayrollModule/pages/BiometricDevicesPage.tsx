import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FormField from "../components/FormField";
import ConfirmDialog from "../components/ConfirmDialog";
import Toast from "../components/Toast";
import { useBranchesLookup } from "../hooks/useBranchesLookup";
import { useCompanyLookup } from "../hooks/useCompanyLookup";
import { useBranchDevice } from "../hooks/useBranchDevice";
import { useNotification } from "../hooks/useNotification";
import { branchAPI } from "../services/branch.service";
import { biometricDeviceAPI } from "../services/biometricDevice.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { DeviceInfo, SyncAttendanceResult, UploadStaffResult } from "../services/biometricDevice.types";
import "./employee-module.css";
import { Can } from "../components/Can";

/* ── Icons (same feather-style set already used across hrandPayrollModule) ── */
const IconHome = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconWifi = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.55a11 11 0 0 1 14.08 0" />
    <path d="M1.42 9a16 16 0 0 1 21.16 0" />
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>
);

const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

type ActionKey = "test" | "upload" | "sync" | "clear";

interface ActionState {
  loading: boolean;
  error: string | null;
  info?: DeviceInfo;
  uploadResult?: UploadStaffResult;
  syncResult?: SyncAttendanceResult;
  cleared?: boolean;
}

const EMPTY_ACTION_STATE: ActionState = { loading: false, error: null };

const BiometricDevicesPage: React.FC = () => {
  // Company → Branch cascade (see the Company→Branch scoping task).
  const [companyId, setCompanyId] = useState<number | null>(null);
  const { companies } = useCompanyLookup();
  const { branches, loading: branchesLoading, error: branchesError } = useBranchesLookup(companyId);
  const { notifications, notifySuccess, notifyError, dismiss } = useNotification();

  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(undefined);
  const { branch, loading: branchLoading, error: branchError, refetch } = useBranchDevice(selectedBranchId);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCompanyId(e.target.value ? Number(e.target.value) : null);
    // A branch from the old company is no longer valid/visible — clear it.
    setSelectedBranchId(undefined);
  };

  // Auto-select the first branch once the lookup loads, so the page isn't
  // an empty shell after picking a company.
  useEffect(() => {
    if (selectedBranchId === undefined && branches.length > 0) {
      setSelectedBranchId(branches[0].id);
    }
  }, [branches, selectedBranchId]);

  const [ipDraft, setIpDraft] = useState("");
  const [portDraft, setPortDraft] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    setIpDraft(branch?.ip ?? "");
    setPortDraft(branch?.port ?? "");
    setConfigError(null);
  }, [branch]);

  const [actions, setActions] = useState<Record<ActionKey, ActionState>>({
    test: EMPTY_ACTION_STATE,
    upload: EMPTY_ACTION_STATE,
    sync: EMPTY_ACTION_STATE,
    clear: EMPTY_ACTION_STATE,
  });
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  const setAction = (key: ActionKey, patch: Partial<ActionState>) => {
    setActions((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const hasIp = !!branch?.ip && branch.ip.trim() !== "";
  const configUnchanged = !!branch && ipDraft.trim() === (branch.ip ?? "") && portDraft.trim() === (branch.port ?? "");

  const handleSaveConfig = async () => {
    if (!branch) return;
    setSavingConfig(true);
    setConfigError(null);
    try {
      await branchAPI.update(branch.id, { ip: ipDraft.trim(), port: portDraft.trim() });
      notifySuccess("Device IP / Port saved successfully.");
      refetch();
    } catch (err) {
      setConfigError(getApiErrorMessage(err));
      notifyError(getApiErrorMessage(err));
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestConnection = async () => {
    if (!branch) return;
    setAction("test", { loading: true, error: null, info: undefined });
    try {
      const res = await biometricDeviceAPI.testConnection(branch.id);
      setAction("test", { loading: false, error: null, info: res.data });
      notifySuccess("Device connected successfully.");
    } catch (err) {
      const message = getApiErrorMessage(err);
      setAction("test", { loading: false, error: message, info: undefined });
      notifyError(message);
    }
  };

  const handleUploadStaff = async () => {
    if (!branch) return;
    setAction("upload", { loading: true, error: null, uploadResult: undefined });
    try {
      const res = await biometricDeviceAPI.uploadStaff(branch.id);
      setAction("upload", { loading: false, error: null, uploadResult: res.data });
      notifySuccess(res.message);
    } catch (err) {
      const message = getApiErrorMessage(err);
      setAction("upload", { loading: false, error: message, uploadResult: undefined });
      notifyError(message);
    }
  };

  const handleSyncAttendance = async () => {
    if (!branch) return;
    setAction("sync", { loading: true, error: null, syncResult: undefined });
    try {
      const res = await biometricDeviceAPI.syncAttendance(branch.id);
      setAction("sync", { loading: false, error: null, syncResult: res.data });
      notifySuccess(res.message);
    } catch (err) {
      const message = getApiErrorMessage(err);
      setAction("sync", { loading: false, error: message, syncResult: undefined });
      notifyError(message);
    }
  };

  const handleClearDevice = async () => {
    if (!branch) return;
    setAction("clear", { loading: true, error: null, cleared: false });
    try {
      await biometricDeviceAPI.clearDevice(branch.id);
      setAction("clear", { loading: false, error: null, cleared: true });
      notifySuccess("Device users and attendance log cleared successfully.");
    } catch (err) {
      const message = getApiErrorMessage(err);
      setAction("clear", { loading: false, error: message, cleared: false });
      notifyError(message);
    } finally {
      setConfirmClearOpen(false);
    }
  };

  return (
    <div className="hr-page">
      <div className="hr-page-inner">
        <div className="hr-page-header">
          <div>
            <nav className="breadcrumb">
              <Link to="/dashboard" className="breadcrumb-item">
                <IconHome /> Dashboard
              </Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item">HR &amp; Payroll</span>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item breadcrumb-current">Biometric Devices</span>
            </nav>
            <h1 className="hr-page-title">Biometric Devices</h1>
          </div>
        </div>

        {branchesError && (
          <div className="hr-table-wrap">
            <div className="hr-state hr-state-error">
              <div className="hr-state-icon">
                <IconAlert />
              </div>
              <p className="hr-state-title">Couldn't load campuses</p>
              <p className="hr-state-message">{branchesError}</p>
            </div>
          </div>
        )}

        {!branchesError && (
          <div className="hr-form-card">
            <div className="hr-form-grid">
              <FormField label="School / University" htmlFor="biometric-company">
                <select
                  id="biometric-company"
                  className="field-input hr-select"
                  value={companyId ?? ""}
                  onChange={handleCompanyChange}
                >
                  <option value="">Select school / university…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Campus" htmlFor="biometric-branch">
                <select
                  id="biometric-branch"
                  className="field-input hr-select"
                  value={selectedBranchId ?? ""}
                  disabled={branchesLoading || branches.length === 0 || companyId == null}
                  onChange={(e) => setSelectedBranchId(e.target.value ? Number(e.target.value) : undefined)}
                >
                  {companyId == null && <option value="">Select a school / university first…</option>}
                  {companyId != null && branches.length === 0 && <option value="">No campuses available</option>}
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            {branchLoading && (
              <p className="hr-field-hint" style={{ marginTop: "1rem" }}>
                Loading campus…
              </p>
            )}

            {branchError && (
              <p className="hr-field-error" role="alert">
                {branchError}
              </p>
            )}

            {branch && !branchLoading && (
              <>
                <h3 className="hr-form-section-title">Device Connection</h3>
                <div className="hr-form-grid">
                  <FormField label="Device IP Address" htmlFor="device-ip">
                    <input
                      id="device-ip"
                      className="field-input"
                      value={ipDraft}
                      onChange={(e) => setIpDraft(e.target.value)}
                      placeholder="192.168.1.201"
                      disabled={savingConfig}
                    />
                  </FormField>
                  <FormField label="Device Port" htmlFor="device-port" hint="Defaults to 4370 if left blank">
                    <input
                      id="device-port"
                      className="field-input"
                      value={portDraft}
                      onChange={(e) => setPortDraft(e.target.value)}
                      placeholder="4370"
                      disabled={savingConfig}
                    />
                  </FormField>
                </div>

                {configError && (
                  <p className="hr-field-error" role="alert">
                    {configError}
                  </p>
                )}

                <div className="hr-form-actions" style={{ marginTop: "1rem", paddingTop: 0, borderTop: "none" }}>
                  <Can permission="branch.update">
                    <button
                      type="button"
                      className="hr-btn hr-btn-primary"
                      onClick={handleSaveConfig}
                      disabled={savingConfig || configUnchanged}
                    >
                      {savingConfig ? "Saving…" : "Save Connection Settings"}
                    </button>
                  </Can>
                </div>

                <h3 className="hr-form-section-title">Device Actions</h3>

                {!hasIp && (
                  <p className="hr-field-hint">
                    Set and save the device IP above before running any of the actions below.
                  </p>
                )}

                <div className="hr-detail-grid">
                  {/* ── Test Connection ─────────────────────────────────── */}
                  <div className="hr-detail-item">
                    <span className="hr-detail-label">Connection</span>
                    <Can permission="biometric_device.test_connection">
                      <button
                        type="button"
                        className="hr-btn hr-btn-secondary"
                        onClick={handleTestConnection}
                        disabled={!hasIp || actions.test.loading}
                      >
                        <IconWifi />
                        {actions.test.loading ? "Testing…" : "Test Connection"}
                      </button>
                    </Can>
                    {actions.test.info && (
                      <p className="hr-detail-value" style={{ color: "#1a9e5c" }}>
                        <IconCheck /> Connected — {actions.test.info.userCounts ?? 0} users,{" "}
                        {actions.test.info.logCounts ?? 0} logs on device.
                      </p>
                    )}
                    {actions.test.error && (
                      <p className="hr-field-error" role="alert">
                        {actions.test.error}
                      </p>
                    )}
                  </div>

                  {/* ── Upload Staff ────────────────────────────────────── */}
                  <div className="hr-detail-item">
                    <span className="hr-detail-label">Staff Upload</span>
                    <Can permission="biometric_device.upload_staff">
                      <button
                        type="button"
                        className="hr-btn hr-btn-secondary"
                        onClick={handleUploadStaff}
                        disabled={!hasIp || actions.upload.loading}
                      >
                        {actions.upload.loading ? "Uploading…" : "Upload Staff to Device"}
                      </button>
                    </Can>
                    {actions.upload.uploadResult && (
                      <p className="hr-detail-value">
                        Uploaded {actions.upload.uploadResult.uploaded} of{" "}
                        {actions.upload.uploadResult.total} active staff.
                        {actions.upload.uploadResult.failed.length > 0 && (
                          <> {actions.upload.uploadResult.failed.length} failed.</>
                        )}
                      </p>
                    )}
                    {actions.upload.error && (
                      <p className="hr-field-error" role="alert">
                        {actions.upload.error}
                      </p>
                    )}
                  </div>

                  {/* ── Sync Attendance ─────────────────────────────────── */}
                  <div className="hr-detail-item">
                    <span className="hr-detail-label">Attendance Sync</span>
                    <Can permission="biometric_device.sync_attendance">
                      <button
                        type="button"
                        className="hr-btn hr-btn-primary"
                        onClick={handleSyncAttendance}
                        disabled={!hasIp || actions.sync.loading}
                      >
                        {actions.sync.loading ? "Syncing…" : "Sync Attendance"}
                      </button>
                    </Can>
                    {actions.sync.syncResult && (
                      <p className="hr-detail-value">
                        {actions.sync.syncResult.logsSeen} punches read — {actions.sync.syncResult.inserted}{" "}
                        new records, {actions.sync.syncResult.timeOutUpdates} time-out updates.
                      </p>
                    )}
                    {actions.sync.error && (
                      <p className="hr-field-error" role="alert">
                        {actions.sync.error}
                      </p>
                    )}
                  </div>

                  {/* ── Clear Device ────────────────────────────────────── */}
                  <div className="hr-detail-item">
                    <span className="hr-detail-label">Reset Device</span>
                    <Can permission="biometric_device.clear_device">
                      <button
                        type="button"
                        className="hr-btn hr-btn-danger"
                        onClick={() => setConfirmClearOpen(true)}
                        disabled={!hasIp || actions.clear.loading}
                      >
                        {actions.clear.loading ? "Clearing…" : "Clear Device"}
                      </button>
                    </Can>
                    {actions.clear.cleared && (
                      <p className="hr-detail-value">
                        <IconCheck /> Users and attendance log cleared on the device.
                      </p>
                    )}
                    {actions.clear.error && (
                      <p className="hr-field-error" role="alert">
                        {actions.clear.error}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <Toast notifications={notifications} onDismiss={dismiss} />

      <ConfirmDialog
        open={confirmClearOpen}
        title="Clear this device?"
        message="This wipes all enrolled users and the on-board attendance log directly on the biometric terminal. Data already synced into the Attendance module is not affected, but anything not yet synced will be lost. This cannot be undone."
        confirmLabel="Clear Device"
        danger
        loading={actions.clear.loading}
        onCancel={() => setConfirmClearOpen(false)}
        onConfirm={handleClearDevice}
      />
    </div>
  );
};

export default BiometricDevicesPage;

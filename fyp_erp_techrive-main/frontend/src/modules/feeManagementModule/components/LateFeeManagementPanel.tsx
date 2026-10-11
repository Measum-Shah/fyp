import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
} from "./FeeUI";
import type { ConfirmState } from "./FeeModulePanels";

type PanelProps = {
  lookups: FeeLookups | null;
  branchFilter?: number;
  showAlert: (t: "success" | "error" | "info", m: string) => void;
  setConfirm: React.Dispatch<React.SetStateAction<ConfirmState>>;
  onChanged: () => void;
};

type SubTab = "rules" | "incidents";

const money = (v: unknown) => `₨ ${Number(v || 0).toLocaleString()}`;

const CALC_LABELS: Record<string, string> = {
  FIXED: "Fixed amount",
  PERCENT: "Percentage",
  PER_DAY: "Per day",
};

export const LateFeeManagementPanel: React.FC<PanelProps> = ({
  lookups,
  branchFilter,
  showAlert,
  setConfirm,
  onChanged,
}) => {
  const [subTab, setSubTab] = useState<SubTab>("rules");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [workspace, setWorkspace] = useState<Record<string, unknown> | null>(null);
  const [rules, setRules] = useState<Array<Record<string, unknown>>>([]);
  const [incidents, setIncidents] = useState<Array<Record<string, unknown>>>([]);
  const [incidentsLoading, setIncidentsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [incidentBranchId, setIncidentBranchId] = useState(
    branchFilter ? String(branchFilter) : ""
  );
  const [incidentProgramId, setIncidentProgramId] = useState("");
  const [incidentClassId, setIncidentClassId] = useState("");
  /** Client-side filter on API payment_status (API has no status query param). */
  const [incidentStatus, setIncidentStatus] = useState<"" | "Overdue" | "In Grace">("");

  const [ruleModal, setRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Record<string, unknown> | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: "",
    branch_id: "",
    program_id: "",
    class_id: "",
    calculation_type: "FIXED",
    fixed_amount: "",
    percentage: "",
    per_day_amount: "",
    max_cap: "",
    grace_period_days: "5",
    effective_from: "",
    effective_to: "",
    status: "Active",
  });

  const [previewBasicId, setPreviewBasicId] = useState("");
  const [previewResult, setPreviewResult] = useState<Record<string, unknown> | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const initialLoadDone = useRef(false);
  const showAlertRef = useRef(showAlert);
  showAlertRef.current = showAlert;

  const resetRuleForm = () => {
    setRuleForm({
      name: "",
      branch_id: branchFilter ? String(branchFilter) : "",
      program_id: "",
      class_id: "",
      calculation_type: "FIXED",
      fixed_amount: "",
      percentage: "",
      per_day_amount: "",
      max_cap: "",
      grace_period_days: "5",
      effective_from: "",
      effective_to: "",
      status: "Active",
    });
    setEditingRule(null);
  };

  const loadWorkspace = useCallback(async () => {
    if (!initialLoadDone.current) setLoading(true);
    try {
      const res = await feeAPI.getLateFeeWorkspace(branchFilter);
      const data = res.data.data as Record<string, unknown>;
      setWorkspace(data);
      setRules((data.rules as Array<Record<string, unknown>>) || []);
    } catch (err) {
      showAlertRef.current(
        "error",
        getErrorMessage(err, "Failed to load late fee workspace")
      );
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [branchFilter]);

  const loadIncidents = useCallback(async () => {
    setIncidentsLoading(true);
    try {
      const res = await feeAPI.listLateFeeIncidents({
        branch_id: incidentBranchId
          ? Number(incidentBranchId)
          : branchFilter,
        program_id: incidentProgramId ? Number(incidentProgramId) : undefined,
        class_id: incidentClassId ? Number(incidentClassId) : undefined,
        search: search.trim() || undefined,
        limit: 100,
      });
      setIncidents((res.data.data.items as Array<Record<string, unknown>>) || []);
    } catch (err) {
      showAlertRef.current(
        "error",
        getErrorMessage(err, "Failed to load late fee incidents")
      );
    } finally {
      setIncidentsLoading(false);
    }
  }, [
    branchFilter,
    incidentBranchId,
    incidentProgramId,
    incidentClassId,
    search,
  ]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    setIncidentBranchId(branchFilter ? String(branchFilter) : "");
  }, [branchFilter]);

  useEffect(() => {
    if (subTab !== "incidents") return;
    const timer = window.setTimeout(() => {
      loadIncidents();
    }, search ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [subTab, loadIncidents, search]);

  const filteredIncidents = useMemo(() => {
    if (!incidentStatus) return incidents;
    return incidents.filter(
      (i) => String(i.payment_status || "") === incidentStatus
    );
  }, [incidents, incidentStatus]);

  const summary = (workspace?.summary as Record<string, number>) || {};

  const openCreateRule = () => {
    resetRuleForm();
    setRuleModal(true);
  };

  const openEditRule = (rule: Record<string, unknown>) => {
    setEditingRule(rule);
    setRuleForm({
      name: String(rule.name || ""),
      branch_id: rule.branch_id ? String(rule.branch_id) : "",
      program_id: rule.program_id ? String(rule.program_id) : "",
      class_id: rule.class_id ? String(rule.class_id) : "",
      calculation_type: String(rule.calculation_type || "FIXED"),
      fixed_amount: rule.fixed_amount != null ? String(rule.fixed_amount) : "",
      percentage: rule.percentage != null ? String(rule.percentage) : "",
      per_day_amount: rule.per_day_amount != null ? String(rule.per_day_amount) : "",
      max_cap: rule.max_cap != null ? String(rule.max_cap) : "",
      grace_period_days: String(rule.grace_period_days ?? 0),
      effective_from: rule.effective_from ? String(rule.effective_from).slice(0, 10) : "",
      effective_to: rule.effective_to ? String(rule.effective_to).slice(0, 10) : "",
      status: String(rule.status || "Active"),
    });
    setRuleModal(true);
  };

  const saveRule = async () => {
    setSaving(true);
    try {
      const body = {
        name: ruleForm.name.trim(),
        branch_id: ruleForm.branch_id ? Number(ruleForm.branch_id) : null,
        program_id: ruleForm.program_id ? Number(ruleForm.program_id) : null,
        class_id: ruleForm.class_id ? Number(ruleForm.class_id) : null,
        calculation_type: ruleForm.calculation_type,
        fixed_amount: ruleForm.fixed_amount ? Number(ruleForm.fixed_amount) : null,
        percentage: ruleForm.percentage ? Number(ruleForm.percentage) : null,
        per_day_amount: ruleForm.per_day_amount ? Number(ruleForm.per_day_amount) : null,
        max_cap: ruleForm.max_cap ? Number(ruleForm.max_cap) : null,
        grace_period_days: Number(ruleForm.grace_period_days || 0),
        effective_from: ruleForm.effective_from || null,
        effective_to: ruleForm.effective_to || null,
        status: ruleForm.status,
      };

      if (editingRule) {
        await feeAPI.updateLateFeeRule(Number(editingRule.id), body);
        showAlert("success", "Late fee rule updated");
      } else {
        await feeAPI.createLateFeeRule(body);
        showAlert("success", "Late fee rule created");
      }
      setRuleModal(false);
      resetRuleForm();
      await loadWorkspace();
      onChanged();
    } catch (err) {
      showAlert("error", getErrorMessage(err, "Failed to save late fee rule"));
    } finally {
      setSaving(false);
    }
  };

  const toggleRuleStatus = (rule: Record<string, unknown>) => {
    const next = rule.status === "Active" ? "Inactive" : "Active";
    setConfirm({
      open: true,
      title: next === "Active" ? "Activate rule" : "Deactivate rule",
      message: `Set “${rule.name}” to ${next}?`,
      onConfirm: async () => {
        await feeAPI.setLateFeeRuleStatus(Number(rule.id), next);
        showAlert("success", `Rule ${next.toLowerCase()}`);
        await loadWorkspace();
        onChanged();
      },
    });
  };

  const deleteRule = (rule: Record<string, unknown>) => {
    setConfirm({
      open: true,
      title: "Delete late fee rule",
      message: `Delete “${rule.name}”? This cannot be undone.`,
      onConfirm: async () => {
        await feeAPI.deleteLateFeeRule(Number(rule.id));
        showAlert("success", "Late fee rule deleted");
        await loadWorkspace();
        onChanged();
      },
    });
  };

  const runPreview = async () => {
    const raw = previewBasicId.trim();
    if (!raw) {
      setPreviewResult(null);
      setPreviewError("Enter a fee statement ID (numeric or STMT-{id}).");
      showAlert("error", "Enter a fee statement ID to preview");
      return;
    }
    const stmtMatch = /^STMT-(\d+)$/i.exec(raw);
    const numericOnly = /^\d+$/.test(raw);
    if (!stmtMatch && !numericOnly) {
      setPreviewResult(null);
      setPreviewError(
        "Invalid statement ID. Use a numeric ID or STMT-{id} (for example STMT-12)."
      );
      showAlert("error", "Invalid statement ID format");
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await feeAPI.previewLateFee(raw);
      setPreviewResult(res.data.data as Record<string, unknown>);
    } catch (err) {
      setPreviewResult(null);
      const msg = getErrorMessage(err, "Preview failed");
      setPreviewError(msg);
      showAlert("error", msg);
    } finally {
      setPreviewLoading(false);
    }
  };

  const branchOptions = useMemo(
    () =>
      (lookups?.branches || []).map((b) => ({
        value: String(b.id),
        label: b.name || `Branch #${b.id}`,
      })),
    [lookups]
  );

  const programOptions = useMemo(() => {
    const branchIdNum = incidentBranchId
      ? Number(incidentBranchId)
      : branchFilter;
    return (lookups?.programs || [])
      .filter((p) =>
        branchIdNum
          ? !p.branch_id || Number(p.branch_id) === Number(branchIdNum)
          : true
      )
      .map((p) => ({
        value: String(p.id),
        label: p.name || `Program #${p.id}`,
      }));
  }, [lookups, incidentBranchId, branchFilter]);

  const classOptions = useMemo(
    () =>
      (lookups?.classes || []).map((c) => ({
        value: String(c.id),
        label: c.name || `Class #${c.id}`,
      })),
    [lookups]
  );

  /** Rule-form program list is not narrowed by incident filters. */
  const ruleProgramOptions = useMemo(
    () =>
      (lookups?.programs || []).map((p) => ({
        value: String(p.id),
        label: p.name || `Program #${p.id}`,
      })),
    [lookups]
  );

  if (loading && !workspace) return <FeeLoading />;

  return (
    <div className="fee-panel">
      <div className="fee-panel-header">
        <div>
          <h3>Late Fee Management</h3>
          <p>
            Configure grace periods and automated late fee rules using existing fee due dates
            and outstanding balances.
          </p>
        </div>
        <div className="fee-panel-actions">
          <div className="fee-segment">
            {(
              [
                ["rules", "Rules & Grace Periods"],
                ["incidents", "Overdue & Late Fees"],
              ] as Array<[SubTab, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={subTab === key ? "active" : ""}
                onClick={() => setSubTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
          {subTab === "rules" && (
            <button type="button" className="fee-btn fee-btn-primary" onClick={openCreateRule}>
              Add Late Fee Rule
            </button>
          )}
        </div>
      </div>

      <div className="fee-overview-grid">
        {[
          { key: "active_rules", label: "Active Rules" },
          { key: "fees_with_late_fee", label: "Fees With Late Fee" },
          { key: "fees_in_grace", label: "In Grace Period" },
          { key: "total_rules", label: "Total Rules" },
        ].map((card) => (
          <div key={card.key} className="fee-overview-card">
            <span className="fee-overview-value">{summary[card.key] ?? 0}</span>
            <span className="fee-overview-label">{card.label}</span>
          </div>
        ))}
      </div>

      {subTab === "rules" && (
        <>
          <div className="panel-card">
            <h4>Calculation preview</h4>
            <p className="fee-hint">
              Enter a fee statement ID from Student Fee Records (numeric ID or{" "}
              <code>STMT-&#123;id&#125;</code>) to preview the live late-fee calculation for today.
            </p>
            <div className="fee-toolbar">
              <FeeField label="Statement ID">
                <FeeInput
                  value={previewBasicId}
                  onChange={(e) => {
                    setPreviewBasicId(e.target.value);
                    setPreviewError(null);
                  }}
                  placeholder="e.g. 12 or STMT-12"
                />
              </FeeField>
              <button
                type="button"
                className="fee-btn fee-btn-secondary"
                onClick={runPreview}
                disabled={previewLoading}
              >
                {previewLoading ? "Previewing…" : "Preview"}
              </button>
            </div>
            {previewError && (
              <p className="fee-hint" style={{ marginTop: "0.75rem", color: "#b42318" }} role="alert">
                {previewError}
              </p>
            )}
            {previewResult && (
              <div className="fee-hint" style={{ marginTop: "0.75rem" }}>
                <p>
                  <strong>Statement:</strong>{" "}
                  {String(
                    (previewResult.statement as { statement_ref?: string; id?: number } | undefined)
                      ?.statement_ref ||
                      (previewResult.statement as { id?: number } | undefined)?.id ||
                      "—"
                  )}
                </p>
                <p>
                  <strong>Payment status:</strong> {String(previewResult.payment_status)}
                </p>
                <p>
                  <strong>Original amount:</strong> {money(previewResult.original_fee_amount)}
                </p>
                <p>
                  <strong>Paid:</strong> {money(previewResult.paid_amount)}
                </p>
                <p>
                  <strong>Outstanding:</strong> {money(previewResult.outstanding_balance)}
                </p>
                <p>
                  <strong>Due date:</strong> {String(previewResult.due_date || "—")}
                </p>
                <p>
                  <strong>Grace period:</strong> {String(previewResult.grace_period_days)} days
                </p>
                <p>
                  <strong>Late fee starts:</strong>{" "}
                  {String(previewResult.late_fee_starts_on || "—")}
                </p>
                <p>
                  <strong>Days overdue:</strong> {String(previewResult.days_overdue || 0)}
                  {Number(previewResult.days_in_grace_remaining || 0) > 0
                    ? ` · Grace remaining: ${String(previewResult.days_in_grace_remaining)}`
                    : ""}
                </p>
                <p>
                  <strong>Matched rule:</strong>{" "}
                  {String(
                    previewResult.matched_rule_name ||
                      (previewResult.rule as { name?: string } | null | undefined)?.name ||
                      "None"
                  )}
                </p>
                <p>
                  <strong>Calculation type:</strong>{" "}
                  {String(
                    previewResult.calculation_type ||
                      (previewResult.rule as { calculation_type?: string } | null | undefined)
                        ?.calculation_type ||
                      "—"
                  )}
                </p>
                <p>
                  <strong>Late fee:</strong> {money(previewResult.late_fee_amount)}
                </p>
                <p>
                  <strong>Total payable with late fee:</strong>{" "}
                  {money(previewResult.total_outstanding_with_late)}
                </p>
                {previewResult.reason != null && String(previewResult.reason).trim() !== "" && (
                  <p>
                    <strong>Reason:</strong> {String(previewResult.reason)}
                  </p>
                )}
              </div>
            )}
          </div>

          <FeeTable
            rowKey={(r) => Number(r.id)}
            emptyTitle="No late fee rules"
            emptyDescription="Create a rule to define grace periods and late fee amounts."
            columns={[
              { key: "name", header: "Rule", render: (r) => String(r.name) },
              {
                key: "calc",
                header: "Calculation",
                render: (r) => CALC_LABELS[String(r.calc)] || String(r.calc),
              },
              { key: "grace", header: "Grace", render: (r) => String(r.grace) },
              { key: "scope", header: "Scope", render: (r) => String(r.scope) },
              {
                key: "status",
                header: "Status",
                render: (r) => (
                  <FeeStatusBadge active={String(r.statusLabel) === "Active"} />
                ),
              },
              {
                key: "actions",
                header: "",
                render: (r) => (
                  <div className="fee-row-actions">
                    <button
                      type="button"
                      className="fee-link-btn"
                      onClick={() => openEditRule(r.raw as Record<string, unknown>)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="fee-link-btn"
                      onClick={() => toggleRuleStatus(r.raw as Record<string, unknown>)}
                    >
                      {String(r.statusLabel) === "Active" ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      className="fee-link-btn"
                      onClick={() => deleteRule(r.raw as Record<string, unknown>)}
                    >
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
            rows={rules.map((r) => ({
              id: r.id,
              name: String(r.name),
              calc: r.calculation_type,
              grace: `${r.grace_period_days ?? 0} days`,
              scope: [
                r.branch_id ? `Branch ${r.branch_id}` : "All branches",
                r.program_id ? `Prog ${r.program_id}` : null,
                r.class_id ? `Class ${r.class_id}` : null,
              ]
                .filter(Boolean)
                .join(" · "),
              statusLabel: r.status,
              raw: r,
            }))}
          />
        </>
      )}

      {subTab === "incidents" && (
        <>
          <div className="fee-toolbar" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
            <FeeField label="Branch">
              <FeeSelect
                value={incidentBranchId}
                onChange={(e) => {
                  setIncidentBranchId(e.target.value);
                  setIncidentProgramId("");
                }}
                options={branchOptions}
                placeholder="All branches"
                aria-label="Filter by branch"
              />
            </FeeField>
            <FeeField label="Program">
              <FeeSelect
                value={incidentProgramId}
                onChange={(e) => setIncidentProgramId(e.target.value)}
                options={programOptions}
                placeholder="All programs"
                aria-label="Filter by program"
              />
            </FeeField>
            <FeeField label="Class">
              <FeeSelect
                value={incidentClassId}
                onChange={(e) => setIncidentClassId(e.target.value)}
                options={classOptions}
                placeholder="All classes"
                aria-label="Filter by class"
              />
            </FeeField>
            <FeeField label="Status">
              <FeeSelect
                value={incidentStatus}
                onChange={(e) =>
                  setIncidentStatus(
                    e.target.value as "" | "Overdue" | "In Grace"
                  )
                }
                options={[
                  { value: "Overdue", label: "Overdue" },
                  { value: "In Grace", label: "In Grace" },
                ]}
                placeholder="All statuses"
                aria-label="Filter by payment status"
              />
            </FeeField>
            <FeeField label="Search student">
              <FeeInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, registration no, or bill no…"
                aria-label="Search student"
              />
            </FeeField>
            <button
              type="button"
              className="fee-btn fee-btn-secondary"
              onClick={loadIncidents}
              disabled={incidentsLoading}
            >
              {incidentsLoading ? "Loading…" : "Refresh"}
            </button>
          </div>

          <FeeTable
            loading={incidentsLoading}
            rowKey={(r) => Number(r.id)}
            emptyTitle="No overdue or late-fee records found for the selected filters."
            emptyDescription="Adjust branch, program, class, status, or search — or ensure fee statements have due dates and outstanding balances."
            columns={[
              { key: "student", header: "Student", render: (r) => r.studentNode },
              { key: "bill", header: "Bill", render: (r) => String(r.bill) },
              { key: "status", header: "Status", render: (r) => String(r.status) },
              { key: "due", header: "Due date", render: (r) => String(r.due) },
              { key: "grace", header: "Grace", render: (r) => String(r.grace) },
              {
                key: "outstanding",
                header: "Outstanding",
                render: (r) => String(r.outstanding),
              },
              { key: "late", header: "Late fee", render: (r) => String(r.late) },
              { key: "total", header: "Total due", render: (r) => String(r.total) },
            ]}
            rows={filteredIncidents.map((i) => ({
              id: i.fee_master_basic_id,
              studentNode: (
                <div>
                  <div>{(i.student as { name?: string })?.name}</div>
                  <div className="fee-hint">
                    {(i.student as { reg_no?: string })?.reg_no}
                  </div>
                </div>
              ),
              bill: String(i.bill_no || `STMT-${i.fee_master_basic_id}`),
              status: String(i.payment_status),
              due: String(i.due_date || "—"),
              grace: `${i.grace_period_days ?? 0} days`,
              outstanding: money(i.outstanding_balance),
              late: money(i.late_fee_amount),
              total: money(i.total_outstanding_with_late),
            }))}
          />
        </>
      )}

      <FeeModal
        open={ruleModal}
        title={editingRule ? "Edit late fee rule" : "New late fee rule"}
        onClose={() => {
          setRuleModal(false);
          resetRuleForm();
        }}
        footer={
          <>
            <button
              type="button"
              className="fee-btn fee-btn-secondary"
              onClick={() => {
                setRuleModal(false);
                resetRuleForm();
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="fee-btn fee-btn-primary"
              disabled={saving}
              onClick={saveRule}
            >
              {saving ? "Saving…" : "Save rule"}
            </button>
          </>
        }
      >
        <div className="fee-form-grid">
          <FeeField label="Rule name" required>
            <FeeInput
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
            />
          </FeeField>
          <FeeField label="Status">
            <FeeSelect
              value={ruleForm.status}
              onChange={(e) => setRuleForm({ ...ruleForm, status: e.target.value })}
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
              placeholder="Status"
            />
          </FeeField>
          <FeeField label="Calculation type" required>
            <FeeSelect
              value={ruleForm.calculation_type}
              onChange={(e) =>
                setRuleForm({ ...ruleForm, calculation_type: e.target.value })
              }
              options={[
                { value: "FIXED", label: "Fixed late fee" },
                { value: "PERCENT", label: "Percentage of outstanding" },
                { value: "PER_DAY", label: "Per day after grace" },
              ]}
              placeholder="Type"
            />
          </FeeField>
          <FeeField label="Grace period (days)" required>
            <FeeInput
              type="number"
              min={0}
              value={ruleForm.grace_period_days}
              onChange={(e) =>
                setRuleForm({ ...ruleForm, grace_period_days: e.target.value })
              }
            />
          </FeeField>
          {ruleForm.calculation_type === "FIXED" && (
            <FeeField label="Fixed amount">
              <FeeInput
                type="number"
                min={0}
                value={ruleForm.fixed_amount}
                onChange={(e) => setRuleForm({ ...ruleForm, fixed_amount: e.target.value })}
              />
            </FeeField>
          )}
          {ruleForm.calculation_type === "PERCENT" && (
            <FeeField label="Percentage (%)">
              <FeeInput
                type="number"
                min={0}
                max={100}
                value={ruleForm.percentage}
                onChange={(e) => setRuleForm({ ...ruleForm, percentage: e.target.value })}
              />
            </FeeField>
          )}
          {ruleForm.calculation_type === "PER_DAY" && (
            <FeeField label="Amount per day">
              <FeeInput
                type="number"
                min={0}
                value={ruleForm.per_day_amount}
                onChange={(e) =>
                  setRuleForm({ ...ruleForm, per_day_amount: e.target.value })
                }
              />
            </FeeField>
          )}
          <FeeField label="Maximum cap (optional)">
            <FeeInput
              type="number"
              min={0}
              value={ruleForm.max_cap}
              onChange={(e) => setRuleForm({ ...ruleForm, max_cap: e.target.value })}
            />
          </FeeField>
          <FeeField label="Branch (optional)">
            <FeeSelect
              value={ruleForm.branch_id}
              onChange={(e) => setRuleForm({ ...ruleForm, branch_id: e.target.value })}
              options={branchOptions}
              placeholder="All branches"
            />
          </FeeField>
          <FeeField label="Program (optional)">
            <FeeSelect
              value={ruleForm.program_id}
              onChange={(e) => setRuleForm({ ...ruleForm, program_id: e.target.value })}
              options={ruleProgramOptions}
              placeholder="All programs"
            />
          </FeeField>
          <FeeField label="Class (optional)">
            <FeeSelect
              value={ruleForm.class_id}
              onChange={(e) => setRuleForm({ ...ruleForm, class_id: e.target.value })}
              options={classOptions}
              placeholder="All classes"
            />
          </FeeField>
          <FeeField label="Effective from">
            <FeeInput
              type="date"
              value={ruleForm.effective_from}
              onChange={(e) => setRuleForm({ ...ruleForm, effective_from: e.target.value })}
            />
          </FeeField>
          <FeeField label="Effective to">
            <FeeInput
              type="date"
              value={ruleForm.effective_to}
              onChange={(e) => setRuleForm({ ...ruleForm, effective_to: e.target.value })}
            />
          </FeeField>
        </div>
        <p className="fee-hint">
          Example: due date 10 Aug, grace 5 days → late fee starts 16 Aug. Rules are stored in
          existing payment_settings (identity LATE_FEE) — no schema changes.
        </p>
      </FeeModal>
    </div>
  );
};

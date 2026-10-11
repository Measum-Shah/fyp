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
  FeeStatusBadge,
  FeeTable,
  FeeTextarea,
} from "./FeeUI";
import type { ConfirmState } from "./FeeModulePanels";
import { FeeStudentPhoto } from "./FeeStudentPhoto";

type PanelProps = {
  lookups: FeeLookups | null;
  branchFilter?: number;
  showAlert: (t: "success" | "error" | "info", m: string) => void;
  setConfirm: React.Dispatch<React.SetStateAction<ConfirmState>>;
  onChanged: () => void;
};

type SubTab = "types" | "scholarships" | "rules" | "apply";

const money = (v: unknown) => `₨ ${Number(v || 0).toLocaleString()}`;

export const DiscountsConcessionsPanel: React.FC<PanelProps> = ({
  lookups,
  branchFilter,
  showAlert,
  setConfirm,
  onChanged,
}) => {
  const [subTab, setSubTab] = useState<SubTab>("types");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [types, setTypes] = useState<Array<Record<string, unknown>>>([]);
  const [typeModal, setTypeModal] = useState(false);
  const [editingType, setEditingType] = useState<Record<string, unknown> | null>(null);
  const [typeForm, setTypeForm] = useState({
    name: "",
    description: "",
    calculation_mode: "PERCENT",
    value: "10",
    status: "Active",
  });

  const [scholarships, setScholarships] = useState<Array<Record<string, unknown>>>([]);
  const [schModal, setSchModal] = useState(false);
  const [editingSch, setEditingSch] = useState<Record<string, unknown> | null>(null);
  const [schForm, setSchForm] = useState({
    session_id: "",
    branch_id: "",
    program_id: "",
    title: "",
    no_of_a: "0",
    term_percentage: "25",
    status: "1",
  });
  const [schDetails, setSchDetails] = useState<
    Array<{ fee_head_id: string; discount_percentage: string }>
  >([]);

  const [rules, setRules] = useState<Array<Record<string, unknown>>>([]);
  const [settings, setSettings] = useState<Array<Record<string, unknown>>>([]);
  const [ruleModal, setRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Record<string, unknown> | null>(null);
  const [ruleForm, setRuleForm] = useState({
    session_id: "",
    branch_id: "",
    board_id: "",
    program_id: "",
    class_id: "",
    title: "",
    no_of_a: "0",
    term_percentage: "20",
    status: "1",
  });
  const [settingsForm, setSettingsForm] = useState({
    id: "",
    session_id: "",
    branch_id: "",
    program_id: "",
    maximum_limit: "50",
    status: "1",
  });

  const [search, setSearch] = useState("");
  const [studentOptions, setStudentOptions] = useState<Array<Record<string, unknown>>>([]);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [workspace, setWorkspace] = useState<Record<string, unknown> | null>(null);
  const [applyModal, setApplyModal] = useState<
    null | "discount" | "scholarship" | "concession" | "no-discount"
  >(null);
  const [applyForm, setApplyForm] = useState({
    fee_master_basic_id: "",
    discount_type_id: "",
    calculation_mode: "PERCENT",
    value: "",
    comment: "",
    replace_existing: false,
    scholarship_catalog_id: "",
    scholarship_rule_id: "",
    concession_label: "Special Discount",
  });

  const loadTypes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feeAPI.listDiscountTypesAdmin({ limit: 200 });
      setTypes(res.data.data || []);
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  const loadScholarships = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feeAPI.listScholarshipCatalog({
        branch_id: branchFilter,
        limit: 100,
      });
      setScholarships(res.data.data || []);
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [branchFilter, showAlert]);

  const loadRulesAndSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        feeAPI.listScholarshipRules({ branch_id: branchFilter, limit: 100 }),
        feeAPI.listScholarshipSettings(),
      ]);
      setRules(r.data.data || []);
      setSettings(s.data.data || []);
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [branchFilter, showAlert]);

  useEffect(() => {
    if (subTab === "types") loadTypes();
    else if (subTab === "scholarships") loadScholarships();
    else if (subTab === "rules") loadRulesAndSettings();
  }, [subTab, loadTypes, loadScholarships, loadRulesAndSettings]);

  const searchStudents = useCallback(async () => {
    try {
      const res = await feeAPI.listStudentFeeRecords({
        search: search || undefined,
        branch_id: branchFilter,
        limit: 50,
      });
      setStudentOptions(res.data.data.items || []);
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    }
  }, [search, branchFilter, showAlert]);

  useEffect(() => {
    if (subTab !== "apply") return;
    const t = window.setTimeout(() => searchStudents(), 250);
    return () => window.clearTimeout(t);
  }, [subTab, searchStudents]);

  const loadWorkspace = async (id: number) => {
    setStudentId(id);
    setLoading(true);
    try {
      const res = await feeAPI.getDiscountWorkspace(id);
      setWorkspace(res.data.data);
    } catch (err) {
      showAlert("error", getErrorMessage(err));
      setWorkspace(null);
    } finally {
      setLoading(false);
    }
  };

  const dashboard = workspace?.dashboard as Record<string, unknown> | undefined;
  const summary = dashboard?.summary as Record<string, unknown> | undefined;
  const student = dashboard?.student as Record<string, unknown> | undefined;
  const statements = (dashboard?.statements as Array<Record<string, unknown>>) || [];

  const branchOpts =
    lookups?.branches.map((b) => ({ value: b.id, label: String(b.name || b.id) })) || [];
  const sessionOpts =
    lookups?.sessions.map((s) => ({ value: s.id, label: String(s.title || s.id) })) || [];
  const programOpts =
    lookups?.programs.map((p) => ({ value: p.id, label: String(p.name || p.id) })) || [];
  const boardOpts =
    lookups?.boards.map((b) => ({ value: b.id, label: String(b.name || b.id) })) || [];
  const classOpts =
    lookups?.classes.map((c) => ({ value: c.id, label: String(c.name || c.id) })) || [];
  const headOpts =
    lookups?.feeHeads.map((h) => ({
      value: h.id,
      label: String(h.fee_head_title || h.id),
    })) || [];

  const saveType = async () => {
    if (!typeForm.name.trim()) {
      showAlert("error", "Discount name is required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: typeForm.name.trim(),
        description: typeForm.description || null,
        calculation_mode: typeForm.calculation_mode,
        value: Number(typeForm.value),
        status: typeForm.status,
      };
      if (editingType) {
        await feeAPI.updateDiscountType(Number(editingType.id), body);
        showAlert("success", "Discount type updated");
      } else {
        await feeAPI.createDiscountType(body);
        showAlert("success", "Discount type created");
      }
      setTypeModal(false);
      await loadTypes();
      onChanged();
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveScholarship = async () => {
    if (!schForm.title.trim() || !schForm.branch_id || !schForm.program_id || !schForm.session_id) {
      showAlert("error", "Title, branch, session and program are required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        session_id: Number(schForm.session_id),
        branch_id: Number(schForm.branch_id),
        program_id: Number(schForm.program_id),
        title: schForm.title.trim(),
        no_of_a: Number(schForm.no_of_a),
        term_percentage: Number(schForm.term_percentage),
        status: schForm.status,
        details: schDetails
          .filter((d) => d.fee_head_id)
          .map((d) => ({
            fee_head_id: Number(d.fee_head_id),
            discount_percentage: Number(d.discount_percentage),
            status: "1",
          })),
      };
      if (editingSch) {
        await feeAPI.updateScholarshipCatalog(Number(editingSch.id), body);
        showAlert("success", "Scholarship definition updated");
      } else {
        await feeAPI.createScholarshipCatalog(body);
        showAlert("success", "Scholarship definition created");
      }
      setSchModal(false);
      await loadScholarships();
      onChanged();
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveRule = async () => {
    if (!ruleForm.title.trim() || !ruleForm.branch_id || !ruleForm.program_id) {
      showAlert("error", "Title, branch and program are required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        session_id: ruleForm.session_id ? Number(ruleForm.session_id) : undefined,
        branch_id: Number(ruleForm.branch_id),
        board_id: ruleForm.board_id ? Number(ruleForm.board_id) : undefined,
        program_id: Number(ruleForm.program_id),
        class_id: ruleForm.class_id ? Number(ruleForm.class_id) : undefined,
        title: ruleForm.title.trim(),
        no_of_a: Number(ruleForm.no_of_a),
        term_percentage: Number(ruleForm.term_percentage),
        status: Number(ruleForm.status),
      };
      if (editingRule) {
        await feeAPI.updateScholarshipRule(Number(editingRule.id), body);
        showAlert("success", "Scholarship rule updated");
      } else {
        await feeAPI.createScholarshipRule(body);
        showAlert("success", "Scholarship rule created");
      }
      setRuleModal(false);
      await loadRulesAndSettings();
      onChanged();
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await feeAPI.upsertScholarshipSettings({
        id: settingsForm.id ? Number(settingsForm.id) : undefined,
        session_id: settingsForm.session_id ? Number(settingsForm.session_id) : undefined,
        branch_id: settingsForm.branch_id ? Number(settingsForm.branch_id) : undefined,
        program_id: settingsForm.program_id ? Number(settingsForm.program_id) : undefined,
        maximum_limit: Number(settingsForm.maximum_limit),
        status: Number(settingsForm.status),
      });
      showAlert("success", "Scholarship maximum limit saved");
      setSettingsForm({
        id: "",
        session_id: "",
        branch_id: "",
        program_id: "",
        maximum_limit: "50",
        status: "1",
      });
      await loadRulesAndSettings();
      onChanged();
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const selectedStatement = useMemo(
    () => statements.find((s) => String(s.id) === applyForm.fee_master_basic_id),
    [statements, applyForm.fee_master_basic_id]
  );

  const submitApply = async () => {
    if (!studentId || !applyForm.fee_master_basic_id) {
      showAlert("error", "Select a student and invoice");
      return;
    }
    setSaving(true);
    try {
      if (applyModal === "discount") {
        if (!applyForm.discount_type_id || applyForm.value === "") {
          showAlert("error", "Discount type and value are required");
          setSaving(false);
          return;
        }
        await feeAPI.applyStudentDiscount({
          student_id: studentId,
          fee_master_basic_id: Number(applyForm.fee_master_basic_id),
          discount_type_id: Number(applyForm.discount_type_id),
          calculation_mode: applyForm.calculation_mode,
          value: Number(applyForm.value),
          comment: applyForm.comment || null,
          replace_existing: applyForm.replace_existing,
        });
        showAlert("success", "Discount applied — fee records updated");
      } else if (applyModal === "scholarship") {
        if (!applyForm.scholarship_catalog_id && !applyForm.scholarship_rule_id) {
          showAlert("error", "Select a scholarship definition or rule");
          setSaving(false);
          return;
        }
        await feeAPI.applyStudentScholarship({
          student_id: studentId,
          fee_master_basic_id: Number(applyForm.fee_master_basic_id),
          scholarship_catalog_id: applyForm.scholarship_catalog_id
            ? Number(applyForm.scholarship_catalog_id)
            : undefined,
          scholarship_rule_id: applyForm.scholarship_rule_id
            ? Number(applyForm.scholarship_rule_id)
            : undefined,
          comment: applyForm.comment || null,
          replace_existing: applyForm.replace_existing,
        });
        showAlert("success", "Scholarship applied — fee records updated");
      } else if (applyModal === "concession") {
        if (applyForm.value === "" || !applyForm.concession_label.trim()) {
          showAlert("error", "Concession label and value are required");
          setSaving(false);
          return;
        }
        await feeAPI.applyStudentConcession({
          student_id: studentId,
          fee_master_basic_id: Number(applyForm.fee_master_basic_id),
          calculation_mode: applyForm.calculation_mode,
          value: Number(applyForm.value),
          concession_label: applyForm.concession_label.trim(),
          comment: applyForm.comment || null,
          replace_existing: applyForm.replace_existing,
        });
        showAlert("success", "Concession applied — fee records updated");
      } else if (applyModal === "no-discount") {
        await feeAPI.applyStudentNoDiscount({
          student_id: studentId,
          fee_master_basic_id: Number(applyForm.fee_master_basic_id),
          comment: applyForm.comment || null,
        });
        showAlert("success", "No Discount / Full Fee applied");
      }
      setApplyModal(null);
      await loadWorkspace(studentId);
      onChanged();
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openApply = (
    kind: "discount" | "scholarship" | "concession" | "no-discount"
  ) => {
    const first = statements[0];
    setApplyForm({
      fee_master_basic_id: first ? String(first.id) : "",
      discount_type_id: "",
      calculation_mode: "PERCENT",
      value: "",
      comment: "",
      replace_existing: false,
      scholarship_catalog_id: "",
      scholarship_rule_id: "",
      concession_label: "Special Discount",
    });
    setApplyModal(kind);
  };

  return (
    <div className="fee-panel">
      <div className="fee-panel-header">
        <div>
          <h3>Discounts & Concessions</h3>
          <p>Discount types, scholarships, limits, and student applications.</p>
        </div>
        <div className="fee-panel-actions">
          <div className="fee-segment">
            {(
              [
                ["types", "Discount Types"],
                ["scholarships", "Scholarships"],
                ["rules", "Rules & Limits"],
                ["apply", "Apply to Student"],
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
        </div>
      </div>

      {subTab === "types" && (
        <>
          <div className="fee-toolbar">
            <button
              type="button"
              className="fee-btn fee-btn-primary"
              onClick={() => {
                setEditingType(null);
                setTypeForm({
                  name: "",
                  description: "",
                  calculation_mode: "PERCENT",
                  value: "10",
                  status: "Active",
                });
                setTypeModal(true);
              }}
            >
              + Add Discount Type
            </button>
          </div>
          <FeeTable
            loading={loading}
            rows={types}
            rowKey={(r) => Number(r.id)}
            emptyTitle="No discount types yet"
            emptyDescription="Create Sibling, Merit, Early Payment, Staff, or Special discount types."
            columns={[
              { key: "id", header: "ID", render: (r) => String(r.id) },
              { key: "name", header: "Name", render: (r) => String(r.name) },
              {
                key: "mode",
                header: "Mode",
                render: (r) =>
                  r.calculation_mode === "FIXED" ? "Fixed Amount" : "Percentage",
              },
              {
                key: "value",
                header: "Value",
                render: (r) =>
                  r.calculation_mode === "FIXED" ? money(r.value) : `${r.value}%`,
              },
              {
                key: "description",
                header: "Description",
                render: (r) => String(r.description || "—"),
              },
              {
                key: "status",
                header: "Status",
                render: (r) => <FeeStatusBadge active={r.status === "Active"} />,
              },
              {
                key: "actions",
                header: "Actions",
                render: (r) => (
                  <div className="fee-row-actions">
                    <button
                      type="button"
                      className="fee-link-btn"
                      onClick={() => {
                        setEditingType(r);
                        setTypeForm({
                          name: String(r.name || ""),
                          description: String(r.description || ""),
                          calculation_mode: String(r.calculation_mode || "PERCENT"),
                          value: String(r.value ?? r.percentage ?? 0),
                          status: String(r.status || "Active"),
                        });
                        setTypeModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="fee-link-btn"
                      onClick={() =>
                        setConfirm({
                          open: true,
                          title: "Toggle discount type",
                          message: `Set "${r.name}" to ${
                            r.status === "Active" ? "Inactive" : "Active"
                          }?`,
                          onConfirm: async () => {
                            await feeAPI.setDiscountTypeStatus(
                              Number(r.id),
                              r.status === "Active" ? "Inactive" : "Active"
                            );
                            showAlert("success", "Status updated");
                            await loadTypes();
                            onChanged();
                          },
                        })
                      }
                    >
                      {r.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </>
      )}

      {subTab === "scholarships" && (
        <>
          <div className="fee-toolbar">
            <button
              type="button"
              className="fee-btn fee-btn-primary"
              onClick={() => {
                setEditingSch(null);
                setSchForm({
                  session_id: String(lookups?.sessions[0]?.id || ""),
                  branch_id: String(branchFilter || lookups?.branches[0]?.id || ""),
                  program_id: String(lookups?.programs[0]?.id || ""),
                  title: "",
                  no_of_a: "0",
                  term_percentage: "25",
                  status: "1",
                });
                setSchDetails([]);
                setSchModal(true);
              }}
            >
              + Add Scholarship
            </button>
          </div>
          <FeeTable
            loading={loading}
            rows={scholarships}
            rowKey={(r) => Number(r.id)}
            emptyTitle="No scholarship definitions"
            emptyDescription="Define scholarships with term % and optional fee-head percentages."
            columns={[
              { key: "id", header: "ID", render: (r) => String(r.id) },
              { key: "title", header: "Title", render: (r) => String(r.title) },
              {
                key: "pct",
                header: "Term %",
                render: (r) => `${r.term_percentage_num ?? r.term_percentage}%`,
              },
              { key: "a", header: "No. of A", render: (r) => String(r.no_of_a) },
              {
                key: "heads",
                header: "Fee Heads",
                render: (r) => String(((r.details as Array<unknown>) || []).length),
              },
              {
                key: "status",
                header: "Status",
                render: (r) => (
                  <FeeStatusBadge active={r.status === "1" || r.status === 1} />
                ),
              },
              {
                key: "actions",
                header: "Actions",
                render: (r) => (
                  <div className="fee-row-actions">
                    <button
                      type="button"
                      className="fee-link-btn"
                      onClick={() => {
                        setEditingSch(r);
                        setSchForm({
                          session_id: String(r.session_id || ""),
                          branch_id: String(r.branch_id || ""),
                          program_id: String(r.program_id || ""),
                          title: String(r.title || ""),
                          no_of_a: String(r.no_of_a ?? 0),
                          term_percentage: String(
                            r.term_percentage_num ?? r.term_percentage ?? 0
                          ),
                          status: String(r.status || "1"),
                        });
                        const details =
                          (r.details as Array<Record<string, unknown>>) || [];
                        setSchDetails(
                          details.map((d) => ({
                            fee_head_id: String(d.fee_head_id),
                            discount_percentage: String(d.discount_percentage),
                          }))
                        );
                        setSchModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="fee-link-btn"
                      onClick={() =>
                        setConfirm({
                          open: true,
                          title: "Toggle scholarship",
                          message: `Change status for "${r.title}"?`,
                          onConfirm: async () => {
                            await feeAPI.setScholarshipCatalogStatus(
                              Number(r.id),
                              r.status === "1" ? "0" : "1"
                            );
                            showAlert("success", "Status updated");
                            await loadScholarships();
                            onChanged();
                          },
                        })
                      }
                    >
                      Toggle
                    </button>
                  </div>
                ),
              },
            ]}
          />
        </>
      )}

      {subTab === "rules" && (
        <>
          <div className="fee-dash-section">
            <h4>Maximum Scholarship Limit</h4>
            <p className="fee-hint">
              Stored in existing scholarship_settings (no schema changes).
            </p>
            <div className="fee-form-grid">
              <FeeField label="Branch">
                <FeeSelect
                  options={branchOpts}
                  value={settingsForm.branch_id}
                  onChange={(e) =>
                    setSettingsForm((f) => ({ ...f, branch_id: e.target.value }))
                  }
                />
              </FeeField>
              <FeeField label="Session">
                <FeeSelect
                  options={sessionOpts}
                  value={settingsForm.session_id}
                  onChange={(e) =>
                    setSettingsForm((f) => ({ ...f, session_id: e.target.value }))
                  }
                />
              </FeeField>
              <FeeField label="Program">
                <FeeSelect
                  options={programOpts}
                  value={settingsForm.program_id}
                  onChange={(e) =>
                    setSettingsForm((f) => ({ ...f, program_id: e.target.value }))
                  }
                />
              </FeeField>
              <FeeField label="Maximum % Limit" required>
                <FeeInput
                  type="number"
                  min={0}
                  max={100}
                  value={settingsForm.maximum_limit}
                  onChange={(e) =>
                    setSettingsForm((f) => ({
                      ...f,
                      maximum_limit: e.target.value,
                    }))
                  }
                />
              </FeeField>
            </div>
            <button
              type="button"
              className="fee-btn fee-btn-primary"
              disabled={saving}
              onClick={saveSettings}
            >
              {saving ? "Saving…" : "Save Limit"}
            </button>
            <FeeTable
              rows={settings}
              rowKey={(r) => Number(r.id)}
              emptyTitle="No scholarship limits configured"
              emptyDescription="Set a maximum scholarship percentage for your branch/program."
              columns={[
                { key: "id", header: "ID", render: (r) => String(r.id) },
                {
                  key: "branch",
                  header: "Branch",
                  render: (r) => String(r.branch_id ?? "—"),
                },
                {
                  key: "session",
                  header: "Session",
                  render: (r) => String(r.session_id ?? "—"),
                },
                {
                  key: "program",
                  header: "Program",
                  render: (r) => String(r.program_id ?? "—"),
                },
                {
                  key: "max",
                  header: "Max %",
                  render: (r) => `${r.maximum_limit}%`,
                },
                {
                  key: "status",
                  header: "Status",
                  render: (r) => <FeeStatusBadge active={r.status === 1} />,
                },
                {
                  key: "actions",
                  header: "",
                  render: (r) => (
                    <button
                      type="button"
                      className="fee-link-btn"
                      onClick={() =>
                        setSettingsForm({
                          id: String(r.id),
                          session_id: String(r.session_id || ""),
                          branch_id: String(r.branch_id || ""),
                          program_id: String(r.program_id || ""),
                          maximum_limit: String(r.maximum_limit),
                          status: String(r.status ?? 1),
                        })
                      }
                    >
                      Edit
                    </button>
                  ),
                },
              ]}
            />
          </div>

          <div className="fee-toolbar" style={{ marginTop: "1.25rem" }}>
            <button
              type="button"
              className="fee-btn fee-btn-primary"
              onClick={() => {
                setEditingRule(null);
                setRuleForm({
                  session_id: String(lookups?.sessions[0]?.id || ""),
                  branch_id: String(branchFilter || lookups?.branches[0]?.id || ""),
                  board_id: String(lookups?.boards[0]?.id || ""),
                  program_id: String(lookups?.programs[0]?.id || ""),
                  class_id: String(lookups?.classes[0]?.id || ""),
                  title: "",
                  no_of_a: "0",
                  term_percentage: "20",
                  status: "1",
                });
                setRuleModal(true);
              }}
            >
              + Add Class/Board Rule
            </button>
          </div>
          <FeeTable
            loading={loading}
            rows={rules}
            rowKey={(r) => Number(r.id)}
            emptyTitle="No scholarship rules"
            emptyDescription="Create class/board scoped scholarship rules."
            columns={[
              { key: "id", header: "ID", render: (r) => String(r.id) },
              { key: "title", header: "Title", render: (r) => String(r.title) },
              {
                key: "pct",
                header: "Term %",
                render: (r) => `${r.term_percentage}%`,
              },
              { key: "a", header: "No. of A", render: (r) => String(r.no_of_a) },
              {
                key: "class",
                header: "Class",
                render: (r) => String(r.class_id ?? "—"),
              },
              {
                key: "board",
                header: "Board",
                render: (r) => String(r.board_id ?? "—"),
              },
              {
                key: "status",
                header: "Status",
                render: (r) => <FeeStatusBadge active={r.status === 1} />,
              },
              {
                key: "actions",
                header: "Actions",
                render: (r) => (
                  <button
                    type="button"
                    className="fee-link-btn"
                    onClick={() => {
                      setEditingRule(r);
                      setRuleForm({
                        session_id: String(r.session_id || ""),
                        branch_id: String(r.branch_id || ""),
                        board_id: String(r.board_id || ""),
                        program_id: String(r.program_id || ""),
                        class_id: String(r.class_id || ""),
                        title: String(r.title || ""),
                        no_of_a: String(r.no_of_a ?? 0),
                        term_percentage: String(r.term_percentage ?? 0),
                        status: String(r.status ?? 1),
                      });
                      setRuleModal(true);
                    }}
                  >
                    Edit
                  </button>
                ),
              },
            ]}
          />
        </>
      )}

      {subTab === "apply" && (
        <>
          <div className="fee-pay-search">
            <FeeInput
              placeholder="Search student by name or reg no…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="fee-chip-row">
            {studentOptions.slice(0, 12).map((item) => {
              const s = item.student as Record<string, unknown>;
              return (
                <button
                  key={String(s.id)}
                  type="button"
                  className={`fee-chip ${studentId === s.id ? "active" : ""}`}
                  onClick={() => loadWorkspace(Number(s.id))}
                >
                  {String(s.name || s.reg_no)}
                </button>
              );
            })}
          </div>
          {!studentOptions.length && (
            <p className="fee-hint">No students found. Assign fees under Student Fee Records first.</p>
          )}

          {loading && <FeeLoading />}

          {!loading && workspace && student && (
            <>
              <div className="fee-student-identity" style={{ marginTop: "1rem" }}>
                <FeeStudentPhoto
                  studentImage={
                    typeof student.student_image === "string"
                      ? student.student_image
                      : null
                  }
                  alt={`${String(student.name || "Student")} passport photo`}
                />
              </div>
              <div className="fee-overview-grid" style={{ marginTop: "0.75rem" }}>
                <div className="fee-overview-card">
                  <span className="fee-overview-value">{String(student.name)}</span>
                  <span className="fee-overview-label">Student</span>
                </div>
                <div className="fee-overview-card">
                  <span className="fee-overview-value">{money(summary?.total_dues)}</span>
                  <span className="fee-overview-label">Total Dues</span>
                </div>
                <div className="fee-overview-card">
                  <span className="fee-overview-value">
                    {money(summary?.outstanding_balance)}
                  </span>
                  <span className="fee-overview-label">Outstanding</span>
                </div>
                <div className="fee-overview-card">
                  <span className="fee-overview-value">
                    {String(summary?.fee_status || "—")}
                  </span>
                  <span className="fee-overview-label">Fee Status</span>
                </div>
                <div className="fee-overview-card">
                  <span className="fee-overview-value">
                    {String(workspace.scholarship_maximum_limit)}%
                  </span>
                  <span className="fee-overview-label">Scholarship Cap</span>
                </div>
              </div>

              <div className="fee-toolbar" style={{ marginTop: "1rem" }}>
                <button
                  type="button"
                  className="fee-btn fee-btn-primary"
                  onClick={() => openApply("discount")}
                  disabled={!statements.length}
                >
                  Apply Discount
                </button>
                <button
                  type="button"
                  className="fee-btn fee-btn-ghost"
                  onClick={() => openApply("scholarship")}
                  disabled={!statements.length}
                >
                  Apply Scholarship
                </button>
                <button
                  type="button"
                  className="fee-btn fee-btn-ghost"
                  onClick={() => openApply("concession")}
                  disabled={!statements.length}
                >
                  Apply Concession
                </button>
                <button
                  type="button"
                  className="fee-btn fee-btn-ghost"
                  onClick={() => openApply("no-discount")}
                  disabled={!statements.length}
                >
                  No Discount / Full Fee
                </button>
              </div>

              <div className="fee-dash-section">
                <h4>Fee Statements</h4>
                <FeeTable
                  rows={statements}
                  rowKey={(r) => Number(r.id)}
                  emptyTitle="No fee statements"
                  emptyDescription="Assign a fee structure to this student first."
                  columns={[
                    {
                      key: "bill",
                      header: "Bill No",
                      render: (r) => String(r.bill_no || `STMT-${r.id}`),
                    },
                    {
                      key: "gross",
                      header: "Gross",
                      render: (r) => money(r.total_fee || r.due_amount),
                    },
                    {
                      key: "disc",
                      header: "Discount",
                      render: (r) => money(r.discount_fee),
                    },
                    {
                      key: "other",
                      header: "Other / Scholarship",
                      render: (r) => money(r.other_discount_fee),
                    },
                    {
                      key: "payable",
                      header: "Payable",
                      render: (r) => money(r.total_after_discount || r.due_amount),
                    },
                    {
                      key: "bal",
                      header: "Balance",
                      render: (r) => money(r.balance),
                    },
                    {
                      key: "st",
                      header: "Status",
                      render: (r) => String(r.statement_status),
                    },
                    {
                      key: "dstate",
                      header: "Discount State",
                      render: (r) => {
                        const discount = Number(r.discount_fee || 0);
                        const other = Number(r.other_discount_fee || 0);
                        const hasAny = discount > 0 || other > 0;
                        const info = (r.discount_type_info as Record<string, unknown> | undefined) || {};
                        const active = String(info.status || "") === "Active";
                        if (!hasAny) return "No Discount / Full Fee";
                        return active ? "Active Discount" : "Inactive/Archived Discount";
                      },
                    },
                    {
                      key: "dtype",
                      header: "Discount Type",
                      render: (r) =>
                        String(
                          (r.discount_type_info as Record<string, unknown>)?.name ||
                            "—"
                        ),
                    },
                  ]}
                />
              </div>
            </>
          )}
        </>
      )}

      <FeeModal
        open={typeModal}
        title={editingType ? "Edit Discount Type" : "Create Discount Type"}
        onClose={() => setTypeModal(false)}
        footer={
          <>
            <button type="button" className="fee-btn fee-btn-ghost" onClick={() => setTypeModal(false)}>
              Cancel
            </button>
            <button type="button" className="fee-btn fee-btn-primary" disabled={saving} onClick={saveType}>
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className="fee-form-grid">
          <FeeField label="Name" required>
            <FeeInput
              value={typeForm.name}
              onChange={(e) => setTypeForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Sibling Discount"
            />
          </FeeField>
          <FeeField label="Calculation Mode" required>
            <FeeSelect
              options={[
                { value: "PERCENT", label: "Percentage" },
                { value: "FIXED", label: "Fixed Amount" },
              ]}
              value={typeForm.calculation_mode}
              onChange={(e) =>
                setTypeForm((f) => ({ ...f, calculation_mode: e.target.value }))
              }
            />
          </FeeField>
          <FeeField
            label={typeForm.calculation_mode === "FIXED" ? "Default Amount" : "Default %"}
            required
          >
            <FeeInput
              type="number"
              min={0}
              value={typeForm.value}
              onChange={(e) => setTypeForm((f) => ({ ...f, value: e.target.value }))}
            />
          </FeeField>
          <FeeField label="Status">
            <FeeSelect
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
              value={typeForm.status}
              onChange={(e) => setTypeForm((f) => ({ ...f, status: e.target.value }))}
            />
          </FeeField>
          <FeeField label="Description">
            <FeeTextarea
              value={typeForm.description}
              onChange={(e) =>
                setTypeForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={2}
            />
          </FeeField>
        </div>
      </FeeModal>

      <FeeModal
        open={schModal}
        title={editingSch ? "Edit Scholarship" : "Create Scholarship"}
        onClose={() => setSchModal(false)}
        wide
        footer={
          <>
            <button type="button" className="fee-btn fee-btn-ghost" onClick={() => setSchModal(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="fee-btn fee-btn-primary"
              disabled={saving}
              onClick={saveScholarship}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className="fee-form-grid">
          <FeeField label="Title" required>
            <FeeInput
              value={schForm.title}
              onChange={(e) => setSchForm((f) => ({ ...f, title: e.target.value }))}
            />
          </FeeField>
          <FeeField label="Branch" required>
            <FeeSelect
              options={branchOpts}
              value={schForm.branch_id}
              onChange={(e) => setSchForm((f) => ({ ...f, branch_id: e.target.value }))}
            />
          </FeeField>
          <FeeField label="Session" required>
            <FeeSelect
              options={sessionOpts}
              value={schForm.session_id}
              onChange={(e) => setSchForm((f) => ({ ...f, session_id: e.target.value }))}
            />
          </FeeField>
          <FeeField label="Program" required>
            <FeeSelect
              options={programOpts}
              value={schForm.program_id}
              onChange={(e) => setSchForm((f) => ({ ...f, program_id: e.target.value }))}
            />
          </FeeField>
          <FeeField label="Term Percentage %" required>
            <FeeInput
              type="number"
              min={0}
              max={100}
              value={schForm.term_percentage}
              onChange={(e) =>
                setSchForm((f) => ({ ...f, term_percentage: e.target.value }))
              }
            />
          </FeeField>
          <FeeField label="No. of A (rule)">
            <FeeInput
              type="number"
              min={0}
              value={schForm.no_of_a}
              onChange={(e) => setSchForm((f) => ({ ...f, no_of_a: e.target.value }))}
            />
          </FeeField>
        </div>
        <h4 style={{ marginTop: "1rem" }}>Fee-head percentages</h4>
        {schDetails.map((d, idx) => (
          <div key={idx} className="fee-amount-row" style={{ marginBottom: "0.5rem" }}>
            <FeeSelect
              options={headOpts}
              value={d.fee_head_id}
              onChange={(e) => {
                const next = [...schDetails];
                next[idx] = { ...next[idx], fee_head_id: e.target.value };
                setSchDetails(next);
              }}
            />
            <FeeInput
              type="number"
              min={0}
              max={100}
              placeholder="%"
              value={d.discount_percentage}
              onChange={(e) => {
                const next = [...schDetails];
                next[idx] = { ...next[idx], discount_percentage: e.target.value };
                setSchDetails(next);
              }}
            />
            <button
              type="button"
              className="fee-link-btn"
              onClick={() => setSchDetails(schDetails.filter((_, i) => i !== idx))}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="fee-btn fee-btn-ghost"
          onClick={() =>
            setSchDetails([...schDetails, { fee_head_id: "", discount_percentage: "0" }])
          }
        >
          + Add Fee Head
        </button>
      </FeeModal>

      <FeeModal
        open={ruleModal}
        title={editingRule ? "Edit Scholarship Rule" : "Create Scholarship Rule"}
        onClose={() => setRuleModal(false)}
        footer={
          <>
            <button type="button" className="fee-btn fee-btn-ghost" onClick={() => setRuleModal(false)}>
              Cancel
            </button>
            <button type="button" className="fee-btn fee-btn-primary" disabled={saving} onClick={saveRule}>
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className="fee-form-grid">
          <FeeField label="Title" required>
            <FeeInput
              value={ruleForm.title}
              onChange={(e) => setRuleForm((f) => ({ ...f, title: e.target.value }))}
            />
          </FeeField>
          <FeeField label="Branch" required>
            <FeeSelect
              options={branchOpts}
              value={ruleForm.branch_id}
              onChange={(e) => setRuleForm((f) => ({ ...f, branch_id: e.target.value }))}
            />
          </FeeField>
          <FeeField label="Program" required>
            <FeeSelect
              options={programOpts}
              value={ruleForm.program_id}
              onChange={(e) => setRuleForm((f) => ({ ...f, program_id: e.target.value }))}
            />
          </FeeField>
          <FeeField label="Board">
            <FeeSelect
              options={boardOpts}
              value={ruleForm.board_id}
              onChange={(e) => setRuleForm((f) => ({ ...f, board_id: e.target.value }))}
            />
          </FeeField>
          <FeeField label="Class">
            <FeeSelect
              options={classOpts}
              value={ruleForm.class_id}
              onChange={(e) => setRuleForm((f) => ({ ...f, class_id: e.target.value }))}
            />
          </FeeField>
          <FeeField label="Session">
            <FeeSelect
              options={sessionOpts}
              value={ruleForm.session_id}
              onChange={(e) => setRuleForm((f) => ({ ...f, session_id: e.target.value }))}
            />
          </FeeField>
          <FeeField label="Term %" required>
            <FeeInput
              type="number"
              min={0}
              max={100}
              value={ruleForm.term_percentage}
              onChange={(e) =>
                setRuleForm((f) => ({ ...f, term_percentage: e.target.value }))
              }
            />
          </FeeField>
          <FeeField label="No. of A">
            <FeeInput
              type="number"
              min={0}
              value={ruleForm.no_of_a}
              onChange={(e) => setRuleForm((f) => ({ ...f, no_of_a: e.target.value }))}
            />
          </FeeField>
        </div>
      </FeeModal>

      <FeeModal
        open={!!applyModal}
        title={
          applyModal === "discount"
            ? "Apply Discount"
            : applyModal === "scholarship"
              ? "Apply Scholarship"
              : applyModal === "concession"
                ? "Apply Concession"
                : "No Discount / Full Fee"
        }
        onClose={() => setApplyModal(null)}
        footer={
          <>
            <button type="button" className="fee-btn fee-btn-ghost" onClick={() => setApplyModal(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="fee-btn fee-btn-primary"
              disabled={saving}
              onClick={submitApply}
            >
              {saving ? "Applying…" : "Apply"}
            </button>
          </>
        }
      >
        <div className="fee-form-grid">
          <FeeField label="Invoice / Statement" required>
            <FeeSelect
              options={statements.map((s) => ({
                value: String(s.id),
                label: `${s.bill_no || `STMT-${s.id}`} · Bal ${money(s.balance)}`,
              }))}
              value={applyForm.fee_master_basic_id}
              onChange={(e) =>
                setApplyForm((f) => ({
                  ...f,
                  fee_master_basic_id: e.target.value,
                }))
              }
            />
          </FeeField>

          {selectedStatement && (
            <p className="fee-hint">
              Gross {money(selectedStatement.total_fee || selectedStatement.due_amount)} ·
              Discount {money(selectedStatement.discount_fee)} · Other{" "}
              {money(selectedStatement.other_discount_fee)} · Payable{" "}
              {money(
                selectedStatement.total_after_discount || selectedStatement.due_amount
              )}
            </p>
          )}

          {applyModal === "discount" && (
            <>
              <FeeField label="Discount Type" required>
                <FeeSelect
                  options={(
                    (workspace?.discount_types as Array<Record<string, unknown>>) || []
                  ).map((d) => ({
                    value: String(d.id),
                    label: String(d.display_label || d.name),
                  }))}
                  value={applyForm.discount_type_id}
                  onChange={(e) => {
                    const dtype = (
                      (workspace?.discount_types as Array<Record<string, unknown>>) ||
                      []
                    ).find((d) => String(d.id) === e.target.value);
                    setApplyForm((f) => ({
                      ...f,
                      discount_type_id: e.target.value,
                      calculation_mode: String(dtype?.calculation_mode || "PERCENT"),
                      value: String(dtype?.value ?? ""),
                    }));
                  }}
                />
              </FeeField>
              <FeeField label="Mode" required>
                <FeeSelect
                  options={[
                    { value: "PERCENT", label: "Percentage" },
                    { value: "FIXED", label: "Fixed Amount" },
                  ]}
                  value={applyForm.calculation_mode}
                  onChange={(e) =>
                    setApplyForm((f) => ({ ...f, calculation_mode: e.target.value }))
                  }
                />
              </FeeField>
              <FeeField label="Value" required>
                <FeeInput
                  type="number"
                  min={0}
                  value={applyForm.value}
                  onChange={(e) =>
                    setApplyForm((f) => ({ ...f, value: e.target.value }))
                  }
                />
              </FeeField>
            </>
          )}

          {applyModal === "scholarship" && (
            <>
              <FeeField label="Scholarship Definition">
                <FeeSelect
                  options={(
                    (workspace?.scholarships as Array<Record<string, unknown>>) || []
                  ).map((s) => ({
                    value: String(s.id),
                    label: `${s.title} (${s.term_percentage_num ?? s.term_percentage}%)`,
                  }))}
                  value={applyForm.scholarship_catalog_id}
                  onChange={(e) =>
                    setApplyForm((f) => ({
                      ...f,
                      scholarship_catalog_id: e.target.value,
                      scholarship_rule_id: "",
                    }))
                  }
                />
              </FeeField>
              <FeeField label="Or Class/Board Rule">
                <FeeSelect
                  options={(
                    (workspace?.scholarship_rules as Array<Record<string, unknown>>) ||
                    []
                  ).map((s) => ({
                    value: String(s.id),
                    label: `${s.title} (${s.term_percentage}%)`,
                  }))}
                  value={applyForm.scholarship_rule_id}
                  onChange={(e) =>
                    setApplyForm((f) => ({
                      ...f,
                      scholarship_rule_id: e.target.value,
                      scholarship_catalog_id: "",
                    }))
                  }
                />
              </FeeField>
            </>
          )}

          {applyModal === "concession" && (
            <>
              <FeeField label="Concession Label" required>
                <FeeInput
                  value={applyForm.concession_label}
                  onChange={(e) =>
                    setApplyForm((f) => ({
                      ...f,
                      concession_label: e.target.value,
                    }))
                  }
                />
              </FeeField>
              <FeeField label="Mode" required>
                <FeeSelect
                  options={[
                    { value: "PERCENT", label: "Percentage" },
                    { value: "FIXED", label: "Fixed Amount" },
                  ]}
                  value={applyForm.calculation_mode}
                  onChange={(e) =>
                    setApplyForm((f) => ({ ...f, calculation_mode: e.target.value }))
                  }
                />
              </FeeField>
              <FeeField label="Value" required>
                <FeeInput
                  type="number"
                  min={0}
                  value={applyForm.value}
                  onChange={(e) =>
                    setApplyForm((f) => ({ ...f, value: e.target.value }))
                  }
                />
              </FeeField>
            </>
          )}

          {applyModal === "no-discount" && (
            <p className="fee-hint">
              This will remove any currently applied discount/scholarship/concession from the
              selected statement and restore full payable fee. Historical payment records are not changed.
            </p>
          )}

          <FeeField label="Comment">
            <FeeTextarea
              rows={2}
              value={applyForm.comment}
              onChange={(e) =>
                setApplyForm((f) => ({ ...f, comment: e.target.value }))
              }
            />
          </FeeField>
          <label className="fee-hint" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
              type="checkbox"
              checked={applyForm.replace_existing}
              onChange={(e) =>
                setApplyForm((f) => ({
                  ...f,
                  replace_existing: e.target.checked,
                }))
              }
            />
            Replace existing application on this invoice
          </label>
        </div>
      </FeeModal>
    </div>
  );
};

export default DiscountsConcessionsPanel;

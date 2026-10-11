import React, { useCallback, useEffect, useState } from "react";
import feeAPI from "../services/feeApi";
import { getErrorMessage } from "../hooks/useFeeLookups";
import type { FeeLookups } from "../hooks/useFeeLookups";
import {
  FeeField,
  FeeInput,
  FeeModal,
  FeeSelect,
  FeeStatusBadge,
  FeeTable,
  FeeTextarea,
} from "./FeeUI";

const isActiveStatus = (value: unknown) =>
  value === 1 || value === "1" || value === true;

export type ConfirmState = {
  open: boolean;
  title: string;
  message: string;
  danger?: boolean;
  onConfirm: () => Promise<void>;
};

type PanelProps = {
  lookups: FeeLookups | null;
  branchFilter?: number;
  showAlert: (t: "success" | "error" | "info", m: string) => void;
  setConfirm: React.Dispatch<React.SetStateAction<ConfirmState>>;
  onChanged: () => void;
};

/* ═══════════════════════ Cycles & Installments ═══════════════════════ */
export const CyclesPanel: React.FC<PanelProps> = ({
  lookups,
  branchFilter,
  showAlert,
  setConfirm,
  onChanged,
}) => {
  const [subTab, setSubTab] = useState<"cycles" | "installments">("cycles");
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [instRows, setInstRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [instModalOpen, setInstModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [editingInst, setEditingInst] = useState<Record<string, unknown> | null>(null);
  const [expandedInstId, setExpandedInstId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    branch_id: "",
    session_id: "",
    program_id: "",
    board_id: "",
    class_id: "",
    group_id: "0",
    term_number: "1",
    term_title: "Monthly",
    starting_date: "",
    ending_date: "",
    status: "1",
  });
  const [instForm, setInstForm] = useState({
    branch_id: "",
    program_id: "",
    class_id: "",
    group_id: "0",
    fee_term_id: "",
    installment_no: "1",
    installment_date: "",
    name: "",
    description: "",
    status: "1",
  });

  const loadCycles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feeAPI.listTerms({ branch_id: branchFilter, limit: 100 });
      setRows(res.data.data.items || []);
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [branchFilter, showAlert]);

  const loadInstallments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feeAPI.listInstallments({
        branch_id: branchFilter,
        limit: 100,
      });
      setInstRows(res.data.data.items || []);
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [branchFilter, showAlert]);

  useEffect(() => {
    if (subTab === "cycles") loadCycles();
    else loadInstallments();
  }, [subTab, loadCycles, loadInstallments]);

  const openCreateCycle = () => {
    setEditing(null);
    const today = new Date().toISOString().slice(0, 10);
    setForm({
      branch_id: String(branchFilter || lookups?.branches[0]?.id || ""),
      session_id: String(lookups?.sessions[0]?.id || ""),
      program_id: String(lookups?.programs[0]?.id || ""),
      board_id: String(lookups?.boards[0]?.id || ""),
      class_id: String(lookups?.classes[0]?.id || ""),
      group_id: "0",
      term_number: "1",
      term_title: "Monthly",
      starting_date: today,
      ending_date: today,
      status: "1",
    });
    setModalOpen(true);
  };

  const saveCycle = async () => {
    if (!form.branch_id || !form.program_id || !form.board_id || !form.class_id) {
      showAlert("error", "Branch, program, board and class are required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        branch_id: Number(form.branch_id),
        session_id: form.session_id ? Number(form.session_id) : undefined,
        program_id: Number(form.program_id),
        board_id: Number(form.board_id),
        class_id: Number(form.class_id),
        group_id: Number(form.group_id || 0),
        term_number: Number(form.term_number),
        term_title: form.term_title,
        starting_date: form.starting_date,
        ending_date: form.ending_date,
        status: form.status,
      };
      if (editing) {
        await feeAPI.updateTerm(Number(editing.id), body);
        showAlert("success", "Fee cycle updated");
      } else {
        await feeAPI.createTerm(body);
        showAlert("success", "Fee cycle created");
      }
      setModalOpen(false);
      await loadCycles();
      onChanged();
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openCreateInst = () => {
    setEditingInst(null);
    setInstForm({
      branch_id: String(branchFilter || lookups?.branches[0]?.id || ""),
      program_id: String(lookups?.programs[0]?.id || ""),
      class_id: String(lookups?.classes[0]?.id || ""),
      group_id: "0",
      fee_term_id: String(lookups?.feeTerms[0]?.id || ""),
      installment_no: "1",
      installment_date: new Date().toISOString().slice(0, 10),
      name: "",
      description: "",
      status: "1",
    });
    setInstModalOpen(true);
  };

  const saveInst = async () => {
    if (!instForm.fee_term_id || !instForm.branch_id || !instForm.program_id || !instForm.class_id) {
      showAlert("error", "Fee cycle, branch, program and class are required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        branch_id: Number(instForm.branch_id),
        program_id: Number(instForm.program_id),
        class_id: Number(instForm.class_id),
        group_id: Number(instForm.group_id || 0),
        fee_term_id: Number(instForm.fee_term_id),
        installment_no: Number(instForm.installment_no),
        installment_date: instForm.installment_date,
        name: instForm.name || null,
        description: instForm.description || null,
        status: instForm.status,
      };
      if (editingInst) {
        await feeAPI.updateInstallment(Number(editingInst.id), body);
        showAlert("success", "Installment updated");
      } else {
        await feeAPI.createInstallment(body);
        showAlert("success", "Installment created");
      }
      setInstModalOpen(false);
      await loadInstallments();
      onChanged();
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
          <h3>Fee Cycles & Installments</h3>
          <p>Set Monthly, Quarterly, Semester-wise, Annual or custom billing periods.</p>
        </div>
        <div className="fee-panel-actions">
          <div className="fee-segment">
            <button
              type="button"
              className={subTab === "cycles" ? "active" : ""}
              onClick={() => setSubTab("cycles")}
            >
              Cycles
            </button>
            <button
              type="button"
              className={subTab === "installments" ? "active" : ""}
              onClick={() => setSubTab("installments")}
            >
              Installments
            </button>
          </div>
          <button
            type="button"
            className="fee-btn fee-btn-primary"
            onClick={subTab === "cycles" ? openCreateCycle : openCreateInst}
          >
            {subTab === "cycles" ? "+ Add Cycle" : "+ Add Installment"}
          </button>
        </div>
      </div>

      {subTab === "cycles" ? (
        <FeeTable
          loading={loading}
          rows={rows}
          rowKey={(r) => Number(r.id)}
          emptyTitle="No fee cycles yet"
          columns={[
            { key: "term", header: "Cycle", render: (r) => String(r.term_title) },
            { key: "no", header: "Term #", render: (r) => String(r.term_number) },
            {
              key: "dates",
              header: "Period",
              render: (r) =>
                `${String(r.starting_date).slice(0, 10)} → ${String(r.ending_date).slice(0, 10)}`,
            },
            {
              key: "status",
              header: "Status",
              render: (r) => <FeeStatusBadge active={isActiveStatus(r.status)} />,
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
                      setEditing(r);
                      setForm({
                        branch_id: String(r.branch_id || ""),
                        session_id: String(r.session_id || ""),
                        program_id: String(r.program_id || ""),
                        board_id: String(r.board_id || ""),
                        class_id: String(r.class_id || ""),
                        group_id: String(r.group_id ?? "0"),
                        term_number: String(r.term_number || "1"),
                        term_title: String(r.term_title || ""),
                        starting_date: String(r.starting_date).slice(0, 10),
                        ending_date: String(r.ending_date).slice(0, 10),
                        status: String(r.status || "1"),
                      });
                      setModalOpen(true);
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
                        title: "Toggle cycle status",
                        message: `Change status of “${r.term_title}”?`,
                        onConfirm: async () => {
                          await feeAPI.toggleTerm(
                            Number(r.id),
                            isActiveStatus(r.status) ? "0" : "1"
                          );
                          showAlert("success", "Cycle status updated");
                          await loadCycles();
                          onChanged();
                        },
                      })
                    }
                  >
                    {isActiveStatus(r.status) ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    className="fee-link-btn fee-link-danger"
                    onClick={() =>
                      setConfirm({
                        open: true,
                        title: "Delete cycle",
                        message: "Delete this fee cycle? Blocked if installments/structures exist.",
                        danger: true,
                        onConfirm: async () => {
                          await feeAPI.deleteTerm(Number(r.id));
                          showAlert("success", "Cycle deleted");
                          await loadCycles();
                          onChanged();
                        },
                      })
                    }
                  >
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
        />
      ) : (
        <>
          <FeeTable
            loading={loading}
            rows={instRows}
            rowKey={(r) => Number(r.id)}
            emptyTitle="No installment plans yet"
            columns={[
              {
                key: "name",
                header: "Name",
                render: (r) => String(r.name || `Installment ${r.installment_no}`),
              },
              { key: "no", header: "#", render: (r) => String(r.installment_no) },
              {
                key: "term",
                header: "Cycle",
                render: (r) =>
                  String(
                    (r.fee_term as { term_title?: string } | null)?.term_title ||
                      r.fee_term_id
                  ),
              },
              {
                key: "date",
                header: "Due Date",
                render: (r) => String(r.installment_date).slice(0, 10),
              },
              {
                key: "linked",
                header: "Students / Assignments",
                render: (r) => {
                  const count = Number(r.linked_assignment_count || 0);
                  const studentCount = Number(r.linked_student_count || 0);
                  const excludedCount = Number(r.excluded_student_count || 0);
                  const hasData = count > 0 || excludedCount > 0;
                  if (!hasData) return <span className="fee-hint">No assignments</span>;
                  return (
                    <button
                      type="button"
                      className="fee-link-btn"
                      onClick={() => setExpandedInstId(expandedInstId === Number(r.id) ? null : Number(r.id))}
                    >
                      {studentCount} student{studentCount !== 1 ? "s" : ""}
                      {excludedCount > 0 && <span style={{ color: "var(--danger, #dc2626)" }}> · {excludedCount} excluded</span>}
                      {expandedInstId === Number(r.id) ? " ▲" : " ▼"}
                    </button>
                  );
                },
              },
              {
                key: "status",
                header: "Status",
                render: (r) => <FeeStatusBadge active={isActiveStatus(r.status)} />,
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
                        setEditingInst(r);
                        setInstForm({
                          branch_id: String(r.branch_id || ""),
                          program_id: String(r.program_id || ""),
                          class_id: String(r.class_id || ""),
                          group_id: String(r.group_id ?? "0"),
                          fee_term_id: String(r.fee_term_id || ""),
                          installment_no: String(r.installment_no || "1"),
                          installment_date: String(r.installment_date).slice(0, 10),
                          name: String(r.name || ""),
                          description: String(r.description || ""),
                          status: String(r.status || "1"),
                        });
                        setInstModalOpen(true);
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
                          title: "Toggle installment",
                          message: "Change installment status?",
                          onConfirm: async () => {
                            await feeAPI.toggleInstallment(
                              Number(r.id),
                              isActiveStatus(r.status) ? "0" : "1"
                            );
                            showAlert("success", "Installment status updated");
                            await loadInstallments();
                            onChanged();
                          },
                        })
                      }
                    >
                      {isActiveStatus(r.status) ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      className="fee-link-btn fee-link-danger"
                      onClick={() =>
                        setConfirm({
                          open: true,
                          title: "Delete installment",
                          message: "Delete this installment plan?",
                          danger: true,
                          onConfirm: async () => {
                            await feeAPI.deleteInstallment(Number(r.id));
                            showAlert("success", "Installment deleted");
                            await loadInstallments();
                            onChanged();
                          },
                        })
                      }
                    >
                      Delete
                    </button>
                  </div>
                ),
              },
            ]}
          />
          {expandedInstId && (() => {
            const inst = instRows.find((r) => Number(r.id) === expandedInstId);
            const assignments = (inst?.linked_assignments || []) as Array<{
              id: number;
              student_id: number | null;
              student: { id: number; name: string; reg_no: string | null } | null;
              fee_structure_code: number;
            }>;
            const exclusions = (inst?.exclusions || []) as Array<{
              id: number;
              student_id: number;
              student: { id: number; name: string; reg_no: string | null } | null;
              reason: string | null;
            }>;
            const excludedStudentIds = new Set(exclusions.map((e) => e.student_id));
            const instName = String((inst as Record<string, unknown>)?.name || `Installment ${(inst as Record<string, unknown>)?.installment_no}`);

            return (
              <div style={{ margin: "0.75rem 0", padding: "0.75rem", border: "1px solid var(--divider-color)", borderRadius: "0.5rem" }}>
                <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem" }}>
                  Students &amp; Assignments — {instName}
                </h4>

                {assignments.length > 0 && (
                  <>
                    <h5 style={{ margin: "0.5rem 0 0.25rem", fontSize: "0.8rem", color: "var(--text-dark-sub)" }}>
                      Linked Fee Assignments
                    </h5>
                    <FeeTable
                      rows={assignments}
                      rowKey={(r) => r.id}
                      emptyTitle=""
                      columns={[
                        {
                          key: "student",
                          header: "Student",
                          render: (r) =>
                            r.student ? (
                              <div>
                                <strong>{r.student.name}</strong>
                                {r.student.reg_no && <div className="fee-hint">{r.student.reg_no}</div>}
                              </div>
                            ) : (
                              <span className="fee-hint">Class-level assignment</span>
                            ),
                        },
                        { key: "struct", header: "Structure Code", render: (r) => String(r.fee_structure_code) },
                        {
                          key: "instStatus",
                          header: "Installment Status",
                          render: (r) => {
                            if (!r.student_id) return <span className="fee-hint">—</span>;
                            const isExcluded = excludedStudentIds.has(r.student_id);
                            return isExcluded
                              ? <span style={{ color: "var(--danger, #dc2626)", fontWeight: 600 }}>Excluded</span>
                              : <span style={{ color: "var(--success, #16a34a)", fontWeight: 600 }}>Included</span>;
                          },
                        },
                        {
                          key: "action",
                          header: "Action",
                          render: (r) => {
                            if (!r.student_id) return <span className="fee-hint">—</span>;
                            const isExcluded = excludedStudentIds.has(r.student_id);
                            return isExcluded ? (
                              <button
                                type="button"
                                className="fee-link-btn"
                                onClick={() =>
                                  setConfirm({
                                    open: true,
                                    title: "Restore student to installment",
                                    message: `Remove the exclusion for ${r.student?.name || "this student"} from ${instName}? The student will be included again. Their fee assignment is NOT affected.`,
                                    onConfirm: async () => {
                                      await feeAPI.removeInstallmentExclusion({
                                        student_id: r.student_id!,
                                        installment_id: expandedInstId!,
                                      });
                                      showAlert("success", `${r.student?.name || "Student"} restored to ${instName}`);
                                      await loadInstallments();
                                    },
                                  })
                                }
                              >
                                Restore
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="fee-link-btn fee-link-danger"
                                onClick={() =>
                                  setConfirm({
                                    open: true,
                                    title: "Exclude student from installment",
                                    message: `Exclude ${r.student?.name || "this student"} from ${instName}? This does NOT deactivate their fee assignment — it only marks them as excluded from this specific installment.`,
                                    danger: true,
                                    onConfirm: async () => {
                                      await feeAPI.excludeStudentFromInstallment({
                                        student_id: r.student_id!,
                                        installment_id: expandedInstId!,
                                      });
                                      showAlert("success", `${r.student?.name || "Student"} excluded from ${instName}`);
                                      await loadInstallments();
                                    },
                                  })
                                }
                              >
                                Exclude
                              </button>
                            );
                          },
                        },
                      ]}
                    />
                  </>
                )}

                {exclusions.length > 0 && (
                  <>
                    <h5 style={{ margin: "0.75rem 0 0.25rem", fontSize: "0.8rem", color: "var(--danger, #dc2626)" }}>
                      Excluded Students ({exclusions.length})
                    </h5>
                    <FeeTable
                      rows={exclusions}
                      rowKey={(r) => r.id}
                      emptyTitle=""
                      columns={[
                        {
                          key: "student",
                          header: "Student",
                          render: (r) =>
                            r.student ? (
                              <div>
                                <strong>{r.student.name}</strong>
                                {r.student.reg_no && <div className="fee-hint">{r.student.reg_no}</div>}
                              </div>
                            ) : (
                              <span>Student #{r.student_id}</span>
                            ),
                        },
                        { key: "reason", header: "Reason", render: (r) => r.reason || <span className="fee-hint">—</span> },
                        {
                          key: "restore",
                          header: "Action",
                          render: (r) => (
                            <button
                              type="button"
                              className="fee-link-btn"
                              onClick={() =>
                                setConfirm({
                                  open: true,
                                  title: "Restore student",
                                  message: `Remove the exclusion for ${r.student?.name || `Student #${r.student_id}`} from ${instName}?`,
                                  onConfirm: async () => {
                                    await feeAPI.removeInstallmentExclusion({
                                      student_id: r.student_id,
                                      installment_id: expandedInstId!,
                                    });
                                    showAlert("success", "Exclusion removed");
                                    await loadInstallments();
                                  },
                                })
                              }
                            >
                              Restore
                            </button>
                          ),
                        },
                      ]}
                    />
                  </>
                )}

                {!assignments.length && !exclusions.length && (
                  <p className="fee-hint">No linked assignments or exclusions for this installment.</p>
                )}
              </div>
            );
          })()}
        </>
      )}

      <FeeModal
        open={modalOpen}
        title={editing ? "Edit Fee Cycle" : "Create Fee Cycle"}
        onClose={() => setModalOpen(false)}
        wide
        footer={
          <>
            <button type="button" className="fee-btn fee-btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="fee-btn fee-btn-primary" onClick={saveCycle} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className="fee-form-grid">
          <FeeField label="Cycle Type" required>
            <FeeSelect
              value={form.term_title}
              onChange={(e) => setForm((f) => ({ ...f, term_title: e.target.value }))}
              options={(lookups?.presets.feeCycles || []).map((c) => ({
                value: c,
                label: c,
              }))}
              placeholder="Cycle"
            />
          </FeeField>
          <FeeField label="Term Number" required>
            <FeeInput
              type="number"
              min={1}
              value={form.term_number}
              onChange={(e) => setForm((f) => ({ ...f, term_number: e.target.value }))}
            />
          </FeeField>
          <FeeField label="Branch" required>
            <FeeSelect
              value={form.branch_id}
              onChange={(e) => setForm((f) => ({ ...f, branch_id: e.target.value }))}
              options={(lookups?.branches || []).map((b) => ({ value: b.id, label: b.name }))}
            />
          </FeeField>
          <FeeField label="Session">
            <FeeSelect
              value={form.session_id}
              onChange={(e) => setForm((f) => ({ ...f, session_id: e.target.value }))}
              options={(lookups?.sessions || []).map((s) => ({ value: s.id, label: s.title }))}
            />
          </FeeField>
          <FeeField label="Program" required>
            <FeeSelect
              value={form.program_id}
              onChange={(e) => setForm((f) => ({ ...f, program_id: e.target.value }))}
              options={(lookups?.programs || []).map((p) => ({ value: p.id, label: p.name }))}
            />
          </FeeField>
          <FeeField label="Board" required>
            <FeeSelect
              value={form.board_id}
              onChange={(e) => setForm((f) => ({ ...f, board_id: e.target.value }))}
              options={(lookups?.boards || []).map((b) => ({ value: b.id, label: b.name }))}
            />
          </FeeField>
          <FeeField label="Class" required>
            <FeeSelect
              value={form.class_id}
              onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}
              options={(lookups?.classes || []).map((c) => ({ value: c.id, label: c.name }))}
            />
          </FeeField>
          <FeeField label="Student Group" hint="Optional — 0 means all / none">
            <FeeSelect
              value={form.group_id}
              onChange={(e) => setForm((f) => ({ ...f, group_id: e.target.value }))}
              options={[
                { value: 0, label: "None (0)" },
                ...(lookups?.academicGroups || []).map((g) => ({
                  value: g.id,
                  label: g.name,
                })),
              ]}
              placeholder="Group"
            />
          </FeeField>
          <FeeField label="Starting Date" required>
            <FeeInput
              type="date"
              value={form.starting_date}
              onChange={(e) => setForm((f) => ({ ...f, starting_date: e.target.value }))}
            />
          </FeeField>
          <FeeField label="Ending Date" required>
            <FeeInput
              type="date"
              value={form.ending_date}
              onChange={(e) => setForm((f) => ({ ...f, ending_date: e.target.value }))}
            />
          </FeeField>
        </div>
      </FeeModal>

      <FeeModal
        open={instModalOpen}
        title={editingInst ? "Edit Installment" : "Create Installment"}
        onClose={() => setInstModalOpen(false)}
        wide
        footer={
          <>
            <button type="button" className="fee-btn fee-btn-ghost" onClick={() => setInstModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="fee-btn fee-btn-primary" onClick={saveInst} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        {(() => {
          const selectedTerm = (lookups?.feeTerms || []).find(
            (t) => String(t.id) === instForm.fee_term_id
          ) as Record<string, unknown> | undefined;
          const selectedBranch = (lookups?.branches || []).find(
            (b) => String(b.id) === instForm.branch_id
          );
          const selectedProgram = (lookups?.programs || []).find(
            (p) => String(p.id) === instForm.program_id
          );
          const selectedClass = (lookups?.classes || []).find(
            (c) => String(c.id) === instForm.class_id
          );
          return (
            <>
              {(selectedTerm || selectedBranch) && (
                <div className="fee-alert fee-alert-info" style={{ marginBottom: "0.75rem", fontSize: "0.85rem" }}>
                  <strong>Context:</strong>{" "}
                  {[
                    selectedBranch?.name,
                    selectedProgram?.name,
                    selectedClass?.name,
                  ].filter(Boolean).join(" · ")}
                  {selectedTerm && (
                    <>
                      {" — "}Cycle: <strong>{String(selectedTerm.term_title)}</strong>
                      {" "}({String(selectedTerm.starting_date).slice(0, 10)} → {String(selectedTerm.ending_date).slice(0, 10)})
                    </>
                  )}
                  <br />
                  <span className="fee-hint">
                    This installment will apply to all students assigned to this fee cycle through Student Fee Assignment.
                    Individual students can be excluded after creation.
                  </span>
                </div>
              )}
              <div className="fee-form-grid">
                <FeeField label="Fee Cycle" required>
                  <FeeSelect
                    value={instForm.fee_term_id}
                    onChange={(e) => setInstForm((f) => ({ ...f, fee_term_id: e.target.value }))}
                    options={(lookups?.feeTerms || []).map((t) => ({
                      value: t.id,
                      label: `${t.term_title} (#${t.term_number})`,
                    }))}
                  />
                </FeeField>
                <FeeField label="Installment No" required>
                  <FeeInput
                    type="number"
                    min={1}
                    value={instForm.installment_no}
                    onChange={(e) => setInstForm((f) => ({ ...f, installment_no: e.target.value }))}
                  />
                </FeeField>
                <FeeField label="Name">
                  <FeeInput
                    value={instForm.name}
                    onChange={(e) => setInstForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. First Installment"
                  />
                </FeeField>
                <FeeField label="Due Date" required hint={selectedTerm ? `Must be within ${String(selectedTerm.starting_date).slice(0, 10)} to ${String(selectedTerm.ending_date).slice(0, 10)}` : undefined}>
                  <FeeInput
                    type="date"
                    value={instForm.installment_date}
                    onChange={(e) => setInstForm((f) => ({ ...f, installment_date: e.target.value }))}
                  />
                </FeeField>
                <FeeField label="Branch" required>
                  <FeeSelect
                    value={instForm.branch_id}
                    onChange={(e) => setInstForm((f) => ({ ...f, branch_id: e.target.value }))}
                    options={(lookups?.branches || []).map((b) => ({ value: b.id, label: b.name }))}
                  />
                </FeeField>
                <FeeField label="Program" required>
                  <FeeSelect
                    value={instForm.program_id}
                    onChange={(e) => setInstForm((f) => ({ ...f, program_id: e.target.value }))}
                    options={(lookups?.programs || []).map((p) => ({ value: p.id, label: p.name }))}
                  />
                </FeeField>
                <FeeField label="Class" required>
                  <FeeSelect
                    value={instForm.class_id}
                    onChange={(e) => setInstForm((f) => ({ ...f, class_id: e.target.value }))}
                    options={(lookups?.classes || []).map((c) => ({ value: c.id, label: c.name }))}
                  />
                </FeeField>
                <FeeField label="Description">
                  <FeeTextarea
                    value={instForm.description}
                    onChange={(e) => setInstForm((f) => ({ ...f, description: e.target.value }))}
                    rows={2}
                  />
                </FeeField>
              </div>
            </>
          );
        })()}
      </FeeModal>
    </div>
  );
};

/* ═══════════════════════ Structures ═══════════════════════ */
export const StructuresPanel: React.FC<PanelProps> = ({
  lookups,
  branchFilter,
  showAlert,
  setConfirm,
  onChanged,
}) => {
  const [groups, setGroups] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    branch_id: "",
    session_id: "",
    program_id: "",
    class_id: "",
    board_id: "",
    term_id: "",
    description: "",
  });
  const [lines, setLines] = useState<Array<{ fee_head_id: string; fee_amount: string }>>([
    { fee_head_id: "", fee_amount: "" },
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feeAPI.listStructureGroups({
        branch_id: branchFilter,
        limit: 200,
      });
      setGroups(res.data.data.items || []);
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [branchFilter, showAlert]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm({
      branch_id: String(branchFilter || lookups?.branches[0]?.id || ""),
      session_id: String(lookups?.sessions[0]?.id || ""),
      program_id: String(lookups?.programs[0]?.id || ""),
      class_id: String(lookups?.classes[0]?.id || ""),
      board_id: String(lookups?.boards[0]?.id || ""),
      term_id: "",
      description: "",
    });
    setLines([{ fee_head_id: "", fee_amount: "" }]);
    setModalOpen(true);
  };

  const save = async () => {
    const validLines = lines.filter((l) => l.fee_head_id && l.fee_amount !== "");
    if (!form.branch_id || !form.program_id || !form.class_id || !validLines.length) {
      showAlert("error", "Branch, program, class and at least one fee line are required");
      return;
    }
    setSaving(true);
    try {
      await feeAPI.createStructureBulk({
        branch_id: Number(form.branch_id),
        session_id: form.session_id ? Number(form.session_id) : undefined,
        program_id: Number(form.program_id),
        class_id: Number(form.class_id),
        board_id: form.board_id ? Number(form.board_id) : undefined,
        term_id: form.term_id ? Number(form.term_id) : undefined,
        description: form.description || null,
        lines: validLines.map((l) => ({
          fee_head_id: Number(l.fee_head_id),
          fee_amount: Number(l.fee_amount),
        })),
      });
      showAlert("success", "Fee structure created");
      setModalOpen(false);
      await load();
      onChanged();
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
          <h3>Fee Structures</h3>
          <p>Create amount matrices by combining fee types for a class / program.</p>
        </div>
        <button type="button" className="fee-btn fee-btn-primary" onClick={openCreate}>
          + Create Structure
        </button>
      </div>

      <FeeTable
        loading={loading}
        rows={groups}
        rowKey={(r) => String(r.fee_structure_code)}
        emptyTitle="No fee structures yet"
        emptyDescription="Build a structure with one or more fee type lines."
        columns={[
          {
            key: "code",
            header: "Structure Code",
            render: (r) => <code>{String(r.fee_structure_code)}</code>,
          },
          { key: "lines", header: "Lines", render: (r) => String(r.line_count) },
          {
            key: "total",
            header: "Total",
            render: (r) => `₨ ${Number(r.total_amount || 0).toLocaleString()}`,
          },
          {
            key: "status",
            header: "Status",
            render: (r) => <FeeStatusBadge active={isActiveStatus(r.status)} />,
          },
          {
            key: "actions",
            header: "Actions",
            render: (r) => (
              <div className="fee-row-actions">
                <button
                  type="button"
                  className="fee-link-btn"
                  onClick={() =>
                    setConfirm({
                      open: true,
                      title: "Toggle structure",
                      message: `Change status for structure ${r.fee_structure_code}?`,
                      onConfirm: async () => {
                        await feeAPI.toggleStructureGroup(
                          String(r.fee_structure_code),
                          isActiveStatus(r.status) ? 0 : 1
                        );
                        showAlert("success", "Structure status updated");
                        await load();
                        onChanged();
                      },
                    })
                  }
                >
                  {isActiveStatus(r.status) ? "Deactivate" : "Activate"}
                </button>
              </div>
            ),
          },
        ]}
      />

      <FeeModal
        open={modalOpen}
        title="Create Fee Structure"
        onClose={() => setModalOpen(false)}
        wide
        footer={
          <>
            <button type="button" className="fee-btn fee-btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="fee-btn fee-btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Create Structure"}
            </button>
          </>
        }
      >
        <div className="fee-form-grid">
          <FeeField label="Branch" required>
            <FeeSelect
              value={form.branch_id}
              onChange={(e) => setForm((f) => ({ ...f, branch_id: e.target.value }))}
              options={(lookups?.branches || []).map((b) => ({ value: b.id, label: b.name }))}
            />
          </FeeField>
          <FeeField label="Session">
            <FeeSelect
              value={form.session_id}
              onChange={(e) => setForm((f) => ({ ...f, session_id: e.target.value }))}
              options={(lookups?.sessions || []).map((s) => ({ value: s.id, label: s.title }))}
            />
          </FeeField>
          <FeeField label="Program" required>
            <FeeSelect
              value={form.program_id}
              onChange={(e) => setForm((f) => ({ ...f, program_id: e.target.value }))}
              options={(lookups?.programs || []).map((p) => ({ value: p.id, label: p.name }))}
            />
          </FeeField>
          <FeeField label="Class" required>
            <FeeSelect
              value={form.class_id}
              onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}
              options={(lookups?.classes || []).map((c) => ({ value: c.id, label: c.name }))}
            />
          </FeeField>
          <FeeField label="Board">
            <FeeSelect
              value={form.board_id}
              onChange={(e) => setForm((f) => ({ ...f, board_id: e.target.value }))}
              options={(lookups?.boards || []).map((b) => ({ value: b.id, label: b.name }))}
            />
          </FeeField>
          <FeeField label="Fee Cycle">
            <FeeSelect
              value={form.term_id}
              onChange={(e) => setForm((f) => ({ ...f, term_id: e.target.value }))}
              options={(lookups?.feeTerms || []).map((t) => ({
                value: t.id,
                label: t.term_title,
              }))}
            />
          </FeeField>
        </div>

        <div className="fee-lines-block">
          <div className="fee-lines-header">
            <h4>Fee Lines</h4>
            <button
              type="button"
              className="fee-btn fee-btn-ghost"
              onClick={() => setLines((prev) => [...prev, { fee_head_id: "", fee_amount: "" }])}
            >
              + Add Line
            </button>
          </div>
          {lines.map((line, idx) => (
            <div className="fee-line-row" key={idx}>
              <FeeSelect
                value={line.fee_head_id}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l, i) =>
                      i === idx ? { ...l, fee_head_id: e.target.value } : l
                    )
                  )
                }
                options={(lookups?.feeHeads || []).map((h) => ({
                  value: h.id,
                  label: h.fee_head_title || `Head #${h.id}`,
                }))}
                placeholder="Fee type"
              />
              <FeeInput
                type="number"
                min={0}
                step="0.01"
                placeholder="Amount"
                value={line.fee_amount}
                onChange={(e) =>
                  setLines((prev) =>
                    prev.map((l, i) =>
                      i === idx ? { ...l, fee_amount: e.target.value } : l
                    )
                  )
                }
              />
              {lines.length > 1 && (
                <button
                  type="button"
                  className="fee-link-btn fee-link-danger"
                  onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <FeeField label="Description">
          <FeeTextarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
          />
        </FeeField>
      </FeeModal>
    </div>
  );
};

/* ═══════════════════════ Assignments ═══════════════════════ */
export const AssignmentsPanel: React.FC<PanelProps> = ({
  lookups,
  branchFilter,
  showAlert,
  setConfirm,
  onChanged,
}) => {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [scopeFilter, setScopeFilter] = useState<"" | "class" | "group" | "student">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<Array<Record<string, unknown>>>([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [exclusionWarning, setExclusionWarning] = useState<string | null>(null);
  const [form, setForm] = useState({
    scope: "class" as "class" | "group" | "student",
    branch_id: "",
    session_id: "",
    program_id: "",
    class_id: "",
    board_id: "",
    intake_id: "0",
    fee_structure_code: "",
    installment_id: "",
    group_id: "",
    student_id: "",
    discount_fee: "0",
    fee_due_date_start: "",
    fee_due_date_end: "",
    status: "1",
  });
  const [dueDateModal, setDueDateModal] = useState(false);
  const [dueDateTarget, setDueDateTarget] = useState<Record<string, unknown> | null>(null);
  const [dueDateForm, setDueDateForm] = useState({
    fee_due_date_start: "",
    fee_due_date_end: "",
  });
  const [dueDateSaving, setDueDateSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feeAPI.listAssignments({
        branch_id: branchFilter,
        scope: scopeFilter || undefined,
        limit: 100,
      });
      setRows(res.data.data.items || []);
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [branchFilter, scopeFilter, showAlert]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!form.student_id || !form.installment_id) {
      setExclusionWarning(null);
      return;
    }
    let cancelled = false;
    feeAPI
      .checkInstallmentExclusion(Number(form.student_id), Number(form.installment_id))
      .then((res) => {
        if (cancelled) return;
        if (res.data.data === true) {
          setExclusionWarning(
            "This student is currently excluded from the selected installment. Proceed with caution or remove the exclusion first."
          );
        } else {
          setExclusionWarning(null);
        }
      })
      .catch(() => {
        if (!cancelled) setExclusionWarning(null);
      });
    return () => { cancelled = true; };
  }, [form.student_id, form.installment_id]);

  // Student scope lookup: query real `students` via existing /fee/students/search.
  // Do NOT AND-filter by the modal's auto-filled program/class (those defaults often
  // do not match the student and empty the dropdown). Page-level branchFilter is optional.
  useEffect(() => {
    if (form.scope !== "student") return;
    const timer = window.setTimeout(async () => {
      try {
        const res = await feeAPI.searchStudents({
          search: studentSearch || undefined,
          branch_id: branchFilter || undefined,
          limit: 40,
        });
        setStudents(res.data.data || []);
      } catch {
        setStudents([]);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [form.scope, studentSearch, branchFilter]);

  const openCreate = () => {
    setForm({
      scope: "class",
      branch_id: String(branchFilter || lookups?.branches[0]?.id || ""),
      session_id: String(lookups?.sessions[0]?.id || ""),
      program_id: String(lookups?.programs[0]?.id || ""),
      class_id: String(lookups?.classes[0]?.id || ""),
      board_id: String(lookups?.boards[0]?.id || ""),
      intake_id: String(lookups?.intakes[0]?.id || "0"),
      fee_structure_code: String(lookups?.feeStructureCodes[0]?.fee_structure_code || ""),
      installment_id: "",
      group_id: "",
      student_id: "",
      discount_fee: "0",
      fee_due_date_start: "",
      fee_due_date_end: "",
      status: "1",
    });
    setModalOpen(true);
  };

  const openDueDates = (row: Record<string, unknown>) => {
    setDueDateTarget(row);
    setDueDateForm({
      fee_due_date_start: row.fee_due_date_start
        ? String(row.fee_due_date_start).slice(0, 10)
        : "",
      fee_due_date_end: row.fee_due_date_end
        ? String(row.fee_due_date_end).slice(0, 10)
        : "",
    });
    setDueDateModal(true);
  };

  const saveDueDates = async () => {
    if (!dueDateTarget?.id) return;
    if (
      dueDateForm.fee_due_date_start &&
      dueDateForm.fee_due_date_end &&
      dueDateForm.fee_due_date_end < dueDateForm.fee_due_date_start
    ) {
      showAlert("error", "Due date end cannot be before due date start");
      return;
    }
    setDueDateSaving(true);
    try {
      await feeAPI.updateAssignment(Number(dueDateTarget.id), {
        fee_due_date_start: dueDateForm.fee_due_date_start || null,
        fee_due_date_end: dueDateForm.fee_due_date_end || null,
      });
      showAlert("success", "Fee due dates updated");
      setDueDateModal(false);
      setDueDateTarget(null);
      await load();
      onChanged();
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setDueDateSaving(false);
    }
  };

  const save = async () => {
    if (!form.fee_structure_code || !form.branch_id || !form.program_id || !form.class_id || !form.board_id) {
      showAlert("error", "Structure, branch, program, class and board are required");
      return;
    }
    if (form.scope === "group" && !form.group_id) {
      showAlert("error", "Select a student group");
      return;
    }
    if (form.scope === "student" && !form.student_id) {
      showAlert("error", "Select a student");
      return;
    }
    if (
      form.fee_due_date_start &&
      form.fee_due_date_end &&
      form.fee_due_date_end < form.fee_due_date_start
    ) {
      showAlert("error", "Due date end cannot be before due date start");
      return;
    }
    setSaving(true);
    try {
      await feeAPI.createAssignment({
        scope: form.scope,
        branch_id: Number(form.branch_id),
        session_id: form.session_id ? Number(form.session_id) : undefined,
        program_id: Number(form.program_id),
        class_id: Number(form.class_id),
        board_id: Number(form.board_id),
        intake_id: Number(form.intake_id || 0),
        fee_structure_code: Number(form.fee_structure_code),
        installment_id: form.installment_id ? Number(form.installment_id) : undefined,
        group_id: form.group_id ? Number(form.group_id) : undefined,
        student_id: form.student_id ? Number(form.student_id) : undefined,
        discount_fee: form.discount_fee || "0",
        fee_due_date_start: form.fee_due_date_start || null,
        fee_due_date_end: form.fee_due_date_end || null,
        status: form.status,
      });
      showAlert("success", "Fee structure assigned successfully");
      setModalOpen(false);
      await load();
      onChanged();
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
          <h3>Structure Assignments</h3>
          <p>Assign fee structures to classes, student groups, or individual students.</p>
        </div>
        <div className="fee-panel-actions">
          <FeeSelect
            value={scopeFilter}
            onChange={(e) =>
              setScopeFilter(e.target.value as "" | "class" | "group" | "student")
            }
            options={[
              { value: "class", label: "Class" },
              { value: "group", label: "Group" },
              { value: "student", label: "Student" },
            ]}
            placeholder="All scopes"
          />
          <button type="button" className="fee-btn fee-btn-primary" onClick={openCreate}>
            + Assign Structure
          </button>
        </div>
      </div>

      <FeeTable
        loading={loading}
        rows={rows}
        rowKey={(r) => Number(r.id)}
        emptyTitle="No assignments yet"
        emptyDescription="Assign a fee structure to a class, group, or student."
        columns={[
          {
            key: "scope",
            header: "Scope",
            render: (r) => (
              <span className="fee-scope-pill">{String(r.scope || "class")}</span>
            ),
          },
          {
            key: "code",
            header: "Structure",
            render: (r) => <code>{String(r.fee_structure_code)}</code>,
          },
          {
            key: "target",
            header: "Target",
            render: (r) => {
              if (r.scope === "student") {
                const student = r.student as { name?: string; reg_no?: string } | null;
                return student?.name
                  ? `${student.name}${student.reg_no ? ` (${student.reg_no})` : ""}`
                  : `Student #${r.student_id}`;
              }
              if (r.scope === "group") {
                return String(r.fee_master_basic_id || `Group assignment #${r.id}`);
              }
              return `Class #${r.class_id}`;
            },
          },
          {
            key: "total",
            header: "Total",
            render: (r) => `₨ ${Number(r.total_fee || 0).toLocaleString()}`,
          },
          {
            key: "due",
            header: "Due date",
            render: (r) => {
              const start = r.fee_due_date_start
                ? String(r.fee_due_date_start).slice(0, 10)
                : null;
              const end = r.fee_due_date_end
                ? String(r.fee_due_date_end).slice(0, 10)
                : null;
              if (!start && !end) return "—";
              if (start && end && start !== end) return `${start} → ${end}`;
              return end || start || "—";
            },
          },
          {
            key: "status",
            header: "Status",
            render: (r) => <FeeStatusBadge active={isActiveStatus(r.status)} />,
          },
          {
            key: "actions",
            header: "Actions",
            render: (r) => (
              <div className="fee-row-actions">
                <button
                  type="button"
                  className="fee-link-btn"
                  onClick={() => openDueDates(r)}
                >
                  Due dates
                </button>
                <button
                  type="button"
                  className="fee-link-btn"
                  onClick={() =>
                    setConfirm({
                      open: true,
                      title: "Toggle assignment",
                      message: "Change assignment status?",
                      onConfirm: async () => {
                        await feeAPI.toggleAssignment(
                          Number(r.id),
                          isActiveStatus(r.status) ? "0" : "1"
                        );
                        showAlert("success", "Assignment status updated");
                        await load();
                        onChanged();
                      },
                    })
                  }
                >
                  {isActiveStatus(r.status) ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button"
                  className="fee-link-btn fee-link-danger"
                  onClick={() =>
                    setConfirm({
                      open: true,
                      title: "Delete assignment",
                      message: "Remove this assignment and its master lines?",
                      danger: true,
                      onConfirm: async () => {
                        await feeAPI.deleteAssignment(Number(r.id));
                        showAlert("success", "Assignment deleted");
                        await load();
                        onChanged();
                      },
                    })
                  }
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
      />

      <FeeModal
        open={modalOpen}
        title="Assign Fee Structure"
        onClose={() => setModalOpen(false)}
        wide
        footer={
          <>
            <button type="button" className="fee-btn fee-btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="fee-btn fee-btn-primary" onClick={save} disabled={saving}>
              {saving ? "Assigning…" : "Assign"}
            </button>
          </>
        }
      >
        <div className="fee-form-grid">
          <FeeField label="Assignment Scope" required>
            <FeeSelect
              value={form.scope}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  scope: e.target.value as "class" | "group" | "student",
                }))
              }
              options={[
                { value: "class", label: "Class" },
                { value: "group", label: "Student Group" },
                { value: "student", label: "Individual Student" },
              ]}
              placeholder="Scope"
            />
          </FeeField>
          <FeeField label="Fee Structure" required>
            <FeeSelect
              value={form.fee_structure_code}
              onChange={(e) => setForm((f) => ({ ...f, fee_structure_code: e.target.value }))}
              options={(lookups?.feeStructureCodes || []).map((s) => ({
                value: s.fee_structure_code,
                label: `${s.fee_structure_code} (₨ ${s.total_amount.toLocaleString()} · ${s.line_count} lines)`,
              }))}
            />
          </FeeField>
          <FeeField label="Branch" required>
            <FeeSelect
              value={form.branch_id}
              onChange={(e) => setForm((f) => ({ ...f, branch_id: e.target.value }))}
              options={(lookups?.branches || []).map((b) => ({ value: b.id, label: b.name }))}
            />
          </FeeField>
          <FeeField label="Program" required>
            <FeeSelect
              value={form.program_id}
              onChange={(e) => setForm((f) => ({ ...f, program_id: e.target.value }))}
              options={(lookups?.programs || []).map((p) => ({ value: p.id, label: p.name }))}
            />
          </FeeField>
          <FeeField label="Class" required>
            <FeeSelect
              value={form.class_id}
              onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}
              options={(lookups?.classes || []).map((c) => ({ value: c.id, label: c.name }))}
            />
          </FeeField>
          <FeeField label="Board" required>
            <FeeSelect
              value={form.board_id}
              onChange={(e) => setForm((f) => ({ ...f, board_id: e.target.value }))}
              options={(lookups?.boards || []).map((b) => ({ value: b.id, label: b.name }))}
            />
          </FeeField>
          <FeeField label="Installment Plan">
            <FeeSelect
              value={form.installment_id}
              onChange={(e) => setForm((f) => ({ ...f, installment_id: e.target.value }))}
              options={(lookups?.installmentPlans || []).map((i) => ({
                value: i.id,
                label: i.name || `Installment #${i.id}`,
              }))}
            />
            {exclusionWarning && (
              <div className="fee-alert fee-alert-info" style={{ marginTop: "0.5rem", fontSize: "0.82rem", color: "var(--danger, #dc2626)" }}>
                ⚠ {exclusionWarning}
              </div>
            )}
          </FeeField>
          <FeeField label="Discount Amount">
            <FeeInput
              type="number"
              min={0}
              value={form.discount_fee}
              onChange={(e) => setForm((f) => ({ ...f, discount_fee: e.target.value }))}
            />
          </FeeField>

          {form.scope === "group" && (
            <FeeField label="Student Group" required>
              <FeeSelect
                value={form.group_id}
                onChange={(e) => setForm((f) => ({ ...f, group_id: e.target.value }))}
                options={(lookups?.academicGroups || []).map((g) => ({
                  value: g.id,
                  label: g.name,
                }))}
              />
            </FeeField>
          )}

          {form.scope === "student" && (
            <>
              <FeeField
                label="Search Student"
                hint="Searches live students from the database (name or registration no)."
              >
                <FeeInput
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Name or registration no…"
                />
              </FeeField>
              <FeeField label="Student" required>
                <FeeSelect
                  value={form.student_id}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selected = students.find(
                      (s) => String(s.id) === String(selectedId)
                    );
                    setForm((f) => ({
                      ...f,
                      student_id: selectedId,
                      // Align assignment academic fields with the selected student record
                      branch_id: selected?.branch_id
                        ? String(selected.branch_id)
                        : f.branch_id,
                      program_id: selected?.program_id
                        ? String(selected.program_id)
                        : f.program_id,
                      class_id: selected?.class_id
                        ? String(selected.class_id)
                        : f.class_id,
                      board_id: selected?.board_id
                        ? String(selected.board_id)
                        : f.board_id,
                    }));
                  }}
                  options={students.map((s) => ({
                    value: Number(s.id),
                    label: `${String(s.name)}${s.reg_no ? ` (${s.reg_no})` : ""}`,
                  }))}
                  placeholder={
                    students.length
                      ? "Select student…"
                      : "No students found — try another search"
                  }
                />
              </FeeField>
            </>
          )}

          <FeeField
            label="Due date start"
            hint="Optional. Stored on fee_master_basics.fee_due_date_start for late-fee calculation."
          >
            <FeeInput
              type="date"
              value={form.fee_due_date_start}
              onChange={(e) =>
                setForm((f) => ({ ...f, fee_due_date_start: e.target.value }))
              }
            />
          </FeeField>
          <FeeField
            label="Due date end"
            hint="Primary due date used by Late Fee Management (fee_due_date_end). Leave blank if not yet known."
          >
            <FeeInput
              type="date"
              value={form.fee_due_date_end}
              onChange={(e) =>
                setForm((f) => ({ ...f, fee_due_date_end: e.target.value }))
              }
            />
          </FeeField>
        </div>
      </FeeModal>

      <FeeModal
        open={dueDateModal}
        title="Set fee due dates"
        onClose={() => {
          setDueDateModal(false);
          setDueDateTarget(null);
        }}
        footer={
          <>
            <button
              type="button"
              className="fee-btn fee-btn-ghost"
              onClick={() => {
                setDueDateModal(false);
                setDueDateTarget(null);
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="fee-btn fee-btn-primary"
              onClick={saveDueDates}
              disabled={dueDateSaving}
            >
              {dueDateSaving ? "Saving…" : "Save due dates"}
            </button>
          </>
        }
      >
        <p className="fee-hint">
          Assignment #{String(dueDateTarget?.id || "")}. These dates are stored on the existing
          fee statement and used by Late Fee Management, Student Fee Records, and Payment
          Processing.
        </p>
        <div className="fee-form-grid">
          <FeeField label="Due date start">
            <FeeInput
              type="date"
              value={dueDateForm.fee_due_date_start}
              onChange={(e) =>
                setDueDateForm((f) => ({ ...f, fee_due_date_start: e.target.value }))
              }
            />
          </FeeField>
          <FeeField label="Due date end" hint="Late fee uses this end date as the due date.">
            <FeeInput
              type="date"
              value={dueDateForm.fee_due_date_end}
              onChange={(e) =>
                setDueDateForm((f) => ({ ...f, fee_due_date_end: e.target.value }))
              }
            />
          </FeeField>
        </div>
      </FeeModal>
    </div>
  );
};

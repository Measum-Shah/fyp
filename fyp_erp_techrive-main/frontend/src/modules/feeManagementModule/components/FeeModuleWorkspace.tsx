import React, { useCallback, useEffect, useMemo, useState } from "react";
import feeAPI from "../services/feeApi";
import { getErrorMessage, useFeeLookups } from "../hooks/useFeeLookups";
import type { FeeLookups } from "../hooks/useFeeLookups";
import {
  FeeAlert,
  FeeConfirmDialog,
  FeeField,
  FeeInput,
  FeeLoading,
  FeeModal,
  FeeSelect,
  FeeStatusBadge,
  FeeTable,
  FeeTextarea,
} from "./FeeUI";
import {
  AssignmentsPanel,
  CyclesPanel,
  StructuresPanel,
} from "./FeeModulePanels";
import type { ConfirmState } from "./FeeModulePanels";
import { StudentFeeRecordsPanel } from "./StudentFeeRecordsPanel";
import { PaymentProcessingPanel } from "./PaymentProcessingPanel";
import { DiscountsConcessionsPanel } from "./DiscountsConcessionsPanel";
import { LateFeeManagementPanel } from "./LateFeeManagementPanel";
import { AlertsNotificationsPanel } from "./AlertsNotificationsPanel";
import { ReportingAnalyticsPanel } from "./ReportingAnalyticsPanel";
import { FeeSectionPrintsPanel } from "./FeeSectionPrintsPanel";
import { ErpFeeHeadsPanel } from "./ErpFeeHeadsPanel";

type TabKey =
  | "overview"
  | "sections"
  | "section-prints"
  | "erp-fee-heads"
  | "types"
  | "cycles"
  | "structures"
  | "assignments"
  | "student-records"
  | "payments"
  | "discounts"
  | "late-fees"
  | "notifications"
  | "reports";

export type FeeTabKey = TabKey;

export const FEE_NAV_ITEMS: Array<{ key: TabKey; label: string; subtitle: string }> = [
  { key: "overview", label: "Overview", subtitle: "Setup health and quick links" },
  { key: "sections", label: "Fee Sections", subtitle: "Group fee types" },
  {
    key: "section-prints",
    label: "Fee Section Prints",
    subtitle: "Print headers & vouchers sequence",
  },
  {
    key: "erp-fee-heads",
    label: "ERP Fee Heads",
    subtitle: "Parent categories for fee types",
  },
  { key: "types", label: "Fee Types", subtitle: "Tuition, Lab, and other charges" },
  { key: "cycles", label: "Cycles & Installments", subtitle: "Billing periods" },
  { key: "structures", label: "Fee Structures", subtitle: "Amount matrices" },
  { key: "assignments", label: "Student Fee Assignment", subtitle: "Class, group, or student" },
  {
    key: "student-records",
    label: "Student Fee Records",
    subtitle: "Dues, statements, invoices and receipts",
  },
  {
    key: "payments",
    label: "Payment Processing",
    subtitle: "Collect and reconcile fee payments",
  },
  {
    key: "discounts",
    label: "Discounts & Concessions",
    subtitle: "Discount types, scholarships and concessions",
  },
  {
    key: "late-fees",
    label: "Late Fee Management",
    subtitle: "Grace periods and automated late fees",
  },
  {
    key: "notifications",
    label: "Alerts & Notifications",
    subtitle: "Due reminders, payment confirmations and overdue notices",
  },
  {
    key: "reports",
    label: "Reporting & Analytics",
    subtitle: "Collections, outstanding, discounts, defaulters and audit",
  },
];

const isActiveStatus = (value: unknown) =>
  value === 1 || value === "1" || value === true;

const emptyConfirm: ConfirmState = {
  open: false,
  title: "",
  message: "",
  onConfirm: async () => undefined,
};

type Props = {
  userBranchId?: number | null;
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  allowedTabs?: TabKey[];
  teacherRestricted?: boolean;
};

const FeeModuleWorkspace: React.FC<Props> = ({
  userBranchId,
  activeTab: tab,
  onTabChange: setTab,
  allowedTabs,
  teacherRestricted = false,
}) => {
  // When allowedTabs is provided, block unauthorized tab content
  if (allowedTabs && allowedTabs.length > 0 && !allowedTabs.includes(tab)) {
    return (
      <div className="fee-panel">
        <div className="fee-empty">
          <h4>Section not available</h4>
          <p>You do not have permission to view this Fee Management section.</p>
        </div>
      </div>
    );
  }
  const [branchFilter, setBranchFilter] = useState<number | undefined>(
    userBranchId || undefined
  );
  const { lookups, loading: lookupsLoading, refresh: refreshLookups } =
    useFeeLookups(branchFilter);

  const [alert, setAlert] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(emptyConfirm);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [overview, setOverview] = useState<Record<string, number> | null>(null);

  const activeNav = FEE_NAV_ITEMS.find((t) => t.key === tab) || FEE_NAV_ITEMS[0];

  const showAlert = useCallback((type: "success" | "error" | "info", message: string) => {
    setAlert({ type, message });
    window.setTimeout(() => setAlert(null), 4500);
  }, []);

  const runConfirm = async () => {
    setConfirmLoading(true);
    try {
      await confirm.onConfirm();
      setConfirm(emptyConfirm);
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setConfirmLoading(false);
    }
  };

  const loadOverview = useCallback(async () => {
    try {
      const res = await feeAPI.getOverview(branchFilter);
      setOverview(res.data.data);
    } catch (err) {
      showAlert("error", getErrorMessage(err, "Failed to load overview"));
    }
  }, [branchFilter]);

  useEffect(() => {
    if (tab === "overview") loadOverview();
  }, [tab, loadOverview]);

  const branchOptions = useMemo(
    () =>
      (lookups?.branches || []).map((b) => ({
        value: b.id,
        label: b.name,
      })),
    [lookups]
  );

  return (
    <div className="fee-workspace">
      <div className="fee-toolbar">
        <div>
          <h2 className="fee-toolbar-title">{activeNav.label}</h2>
          <p className="fee-toolbar-sub">{activeNav.subtitle}</p>
        </div>
        <div className="fee-toolbar-actions">
          <FeeSelect
            value={branchFilter ?? ""}
            onChange={(e) =>
              setBranchFilter(e.target.value ? Number(e.target.value) : undefined)
            }
            options={branchOptions}
            placeholder="All branches"
            aria-label="Branch filter"
          />
          <button
            type="button"
            className="fee-btn fee-btn-ghost"
            onClick={() => {
              refreshLookups();
              if (tab === "overview") loadOverview();
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {alert && (
        <FeeAlert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="fee-panel">
        {lookupsLoading && !lookups ? (
          <FeeLoading label="Loading fee master data…" />
        ) : (
          <>
            {tab === "overview" && (
              <OverviewPanel overview={overview} onNavigate={setTab} />
            )}
            {tab === "sections" && (
              <SectionsPanel
                lookups={lookups}
                branchFilter={branchFilter}
                showAlert={showAlert}
                setConfirm={setConfirm}
                onChanged={refreshLookups}
              />
            )}
            {tab === "section-prints" && (
              <FeeSectionPrintsPanel
                showAlert={showAlert}
                setConfirm={setConfirm}
                onChanged={refreshLookups}
              />
            )}
            {tab === "erp-fee-heads" && (
              <ErpFeeHeadsPanel
                showAlert={showAlert}
                setConfirm={setConfirm}
                onChanged={refreshLookups}
              />
            )}
            {tab === "types" && (
              <TypesPanel
                lookups={lookups}
                branchFilter={branchFilter}
                showAlert={showAlert}
                setConfirm={setConfirm}
                onChanged={refreshLookups}
              />
            )}
            {tab === "cycles" && (
              <CyclesPanel
                lookups={lookups}
                branchFilter={branchFilter}
                showAlert={showAlert}
                setConfirm={setConfirm}
                onChanged={refreshLookups}
              />
            )}
            {tab === "structures" && (
              <StructuresPanel
                lookups={lookups}
                branchFilter={branchFilter}
                showAlert={showAlert}
                setConfirm={setConfirm}
                onChanged={refreshLookups}
              />
            )}
            {tab === "assignments" && (
              <AssignmentsPanel
                lookups={lookups}
                branchFilter={branchFilter}
                showAlert={showAlert}
                setConfirm={setConfirm}
                onChanged={refreshLookups}
              />
            )}
            {tab === "student-records" && (
              <StudentFeeRecordsPanel
                lookups={lookups}
                branchFilter={branchFilter}
                showAlert={showAlert}
                setConfirm={setConfirm}
                onChanged={refreshLookups}
              />
            )}
            {tab === "payments" && (
              <PaymentProcessingPanel
                lookups={lookups}
                branchFilter={branchFilter}
                showAlert={showAlert}
                setConfirm={setConfirm}
                onChanged={refreshLookups}
              />
            )}
            {tab === "discounts" && (
              <DiscountsConcessionsPanel
                lookups={lookups}
                branchFilter={branchFilter}
                showAlert={showAlert}
                setConfirm={setConfirm}
                onChanged={refreshLookups}
              />
            )}
            {tab === "late-fees" && (
              <LateFeeManagementPanel
                lookups={lookups}
                branchFilter={branchFilter}
                showAlert={showAlert}
                setConfirm={setConfirm}
                onChanged={refreshLookups}
              />
            )}
            {tab === "notifications" && (
              <AlertsNotificationsPanel
                lookups={lookups}
                branchFilter={branchFilter}
                showAlert={showAlert}
                setConfirm={setConfirm}
                onChanged={refreshLookups}
              />
            )}
            {tab === "reports" && (
              <ReportingAnalyticsPanel
                lookups={lookups}
                branchFilter={branchFilter}
                showAlert={showAlert}
                setConfirm={setConfirm}
                onChanged={refreshLookups}
                teacherRestricted={teacherRestricted}
              />
            )}
          </>
        )}
      </div>

      <FeeConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        danger={confirm.danger}
        loading={confirmLoading}
        onCancel={() => setConfirm(emptyConfirm)}
        onConfirm={runConfirm}
      />
    </div>
  );
};

const OverviewPanel: React.FC<{
  overview: Record<string, number> | null;
  onNavigate: (tab: TabKey) => void;
}> = ({ overview, onNavigate }) => {
  if (!overview) return <FeeLoading />;
  const cards = [
    { key: "active_sections", label: "Fee Sections", tab: "sections" as TabKey },
    { key: "active_fee_types", label: "Fee Types", tab: "types" as TabKey },
    { key: "active_fee_cycles", label: "Fee Cycles", tab: "cycles" as TabKey },
    { key: "active_installments", label: "Installments", tab: "cycles" as TabKey },
    { key: "active_structure_lines", label: "Structure Lines", tab: "structures" as TabKey },
    { key: "active_assignments", label: "Student Fee Assignment", tab: "assignments" as TabKey },
  ];

  return (
    <div className="fee-overview">
      <div className="fee-overview-grid">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            className="fee-overview-card"
            onClick={() => onNavigate(card.tab)}
          >
            <span className="fee-overview-value">{overview[card.key] ?? 0}</span>
            <span className="fee-overview-label">{card.label}</span>
          </button>
        ))}
      </div>
      <div className="fee-overview-help panel-card">
        <h3>Setup guide</h3>
        <ol className="fee-steps">
          <li>
            Create <strong>Fee Sections</strong> and define <strong>Fee Types</strong> (fee head
            setup: Tuition, Library, Lab, Transport, etc.).
          </li>
          <li>
            Build <strong>Fee Structures</strong> with amounts per fee type for a class/program.
          </li>
          <li>
            Configure <strong>Cycles &amp; Installments</strong> — fee cycles (Monthly / Quarterly /
            Semester / Annual) and installment dates.
          </li>
          <li>
            Complete <strong>Student Fee Assignment</strong> to a <strong>Class</strong>,{" "}
            <strong>Student Group</strong>, or <strong>Individual Student</strong>.
          </li>
          <li>
            Collect fees and issue vouchers via <strong>Student Fee Records</strong> and{" "}
            <strong>Payment Processing</strong>.
          </li>
          <li>
            Manage scholarships and concessions in <strong>Discounts &amp; Concessions</strong>.
          </li>
          <li>
            Review refunds reporting alongside collections in <strong>Reporting &amp; Analytics</strong>.
          </li>
          <li>
            Complete reconciliation, accounts link and fee history through{" "}
            <strong>Payment Processing</strong> and <strong>Reporting &amp; Analytics</strong>{" "}
            (including the audit trail).
          </li>
        </ol>
      </div>
    </div>
  );
};

/* ═══════════════════════ Sections ═══════════════════════ */
const SectionsPanel: React.FC<{
  lookups: FeeLookups | null;
  branchFilter?: number;
  showAlert: (t: "success" | "error" | "info", m: string) => void;
  setConfirm: React.Dispatch<React.SetStateAction<ConfirmState>>;
  onChanged: () => void;
}> = ({ lookups, branchFilter, showAlert, setConfirm, onChanged }) => {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    branch_id: "",
    session_id: "",
    title: "",
    fee_section_print_id: "",
    type: "1",
    status: "1",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feeAPI.listSections({
        branch_id: branchFilter,
        search: search || undefined,
        limit: 100,
      });
      setRows(res.data.data.items || []);
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [branchFilter, search, showAlert]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      branch_id: String(branchFilter || lookups?.branches[0]?.id || ""),
      session_id: String(lookups?.sessions[0]?.id || ""),
      title: "",
      fee_section_print_id: "",
      type: "1",
      status: "1",
    });
    setModalOpen(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditing(row);
    setForm({
      branch_id: String(row.branch_id || ""),
      session_id: String(row.session_id || ""),
      title: String(row.title || ""),
      fee_section_print_id: row.fee_section_print_id ? String(row.fee_section_print_id) : "",
      type: String(row.type || "1"),
      status: String(row.status || "1"),
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.branch_id || !form.session_id) {
      showAlert("error", "Title, branch and session are required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        branch_id: Number(form.branch_id),
        session_id: Number(form.session_id),
        title: form.title.trim(),
        fee_section_print_id: form.fee_section_print_id ? Number(form.fee_section_print_id) : 0,
        type: Number(form.type),
        status: form.status,
      };
      if (editing) {
        await feeAPI.updateSection(Number(editing.id), body);
        showAlert("success", "Fee section updated");
      } else {
        await feeAPI.createSection(body);
        showAlert("success", "Fee section created");
      }
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
          <h3>Fee Sections</h3>
          <p>Organize fee types into logical sections for printing and reporting.</p>
        </div>
        <div className="fee-panel-actions">
          <FeeInput
            placeholder="Search sections…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="fee-btn fee-btn-primary" onClick={openCreate}>
            + Add Section
          </button>
        </div>
      </div>

      <FeeTable
        loading={loading}
        rows={rows}
        rowKey={(r) => Number(r.id)}
        emptyTitle="No fee sections yet"
        emptyDescription="Create your first section to start grouping fee types."
        columns={[
          { key: "id", header: "ID", render: (r) => `#${r.id}` },
          { key: "title", header: "Title", render: (r) => String(r.title) },
          {
            key: "fee_section_print_id",
            header: "Print ID / Title",
            render: (r) => {
              const pid = Number(r.fee_section_print_id || 0);
              const printTitle = (r as { fee_section_print_title?: string | null })
                .fee_section_print_title;
              if (!pid && !printTitle) return <span style={{ opacity: 0.5 }}>—</span>;
              return printTitle ? `#${pid} — ${printTitle}` : `#${pid}`;
            },
          },
          { key: "slug", header: "Slug", render: (r) => String(r.slug || "—") },
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
                <button type="button" className="fee-link-btn" onClick={() => openEdit(r)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="fee-link-btn"
                  onClick={() =>
                    setConfirm({
                      open: true,
                      title: isActiveStatus(r.status) ? "Deactivate section" : "Activate section",
                      message: `Are you sure you want to ${isActiveStatus(r.status) ? "deactivate" : "activate"} “${r.title}”?`,
                      onConfirm: async () => {
                        await feeAPI.toggleSection(
                          Number(r.id),
                          isActiveStatus(r.status) ? "0" : "1"
                        );
                        showAlert("success", "Section status updated");
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
                      title: "Delete section",
                      message: `Permanently delete “${r.title}”? This fails if fee types are linked.`,
                      danger: true,
                      onConfirm: async () => {
                        await feeAPI.deleteSection(Number(r.id));
                        showAlert("success", "Section deleted");
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
        title={editing ? "Edit Fee Section" : "Create Fee Section"}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button type="button" className="fee-btn fee-btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="fee-btn fee-btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
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
          <FeeField label="Session" required>
            <FeeSelect
              value={form.session_id}
              onChange={(e) => setForm((f) => ({ ...f, session_id: e.target.value }))}
              options={(lookups?.sessions || []).map((s) => ({ value: s.id, label: s.title }))}
            />
          </FeeField>
          <FeeField label="Title" required>
            <FeeInput
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Academic Fees"
            />
          </FeeField>
          <FeeField label="Fee Section Print ID" hint="Select print sequence / voucher section">
            <FeeSelect
              value={form.fee_section_print_id}
              onChange={(e) => setForm((f) => ({ ...f, fee_section_print_id: e.target.value }))}
              options={[
                { value: "0", label: "0 — Default / None" },
                ...(lookups?.feeSectionPrints || []).map((p) => ({
                  value: p.id,
                  label: `#${p.id} — ${p.title}`,
                })),
              ]}
              placeholder="Select Fee Section Print ID"
            />
          </FeeField>
          <FeeField label="Status">
            <FeeSelect
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              options={[
                { value: "1", label: "Active" },
                { value: "0", label: "Inactive" },
              ]}
              placeholder="Status"
            />
          </FeeField>
        </div>
      </FeeModal>
    </div>
  );
};

/* ═══════════════════════ Fee Types ═══════════════════════ */
const TypesPanel: React.FC<{
  lookups: FeeLookups | null;
  branchFilter?: number;
  showAlert: (t: "success" | "error" | "info", m: string) => void;
  setConfirm: React.Dispatch<React.SetStateAction<ConfirmState>>;
  onChanged: () => void;
}> = ({ lookups, branchFilter, showAlert, setConfirm, onChanged }) => {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fee_head_title: "",
    fee_head_desc: "",
    fee_section_id: "",
    erp_fees_head_id: "",
    branch_id: "",
    session_id: "",
    program_id: "",
    class_id: "0",
    status: "1",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feeAPI.listHeads({
        branch_id: branchFilter,
        search: search || undefined,
        limit: 100,
      });
      setRows(res.data.data.items || []);
    } catch (err) {
      showAlert("error", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [branchFilter, search, showAlert]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      fee_head_title: "",
      fee_head_desc: "",
      fee_section_id: "",
      erp_fees_head_id: "",
      branch_id: String(branchFilter || lookups?.branches[0]?.id || ""),
      session_id: String(lookups?.sessions[0]?.id || ""),
      program_id: "",
      class_id: "0",
      status: "1",
    });
    setModalOpen(true);
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditing(row);
    setForm({
      fee_head_title: String(row.fee_head_title || ""),
      fee_head_desc: String(row.fee_head_desc || ""),
      fee_section_id: String(row.fee_section_id || ""),
      erp_fees_head_id: String(row.erp_fees_head_id || ""),
      branch_id: String(row.branch_id || ""),
      session_id: String(row.session_id || ""),
      program_id: String(row.program_id || ""),
      class_id: String(row.class_id ?? "0"),
      status: String(row.status ?? "1"),
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.fee_head_title.trim()) {
      showAlert("error", "Fee type title is required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        fee_head_title: form.fee_head_title.trim(),
        fee_head_desc: form.fee_head_desc || null,
        fee_section_id: form.fee_section_id ? Number(form.fee_section_id) : undefined,
        erp_fees_head_id: form.erp_fees_head_id ? Number(form.erp_fees_head_id) : null,
        branch_id: form.branch_id ? Number(form.branch_id) : undefined,
        session_id: form.session_id ? Number(form.session_id) : undefined,
        program_id: form.program_id ? Number(form.program_id) : undefined,
        class_id: Number(form.class_id || 0),
        erp_branch_id: form.branch_id ? Number(form.branch_id) : 0,
        status: Number(form.status),
      };
      if (editing) {
        await feeAPI.updateHead(Number(editing.id), body);
        showAlert("success", "Fee type updated");
      } else {
        await feeAPI.createHead(body);
        showAlert("success", "Fee type created");
      }
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
          <h3>Fee Types</h3>
          <p>Define charge types such as Tuition, Library, Lab, Transport, Hostel, Exam.</p>
        </div>
        <div className="fee-panel-actions">
          <FeeInput
            placeholder="Search fee types…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="button" className="fee-btn fee-btn-primary" onClick={openCreate}>
            + Add Fee Type
          </button>
        </div>
      </div>

      {lookups?.presets.feeTypeSuggestions?.length ? (
        <div className="fee-chip-row">
          {lookups.presets.feeTypeSuggestions.map((name) => (
            <button
              key={name}
              type="button"
              className="fee-chip"
              onClick={() => {
                openCreate();
                setForm((f) => ({ ...f, fee_head_title: name }));
              }}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}

      <FeeTable
        loading={loading}
        rows={rows}
        rowKey={(r) => Number(r.id)}
        emptyTitle="No fee types yet"
        emptyDescription="Create fee types before building structures."
        columns={[
          { key: "title", header: "Fee Type", render: (r) => String(r.fee_head_title || "—") },
          {
            key: "section",
            header: "Section",
            render: (r) => String(r.fee_section_title || "—"),
          },
          {
            key: "erp_head",
            header: "ERP Parent",
            render: (r) =>
              String(
                r.erp_fees_head_title ||
                  (r.erp_fees_head_id ? `#${r.erp_fees_head_id}` : "—")
              ),
          },
          { key: "desc", header: "Description", render: (r) => String(r.fee_head_desc || "—") },
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
                <button type="button" className="fee-link-btn" onClick={() => openEdit(r)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="fee-link-btn"
                  onClick={() =>
                    setConfirm({
                      open: true,
                      title: isActiveStatus(r.status) ? "Deactivate fee type" : "Activate fee type",
                      message: `Change status of “${r.fee_head_title}”?`,
                      onConfirm: async () => {
                        await feeAPI.toggleHead(
                          Number(r.id),
                          isActiveStatus(r.status) ? 0 : 1
                        );
                        showAlert("success", "Fee type status updated");
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
                      title: "Delete fee type",
                      message: `Delete “${r.fee_head_title}”? Blocked if used in structures.`,
                      danger: true,
                      onConfirm: async () => {
                        await feeAPI.deleteHead(Number(r.id));
                        showAlert("success", "Fee type deleted");
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
        title={editing ? "Edit Fee Type" : "Create Fee Type"}
        onClose={() => setModalOpen(false)}
        wide
        footer={
          <>
            <button type="button" className="fee-btn fee-btn-ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="button" className="fee-btn fee-btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      >
        <div className="fee-form-grid">
          <FeeField label="Title" required>
            <FeeInput
              value={form.fee_head_title}
              onChange={(e) => setForm((f) => ({ ...f, fee_head_title: e.target.value }))}
              placeholder="e.g. Tuition"
              list="fee-type-suggestions"
            />
            <datalist id="fee-type-suggestions">
              {(lookups?.presets.feeTypeSuggestions || []).map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </FeeField>
          <FeeField label="Section">
            <FeeSelect
              value={form.fee_section_id}
              onChange={(e) => setForm((f) => ({ ...f, fee_section_id: e.target.value }))}
              options={(lookups?.feeSections || []).map((s) => ({
                value: s.id,
                label: s.title,
              }))}
            />
          </FeeField>
          <FeeField label="ERP Fee Head (Parent)" hint="Parent category from erp_fee_head table">
            <FeeSelect
              value={form.erp_fees_head_id}
              onChange={(e) => setForm((f) => ({ ...f, erp_fees_head_id: e.target.value }))}
              options={[
                { value: "", label: "None / Not linked" },
                ...(lookups?.erpFeeHeads || []).map((h) => ({
                  value: h.id,
                  label: `#${h.id} — ${h.title}`,
                })),
              ]}
              placeholder="Select parent ERP fee head"
            />
          </FeeField>
          <FeeField label="Branch">
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
          <FeeField label="Program">
            <FeeSelect
              value={form.program_id}
              onChange={(e) => setForm((f) => ({ ...f, program_id: e.target.value }))}
              options={(lookups?.programs || []).map((p) => ({ value: p.id, label: p.name }))}
            />
          </FeeField>
          <FeeField label="Class" hint="Use 0 for global fee types">
            <FeeSelect
              value={form.class_id}
              onChange={(e) => setForm((f) => ({ ...f, class_id: e.target.value }))}
              options={[
                { value: 0, label: "Global (0)" },
                ...(lookups?.classes || []).map((c) => ({
                  value: c.id,
                  label: c.name,
                })),
              ]}
              placeholder="Class"
            />
          </FeeField>
          <FeeField label="Description">
            <FeeTextarea
              value={form.fee_head_desc}
              onChange={(e) => setForm((f) => ({ ...f, fee_head_desc: e.target.value }))}
              rows={3}
            />
          </FeeField>
          <FeeField label="Status">
            <FeeSelect
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              options={[
                { value: "1", label: "Active" },
                { value: "0", label: "Inactive" },
              ]}
              placeholder="Status"
            />
          </FeeField>
        </div>
      </FeeModal>
    </div>
  );
};

export default FeeModuleWorkspace;

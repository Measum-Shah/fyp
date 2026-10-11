import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import feeAPI from "../services/feeApi";
import type { FeeLookups } from "../hooks/useFeeLookups";
import { getErrorMessage } from "../hooks/useFeeLookups";
import { FeeField, FeeInput, FeeLoading, FeeSelect, FeeTable } from "./FeeUI";
import type { ConfirmState } from "./FeeModulePanels";
import { downloadFeeCsv, type FeeCsvColumn } from "../utils/feeCsvExport";
import "./ReportingAnalyticsPanel.css";

type PanelProps = {
  lookups: FeeLookups | null;
  branchFilter?: number;
  showAlert: (t: "success" | "error" | "info", m: string) => void;
  setConfirm: React.Dispatch<React.SetStateAction<ConfirmState>>;
  onChanged: () => void;
  teacherRestricted?: boolean;
};

type ReportTab =
  | "analytics"
  | "collections"
  | "outstanding"
  | "discounts"
  | "defaulters"
  | "audit";

type ReportFiltersState = {
  date_from: string;
  date_to: string;
  program_id: string;
  class_id: string;
  session_id: string;
  payment_mode: string;
  due_status: string;
  group_by: string;
  sort: string;
  search: string;
  action: string;
};

const money = (v: unknown) => `₨ ${Number(v || 0).toLocaleString()}`;

const ChartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const presetRange = (preset: string): { date_from: string; date_to: string } => {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const from = new Date(today);
  if (preset === "today") {
    /* keep from = today */
  } else if (preset === "week") {
    from.setDate(from.getDate() - 6);
  } else if (preset === "month") {
    from.setDate(1);
  } else if (preset === "year") {
    from.setMonth(0, 1);
  } else {
    return { date_from: "", date_to: "" };
  }
  return { date_from: from.toISOString().slice(0, 10), date_to: to };
};

const BarChart = ({
  items,
  labelKey,
  valueKey,
}: {
  items: Array<Record<string, unknown>>;
  labelKey: string;
  valueKey: string;
}) => {
  const max = Math.max(...items.map((i) => Number(i[valueKey] || 0)), 1);
  if (!items.length) {
    return <p className="fee-hint">No data for the selected filters.</p>;
  }
  return (
    <div className="fee-report-bar-list">
      {items.slice(0, 12).map((item, idx) => {
        const value = Number(item[valueKey] || 0);
        const pct = Math.max(2, Math.round((value / max) * 100));
        return (
          <div key={`${String(item[labelKey])}-${idx}`} className="fee-report-bar-row">
            <span className="fee-report-bar-label">{String(item[labelKey])}</span>
            <div className="fee-report-bar-track">
              <div className="fee-report-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="fee-report-bar-value">{money(value)}</span>
          </div>
        );
      })}
    </div>
  );
};

export const ReportingAnalyticsPanel: React.FC<PanelProps> = ({
  lookups,
  branchFilter,
  showAlert,
  teacherRestricted = false,
}) => {
  const defaultFilters = useMemo<ReportFiltersState>(
    () => ({
      date_from: "",
      date_to: "",
      program_id: "",
      class_id: "",
      session_id: "",
      payment_mode: "",
      due_status: "",
      group_by: "month",
      sort: "outstanding_desc",
      search: "",
      action: "",
    }),
    []
  );
  const [subTab, setSubTab] = useState<ReportTab>(
    teacherRestricted ? "outstanding" : "analytics"
  );
  const [loading, setLoading] = useState(false);
  const [tabPages, setTabPages] = useState<Record<ReportTab, number>>({
    analytics: 1,
    collections: 1,
    outstanding: 1,
    discounts: 1,
    defaulters: 1,
    audit: 1,
  });
  const [tabFilters, setTabFilters] = useState<Record<ReportTab, ReportFiltersState>>({
    analytics: { ...defaultFilters },
    collections: { ...defaultFilters, group_by: "month" },
    outstanding: { ...defaultFilters, sort: "outstanding_desc" },
    discounts: { ...defaultFilters },
    defaulters: { ...defaultFilters, sort: "overdue_desc" },
    audit: { ...defaultFilters },
  });

  const filters = tabFilters[subTab];
  const page = tabPages[subTab];

  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [collectionReport, setCollectionReport] = useState<Record<string, unknown> | null>(null);
  const [outstandingReport, setOutstandingReport] = useState<Record<string, unknown> | null>(null);
  const [discountReport, setDiscountReport] = useState<Record<string, unknown> | null>(null);
  const [defaultersReport, setDefaultersReport] = useState<Record<string, unknown> | null>(null);
  const [auditReport, setAuditReport] = useState<Record<string, unknown> | null>(null);

  const showAlertRef = useRef(showAlert);
  showAlertRef.current = showAlert;
  const initialLoad = useRef(false);

  const queryParams = useMemo(() => {
    const p: Record<string, string | number | undefined> = {
      branch_id: branchFilter,
      date_from: filters.date_from || undefined,
      date_to: filters.date_to || undefined,
      program_id: filters.program_id ? Number(filters.program_id) : undefined,
      class_id: filters.class_id ? Number(filters.class_id) : undefined,
      session_id: filters.session_id ? Number(filters.session_id) : undefined,
      payment_mode: filters.payment_mode || undefined,
      due_status: filters.due_status || undefined,
      group_by: filters.group_by || undefined,
      sort: filters.sort || undefined,
      search: filters.search || undefined,
      action: filters.action || undefined,
      page,
      limit: 50,
    };
    return p;
  }, [branchFilter, filters, page]);

  const loadActiveReport = useCallback(async () => {
    if (!initialLoad.current) setLoading(true);
    try {
      if (subTab === "analytics") {
        const res = await feeAPI.getReportingAnalytics(queryParams);
        setAnalytics(res.data.data as Record<string, unknown>);
      } else if (subTab === "collections") {
        const res = await feeAPI.getCollectionReport(queryParams);
        setCollectionReport(res.data.data as Record<string, unknown>);
      } else if (subTab === "outstanding") {
        const res = await feeAPI.getOutstandingDuesReport(queryParams);
        setOutstandingReport(res.data.data as Record<string, unknown>);
      } else if (subTab === "discounts") {
        const res = await feeAPI.getDiscountReport(queryParams);
        setDiscountReport(res.data.data as Record<string, unknown>);
      } else if (subTab === "defaulters") {
        const res = await feeAPI.getDefaultersReport(queryParams);
        setDefaultersReport(res.data.data as Record<string, unknown>);
      } else if (subTab === "audit") {
        const res = await feeAPI.getFeeAuditTrail(queryParams);
        setAuditReport(res.data.data as Record<string, unknown>);
      }
    } catch (err) {
      showAlertRef.current("error", getErrorMessage(err, "Failed to load report"));
    } finally {
      setLoading(false);
      initialLoad.current = true;
    }
  }, [subTab, queryParams]);

  useEffect(() => {
    loadActiveReport();
  }, [loadActiveReport]);

  useEffect(() => {
    setTabPages((prev) => ({ ...prev, [subTab]: 1 }));
  }, [
    subTab,
    branchFilter,
    filters.date_from,
    filters.date_to,
    filters.program_id,
    filters.class_id,
    filters.session_id,
    filters.payment_mode,
    filters.group_by,
    filters.sort,
    filters.search,
    filters.due_status,
    filters.action,
  ]);

  const updateFilters = useCallback(
    (updater: (current: ReportFiltersState) => ReportFiltersState) => {
      setTabFilters((prev) => ({
        ...prev,
        [subTab]: updater(prev[subTab]),
      }));
    },
    [subTab]
  );

  const setCurrentPage = useCallback(
    (updater: (current: number) => number) => {
      setTabPages((prev) => ({
        ...prev,
        [subTab]: updater(prev[subTab]),
      }));
    },
    [subTab]
  );

  const applyPreset = (preset: string) => {
    const range = presetRange(preset);
    updateFilters((f) => ({ ...f, ...range }));
  };

  const programOptions = useMemo(
    () =>
      (lookups?.programs || []).map((p) => ({
        value: String(p.id),
        label: p.name || `Program #${p.id}`,
      })),
    [lookups]
  );

  const classOptions = useMemo(
    () =>
      (lookups?.classes || []).map((c) => ({
        value: String(c.id),
        label: c.name || `Class #${c.id}`,
      })),
    [lookups]
  );

  const sessionOptions = useMemo(
    () =>
      (lookups?.sessions || []).map((s) => ({
        value: String(s.id),
        label: s.title || `Session #${s.id}`,
      })),
    [lookups]
  );

  const analyticsSummary = (analytics?.summary as Record<string, number>) || {};
  const collectionSummary =
    (collectionReport?.summary as Record<string, unknown>) || {};
  const outstandingSummary =
    (outstandingReport?.summary as Record<string, number>) || {};
  const discountSummary = (discountReport?.summary as Record<string, unknown>) || {};
  const defaultersSummary =
    (defaultersReport?.summary as Record<string, number>) || {};

  const exportCurrent = () => {
    let rows: Array<Record<string, unknown>> = [];
    let columns: FeeCsvColumn<Record<string, unknown>>[] = [];
    let filename = "fee-report";

    if (subTab === "collections") {
      rows = (collectionReport?.items as Array<Record<string, unknown>>) || [];
      filename = "fee-collections";
      columns = [
        { header: "Bill No", accessor: (r) => String(r.bill_no || "") },
        { header: "Student", accessor: (r) => String(r.student_name || "") },
        { header: "Reg No", accessor: (r) => String(r.reg_no || "") },
        { header: "Amount", accessor: (r) => Number(r.paid_amount || 0) },
        { header: "Fine", accessor: (r) => Number(r.fine || 0) },
        { header: "Mode", accessor: (r) => String(r.payment_mode || "") },
        { header: "Paid Date", accessor: (r) => String(r.paid_date || "") },
      ];
    } else if (subTab === "outstanding") {
      rows = (outstandingReport?.items as Array<Record<string, unknown>>) || [];
      filename = "fee-outstanding";
      columns = [
        { header: "Student", accessor: (r) => String(r.student_name || "") },
        { header: "Reg No", accessor: (r) => String(r.reg_no || "") },
        { header: "Bill No", accessor: (r) => String(r.bill_no || "") },
        { header: "Outstanding", accessor: (r) => Number(r.outstanding_amount || 0) },
        { header: "Late Fee", accessor: (r) => Number(r.late_fee || 0) },
        { header: "Due Date", accessor: (r) => String(r.due_date || "") },
        { header: "Days Overdue", accessor: (r) => Number(r.days_overdue || 0) },
        { header: "Status", accessor: (r) => String(r.payment_status || "") },
      ];
    } else if (subTab === "discounts") {
      rows = (discountReport?.items as Array<Record<string, unknown>>) || [];
      filename = "fee-discounts";
      columns = [
        { header: "Student", accessor: (r) => String(r.student_name || "") },
        { header: "Type", accessor: (r) => String(r.discount_type || "") },
        { header: "Original", accessor: (r) => Number(r.original_amount || 0) },
        { header: "Discount", accessor: (r) => Number(r.discount_amount || 0) },
        { header: "Final", accessor: (r) => Number(r.final_amount || 0) },
        { header: "Applied At", accessor: (r) => String(r.applied_at || "") },
      ];
    } else if (subTab === "defaulters") {
      rows = (defaultersReport?.items as Array<Record<string, unknown>>) || [];
      filename = "fee-defaulters";
      columns = [
        { header: "Student", accessor: (r) => String(r.student_name || "") },
        { header: "Reg No", accessor: (r) => String(r.reg_no || "") },
        { header: "Outstanding", accessor: (r) => Number(r.outstanding_amount || 0) },
        { header: "Late Fee", accessor: (r) => Number(r.late_fee || 0) },
        { header: "Total Due", accessor: (r) => Number(r.total_amount_due || 0) },
        { header: "Days Overdue", accessor: (r) => Number(r.days_overdue || 0) },
        { header: "Due Date", accessor: (r) => String(r.due_date || "") },
      ];
    } else if (subTab === "audit") {
      rows = (auditReport?.items as Array<Record<string, unknown>>) || [];
      filename = "fee-audit-trail";
      columns = [
        { header: "Date", accessor: (r) => String(r.created_at || "") },
        { header: "User", accessor: (r) => String(r.user_name || "") },
        { header: "Action", accessor: (r) => String(r.action || "") },
        { header: "Record Type", accessor: (r) => String(r.record_type || "") },
        { header: "Description", accessor: (r) => String(r.description || "") },
        { header: "Endpoint", accessor: (r) => String(r.endpoint || "") },
      ];
    } else {
      showAlert("info", "Export is available for table reports (Collections, Outstanding, Discounts, Defaulters, Audit).");
      return;
    }

    if (!rows.length) {
      showAlert("info", "No rows to export for the current filters.");
      return;
    }
    downloadFeeCsv(rows, columns, `${filename}-${new Date().toISOString().slice(0, 10)}`);
    showAlert("success", "CSV exported");
  };

  const pagination =
    ((subTab === "collections"
      ? collectionReport?.pagination
      : subTab === "outstanding"
        ? outstandingReport?.pagination
        : subTab === "discounts"
          ? discountReport?.pagination
          : subTab === "defaulters"
            ? defaultersReport?.pagination
            : auditReport?.pagination) as
      | { page: number; pages: number; total: number }
      | undefined) || { page: 1, pages: 1, total: 0 };

  if (loading && !initialLoad.current) {
    return <FeeLoading label="Loading reporting & analytics…" />;
  }

  return (
    <div className="fee-panel fee-report-panel">
      <header className="fee-report-header">
        <div>
          <div className="fee-report-title-row">
            <span className="fee-report-icon">
              <ChartIcon />
            </span>
            <h3>Reporting & Analytics</h3>
          </div>
          <p className="fee-report-desc">
            Collection, outstanding, discount, defaulter, and audit reports built from live Fee
            Management Modules 1–6 data.
          </p>
        </div>
      </header>

      <nav className="fee-report-tabs-row" aria-label="Report sections">
        <div className="fee-segment">
          {(
            (
              teacherRestricted
                ? [
                    ["outstanding", "Outstanding"],
                    ["defaulters", "Defaulters"],
                  ]
                : [
                    ["analytics", "Analytics"],
                    ["collections", "Collections"],
                    ["outstanding", "Outstanding"],
                    ["discounts", "Discounts"],
                    ["defaulters", "Defaulters"],
                    ["audit", "Audit Trail"],
                  ]
            ) as Array<[ReportTab, string]>
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
      </nav>

      <div className="fee-report-filters">
        <FeeField label="From">
          <FeeInput
            type="date"
            value={filters.date_from}
            onChange={(e) => updateFilters((f) => ({ ...f, date_from: e.target.value }))}
          />
        </FeeField>
        <FeeField label="To">
          <FeeInput
            type="date"
            value={filters.date_to}
            onChange={(e) => updateFilters((f) => ({ ...f, date_to: e.target.value }))}
          />
        </FeeField>
        <FeeField label="Session">
          <FeeSelect
            value={filters.session_id}
            onChange={(e) => updateFilters((f) => ({ ...f, session_id: e.target.value }))}
            options={sessionOptions}
            placeholder="All sessions"
          />
        </FeeField>
        <FeeField label="Program">
          <FeeSelect
            value={filters.program_id}
            onChange={(e) => updateFilters((f) => ({ ...f, program_id: e.target.value }))}
            options={programOptions}
            placeholder="All programs"
          />
        </FeeField>
        <FeeField label="Class">
          <FeeSelect
            value={filters.class_id}
            onChange={(e) => updateFilters((f) => ({ ...f, class_id: e.target.value }))}
            options={classOptions}
            placeholder="All classes"
          />
        </FeeField>
        {(subTab === "collections" || subTab === "analytics") && (
          <FeeField label="Payment mode">
            <FeeInput
              value={filters.payment_mode}
              onChange={(e) => updateFilters((f) => ({ ...f, payment_mode: e.target.value }))}
              placeholder="Cash, Stripe…"
            />
          </FeeField>
        )}
        {subTab === "collections" && (
          <FeeField label="Group by">
            <FeeSelect
              value={filters.group_by}
              onChange={(e) => updateFilters((f) => ({ ...f, group_by: e.target.value }))}
              options={[
                { value: "day", label: "Daily" },
                { value: "month", label: "Monthly" },
                { value: "year", label: "Yearly" },
              ]}
              placeholder="Group by"
            />
          </FeeField>
        )}
        {(subTab === "outstanding" || subTab === "defaulters") && (
          <FeeField label="Sort">
            <FeeSelect
              value={filters.sort}
              onChange={(e) => updateFilters((f) => ({ ...f, sort: e.target.value }))}
              options={[
                { value: "outstanding_desc", label: "Highest outstanding" },
                { value: "overdue_desc", label: "Most overdue" },
                { value: "due_date_asc", label: "Oldest due date" },
                { value: "name_asc", label: "Student name" },
              ]}
              placeholder="Sort"
            />
          </FeeField>
        )}
        {(subTab === "outstanding" || subTab === "defaulters" || subTab === "audit") && (
          <FeeField label="Search">
            <FeeInput
              value={filters.search}
              onChange={(e) => updateFilters((f) => ({ ...f, search: e.target.value }))}
              placeholder="Name / reg no"
            />
          </FeeField>
        )}
        <div className="fee-report-filter-actions">
          <button type="button" className="fee-btn fee-btn-ghost" onClick={() => applyPreset("today")}>
            Today
          </button>
          <button type="button" className="fee-btn fee-btn-ghost" onClick={() => applyPreset("week")}>
            This week
          </button>
          <button type="button" className="fee-btn fee-btn-ghost" onClick={() => applyPreset("month")}>
            This month
          </button>
          <button type="button" className="fee-btn fee-btn-ghost" onClick={() => applyPreset("year")}>
            This year
          </button>
          <button type="button" className="fee-btn fee-btn-primary" onClick={loadActiveReport}>
            Apply
          </button>
        </div>
      </div>

      <div className="fee-report-toolbar">
        <div className="fee-report-toolbar-left">
          <span className="fee-hint">
            Branch filter uses the workspace campus selector
            {branchFilter ? ` (#${branchFilter})` : " (all branches)"}.
          </span>
        </div>
        <div className="fee-report-toolbar-right">
          <button type="button" className="fee-btn fee-btn-ghost" onClick={() => window.print()}>
            Print
          </button>
          <button type="button" className="fee-btn fee-btn-ghost" onClick={exportCurrent}>
            Export CSV
          </button>
          <button type="button" className="fee-btn fee-btn-ghost" onClick={loadActiveReport} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      {loading && <FeeLoading label="Refreshing report…" />}

      {!loading && subTab === "analytics" && analytics && (
        <>
          <div className="fee-report-stat-grid">
            {[
              { label: "Total Collected", value: money(analyticsSummary.total_collected) },
              { label: "Total Outstanding", value: money(analyticsSummary.total_outstanding) },
              { label: "Total Overdue", value: money(analyticsSummary.total_overdue) },
              { label: "Total Late Fees", value: money(analyticsSummary.total_late_fees) },
              { label: "Total Discounts", value: money(analyticsSummary.total_discounts) },
              { label: "Paid Students", value: analyticsSummary.paid_students ?? 0 },
              { label: "Partial Students", value: analyticsSummary.partial_students ?? 0 },
              { label: "Overdue Students", value: analyticsSummary.overdue_students ?? 0 },
            ].map((card) => (
              <div key={card.label} className="fee-report-stat">
                <span className="fee-report-stat-value">{card.value}</span>
                <span className="fee-report-stat-label">{card.label}</span>
              </div>
            ))}
          </div>

          <div className="fee-report-chart-grid">
            <div className="fee-report-chart-card">
              <h4>Collection trend</h4>
              <BarChart
                items={(analytics.collection_trend as Array<Record<string, unknown>>) || []}
                labelKey="period"
                valueKey="amount"
              />
            </div>
            <div className="fee-report-chart-card">
              <h4>Payment mode distribution</h4>
              <BarChart
                items={(analytics.payment_mode_distribution as Array<Record<string, unknown>>) || []}
                labelKey="mode"
                valueKey="amount"
              />
            </div>
            <div className="fee-report-chart-card">
              <h4>Collected vs outstanding</h4>
              <BarChart
                items={(analytics.paid_vs_outstanding as Array<Record<string, unknown>>) || []}
                labelKey="label"
                valueKey="amount"
              />
            </div>
          </div>
        </>
      )}

      {!loading && subTab === "collections" && collectionReport && (
        <>
          <div className="fee-report-stat-grid">
            <div className="fee-report-stat">
              <span className="fee-report-stat-value">{Number(collectionSummary.payment_count || 0)}</span>
              <span className="fee-report-stat-label">Payments</span>
            </div>
            <div className="fee-report-stat">
              <span className="fee-report-stat-value">{money(collectionSummary.total_collected)}</span>
              <span className="fee-report-stat-label">Total Collected</span>
            </div>
            <div className="fee-report-stat">
              <span className="fee-report-stat-value">{money(collectionSummary.total_fine)}</span>
              <span className="fee-report-stat-label">Late Fee Collected</span>
            </div>
            <div className="fee-report-stat">
              <span className="fee-report-stat-value">{money(collectionSummary.net_collection)}</span>
              <span className="fee-report-stat-label">Net Collection</span>
            </div>
          </div>
          <div className="fee-report-chart-card" style={{ marginBottom: "1rem" }}>
            <h4>By payment mode</h4>
            <BarChart
              items={(collectionSummary.by_mode as Array<Record<string, unknown>>) || []}
              labelKey="mode"
              valueKey="amount"
            />
          </div>
          <div className="fee-report-chart-card" style={{ marginBottom: "1rem" }}>
            <h4>
              {filters.group_by === "day"
                ? "Daily"
                : filters.group_by === "year"
                  ? "Yearly"
                  : "Monthly"}{" "}
              summary
            </h4>
            <BarChart
              items={(collectionReport.periods as Array<Record<string, unknown>>) || []}
              labelKey="period"
              valueKey="amount"
            />
          </div>
          <FeeTable
            columns={[
              { key: "bill", header: "Bill / Voucher", render: (r) => String(r.bill_no || r.voucher_sequence || "—") },
              { key: "student", header: "Student", render: (r) => `${r.student_name}${r.reg_no ? ` (${r.reg_no})` : ""}` },
              { key: "amount", header: "Amount", render: (r) => money(r.paid_amount) },
              { key: "fine", header: "Fine", render: (r) => money(r.fine) },
              { key: "mode", header: "Mode", render: (r) => String(r.payment_mode || "—") },
              { key: "date", header: "Paid Date", render: (r) => String(r.paid_date || "—") },
            ]}
            rows={(collectionReport.items as Array<Record<string, unknown>>) || []}
            rowKey={(r) => Number(r.id)}
            emptyTitle="No collections found"
            emptyDescription="Adjust filters or record payments in Payment Processing."
          />
        </>
      )}

      {!loading && subTab === "outstanding" && outstandingReport && (
        <>
          <div className="fee-report-stat-grid">
            <div className="fee-report-stat">
              <span className="fee-report-stat-value">{outstandingSummary.statement_count ?? 0}</span>
              <span className="fee-report-stat-label">Statements</span>
            </div>
            <div className="fee-report-stat">
              <span className="fee-report-stat-value">{money(outstandingSummary.total_outstanding)}</span>
              <span className="fee-report-stat-label">Outstanding</span>
            </div>
            <div className="fee-report-stat">
              <span className="fee-report-stat-value">{money(outstandingSummary.total_late_fees)}</span>
              <span className="fee-report-stat-label">Late Fees</span>
            </div>
            <div className="fee-report-stat">
              <span className="fee-report-stat-value">{money(outstandingSummary.total_amount_due)}</span>
              <span className="fee-report-stat-label">Total Due</span>
            </div>
          </div>
          <FeeTable
            columns={[
              { key: "student", header: "Student", render: (r) => `${r.student_name}${r.reg_no ? ` (${r.reg_no})` : ""}` },
              { key: "bill", header: "Invoice", render: (r) => String(r.bill_no || "—") },
              { key: "original", header: "Original", render: (r) => money(r.original_amount) },
              { key: "discount", header: "Discount", render: (r) => money(r.discount_amount) },
              { key: "paid", header: "Paid", render: (r) => money(r.paid_amount) },
              { key: "out", header: "Outstanding", render: (r) => money(r.outstanding_amount) },
              { key: "due", header: "Due Date", render: (r) => String(r.due_date || "—") },
              { key: "days", header: "Days Overdue", render: (r) => String(r.days_overdue ?? 0) },
              { key: "grace", header: "Grace", render: (r) => String(r.grace_period_days ?? 0) },
              { key: "late", header: "Late Fee", render: (r) => money(r.late_fee) },
              { key: "total", header: "Total Due", render: (r) => money(r.total_due) },
              { key: "status", header: "Status", render: (r) => String(r.payment_status || "—") },
            ]}
            rows={(outstandingReport.items as Array<Record<string, unknown>>) || []}
            rowKey={(r) => Number(r.fee_master_basic_id)}
            emptyTitle="No outstanding dues"
            emptyDescription="All filtered fee statements are fully paid."
          />
        </>
      )}

      {!loading && subTab === "discounts" && discountReport && (
        <>
          <div className="fee-report-stat-grid">
            <div className="fee-report-stat">
              <span className="fee-report-stat-value">{money(discountSummary.total_discount_amount)}</span>
              <span className="fee-report-stat-label">Total Discounts</span>
            </div>
            <div className="fee-report-stat">
              <span className="fee-report-stat-value">{Number(discountSummary.students_with_discount || 0)}</span>
              <span className="fee-report-stat-label">Students</span>
            </div>
            <div className="fee-report-stat">
              <span className="fee-report-stat-value">{Number(discountSummary.record_count || 0)}</span>
              <span className="fee-report-stat-label">Records</span>
            </div>
          </div>
          <div className="fee-report-chart-card" style={{ marginBottom: "1rem" }}>
            <h4>Discount by type</h4>
            <BarChart
              items={(discountSummary.by_type as Array<Record<string, unknown>>) || []}
              labelKey="type"
              valueKey="amount"
            />
          </div>
          <FeeTable
            columns={[
              { key: "student", header: "Student", render: (r) => String(r.student_name || "—") },
              { key: "bill", header: "Fee / Bill", render: (r) => String(r.bill_no || "—") },
              { key: "type", header: "Type", render: (r) => String(r.discount_type || "—") },
              { key: "orig", header: "Original", render: (r) => money(r.original_amount) },
              { key: "disc", header: "Discount", render: (r) => `${money(r.discount_amount)} (${r.discount_percentage}%)` },
              { key: "final", header: "Final", render: (r) => money(r.final_amount) },
              {
                key: "date",
                header: "Applied",
                render: (r) => String(r.applied_at || "").slice(0, 19).replace("T", " ") || "—",
              },
              { key: "status", header: "Status", render: (r) => String(r.status || "—") },
            ]}
            rows={(discountReport.items as Array<Record<string, unknown>>) || []}
            rowKey={(r) => Number(r.fee_master_basic_id)}
            emptyTitle="No discounts found"
            emptyDescription="Apply discounts in Discounts & Concessions to populate this report."
          />
        </>
      )}

      {!loading && subTab === "defaulters" && defaultersReport && (
        <>
          <div className="fee-report-stat-grid">
            <div className="fee-report-stat">
              <span className="fee-report-stat-value">{defaultersSummary.defaulter_count ?? 0}</span>
              <span className="fee-report-stat-label">Defaulters</span>
            </div>
            <div className="fee-report-stat">
              <span className="fee-report-stat-value">{money(defaultersSummary.total_outstanding)}</span>
              <span className="fee-report-stat-label">Outstanding</span>
            </div>
            <div className="fee-report-stat">
              <span className="fee-report-stat-value">{money(defaultersSummary.total_late_fees)}</span>
              <span className="fee-report-stat-label">Late Fees</span>
            </div>
            <div className="fee-report-stat">
              <span className="fee-report-stat-value">{money(defaultersSummary.total_amount_due)}</span>
              <span className="fee-report-stat-label">Total Amount Due</span>
            </div>
          </div>
          <FeeTable
            columns={[
              { key: "student", header: "Student", render: (r) => `${r.student_name}${r.reg_no ? ` (${r.reg_no})` : ""}` },
              { key: "bill", header: "Invoice", render: (r) => String(r.bill_no || "—") },
              { key: "orig", header: "Original", render: (r) => money(r.original_amount) },
              { key: "paid", header: "Paid", render: (r) => money(r.paid_amount) },
              { key: "out", header: "Outstanding", render: (r) => money(r.outstanding_amount) },
              { key: "due", header: "Due Date", render: (r) => String(r.due_date || "—") },
              { key: "grace", header: "Grace Days", render: (r) => String(r.grace_period_days ?? 0) },
              { key: "days", header: "Days Overdue", render: (r) => String(r.days_overdue ?? 0) },
              { key: "late", header: "Late Fee", render: (r) => money(r.late_fee) },
              { key: "total", header: "Total Due", render: (r) => money(r.total_amount_due) },
              { key: "last", header: "Last Payment", render: (r) => String(r.last_payment_date || "—") },
              { key: "status", header: "Status", render: (r) => String(r.status || "—") },
            ]}
            rows={(defaultersReport.items as Array<Record<string, unknown>>) || []}
            rowKey={(r) => Number(r.fee_master_basic_id)}
            emptyTitle="No defaulters"
            emptyDescription="No students are past grace period with outstanding balances."
          />
        </>
      )}

      {!loading && subTab === "audit" && auditReport && (
        <>
          <p className="fee-hint" style={{ marginBottom: "0.75rem" }}>
            Read-only Fee Management audit trail from existing <code>erp_activity_logs</code>. Mutating Fee
            Management API actions are logged automatically.
          </p>
          <FeeTable
            columns={[
              {
                key: "date",
                header: "Timestamp",
                render: (r) => String(r.created_at || "").slice(0, 19).replace("T", " "),
              },
              { key: "user", header: "User", render: (r) => String(r.user_name || r.user_id || "—") },
              { key: "action", header: "Action", render: (r) => String(r.action || "—") },
              { key: "type", header: "Record Type", render: (r) => String(r.record_type || "—") },
              { key: "id", header: "Record ID", render: (r) => String(r.record_id || "—") },
              { key: "desc", header: "Description", render: (r) => String(r.description || "—") },
              { key: "ip", header: "IP", render: (r) => String(r.ip_address || "—") },
              { key: "method", header: "Method", render: (r) => String(r.request_method || "—") },
              { key: "endpoint", header: "Endpoint", render: (r) => String(r.endpoint || "—") },
            ]}
            rows={(auditReport.items as Array<Record<string, unknown>>) || []}
            rowKey={(r) => String(r.id)}
            emptyTitle="No audit entries yet"
            emptyDescription="Fee Management create/update/payment actions will appear here after they are performed."
          />
        </>
      )}

      {subTab !== "analytics" && (
        <div className="fee-report-pagination">
          <span>
            Page {pagination.page} of {pagination.pages} · {pagination.total} rows
          </span>
          <button
            type="button"
            className="fee-btn fee-btn-ghost"
            disabled={page <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            className="fee-btn fee-btn-ghost"
            disabled={page >= (pagination.pages || 1)}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

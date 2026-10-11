import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDashboardKpis, seedChartOfAccountsApi, seedCashBankApi } from "../services/accounts.service";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const userName = (() => {
  try {
    const raw = localStorage.getItem("erp_user");
    if (raw && raw !== "undefined") return JSON.parse(raw).name?.split(" ")[0] || "Finance";
  } catch { /* noop */ }
  return "Finance";
})();

const KPICard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  color: "blue" | "green" | "gold" | "purple" | "red";
  icon: React.ReactNode;
}> = ({ label, value, sub, color, icon }) => (
  <div className="stat-card">
    <div className="stat-header">
      <div className={`stat-icon stat-icon-${color}`}>{icon}</div>
      {sub && <span className="stat-change">{sub}</span>}
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const IconMoney = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);
const IconExpense = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><path d="M16 8l-4 4-4-4" />
  </svg>
);
const IconProfit = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
);
const IconCash = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const IconAR = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);
const IconAP = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);
const IconOverdue = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const IconSeeds = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const fmt = (n: number | undefined) => {
  if (!n) return "PKR 0";
  return `PKR ${Number(n).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
};

export const AccountsDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"success" | "error">("success");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchDashboardKpis();
      if (res.success) setKpis(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSeedDefaults = async () => {
    try {
      setSeeding(true);
      await seedChartOfAccountsApi();
      await seedCashBankApi();
      setMsgType("success");
      setMessage("✅ Default Chart of Accounts & Cash/Bank Accounts initialized successfully!");
      await loadData();
    } catch (e: any) {
      setMsgType("error");
      setMessage("❌ Seeding error: " + (e.message || "Failed"));
    } finally {
      setSeeding(false);
    }
  };

  const activities = [
    { text: "Journal Entry JE-2026-001 posted to General Ledger", time: "5 min ago", type: "success" },
    { text: "Vendor Bill BILL-2026-042 awaiting approval (PKR 180,000)", time: "18 min ago", type: "info" },
    { text: "Customer Invoice INV-2026-088 marked as paid", time: "1 hour ago", type: "success" },
    { text: "Bank reconciliation completed for July 2026", time: "3 hours ago", type: "info" },
    { text: "Monthly depreciation run completed — 12 assets", time: "Yesterday", type: "info" },
  ];

  const quickLinks = [
    { label: "New Journal Entry", path: "/accounts/journals", color: "blue" },
    { label: "Create Invoice", path: "/accounts/receivables", color: "green" },
    { label: "Record Payment", path: "/accounts/payables", color: "gold" },
    { label: "View Reports", path: "/accounts/financial-reports", color: "purple" },
  ];

  return (
    <div>
      {/* ══ Welcome Banner ══════════════════════════════════════════════════════ */}
      <section className="welcome-banner">
        <div className="welcome-content">
          <h2 className="welcome-greeting">
            {greeting()}, <span>{userName}</span> 👋
          </h2>
          <p className="welcome-text">
            Here's your Accounts & Finance module overview. Monitor your General Ledger,
            receivables, payables and financial health in real-time.
          </p>
          <div style={{ marginTop: "1.25rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              onClick={handleSeedDefaults}
              disabled={seeding}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                padding: "0.6rem 1.2rem", background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px",
                color: "#fff", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", transition: "all 0.2s ease", opacity: seeding ? 0.6 : 1,
              }}
            >
              <IconSeeds /> {seeding ? "Initializing..." : "Seed Default COA & Accounts"}
            </button>
          </div>
        </div>
        <div className="welcome-visual">
          <div className="welcome-circle welcome-circle-1" />
          <div className="welcome-circle welcome-circle-2" />
          <div className="welcome-circle welcome-circle-3" />
        </div>
      </section>

      {message && (
        <div style={{ margin: "0 2rem", marginTop: "1rem" }}>
          <div className={`alert ${msgType === "success" ? "alert-success" : "alert-error"}`}>
            {message}
          </div>
        </div>
      )}

      {/* ══ KPI Cards ═══════════════════════════════════════════════════════════ */}
      <section className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <KPICard label="Total Revenue" value={loading ? "—" : fmt(kpis?.totalRevenue)} color="green" icon={<IconMoney />} />
        <KPICard label="Total Expenses" value={loading ? "—" : fmt(kpis?.totalExpenses)} color="red" icon={<IconExpense />} />
        <KPICard label="Net Profit / Loss" value={loading ? "—" : fmt(kpis?.netProfit)} color="blue" icon={<IconProfit />} />
        <KPICard label="Cash & Bank" value={loading ? "—" : fmt(kpis?.totalCashAndBank)} color="gold" icon={<IconCash />} />
        <KPICard label="Accounts Receivable" value={loading ? "—" : fmt(kpis?.accountsReceivable)} color="blue" icon={<IconAR />} />
        <KPICard label="Accounts Payable" value={loading ? "—" : fmt(kpis?.accountsPayable)} color="purple" icon={<IconAP />} />
        <KPICard label="Overdue Receivables" value={loading ? "—" : fmt(kpis?.overdueReceivables ?? 0)} color="red" icon={<IconOverdue />} />
      </section>

      {/* ══ Quick Links + Activity Feed ════════════════════════════════════════ */}
      <div className="panels-grid">
        {/* Activity Feed */}
        <section className="panel-card">
          <div className="panel-card-header">
            <h3>Recent Activity</h3>
            <a href="#" className="panel-view-all">View All</a>
          </div>
          <div className="activity-list">
            {activities.map((a, i) => (
              <div key={i} className="activity-item">
                <div className={`activity-dot activity-dot-${a.type}`} />
                <div className="activity-content">
                  <p className="activity-text">{a.text}</p>
                  <span className="activity-time">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="panel-card">
          <div className="panel-card-header">
            <h3>Quick Actions</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {quickLinks.map((q, i) => (
              <button
                key={i}
                onClick={() => navigate(q.path)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0.85rem 1rem",
                  background: "var(--input-bg)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "10px", color: "var(--text-dark)",
                  fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
                  fontFamily: "inherit", transition: "all 0.2s ease", textAlign: "left",
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--card-border)")}
              >
                <span>{q.label}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))}
          </div>

          {/* AR vs AP Summary */}
          <div style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--input-bg)", borderRadius: "10px", border: "1px solid var(--card-border)" }}>
            <h4 style={{ fontSize: "0.8rem", color: "var(--text-dark-sub)", fontWeight: 600, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              AR vs AP Balance
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-dark-sub)" }}>Receivables</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#22c55e" }}>{loading ? "—" : fmt(kpis?.accountsReceivable)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-dark-sub)" }}>Payables</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f59e0b" }}>{loading ? "—" : fmt(kpis?.accountsPayable)}</span>
              </div>
              <div style={{ borderTop: "1px solid var(--divider-color)", paddingTop: "0.6rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-dark)" }}>Net Position</span>
                <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--accent)" }}>
                  {loading ? "—" : fmt((kpis?.accountsReceivable ?? 0) - (kpis?.accountsPayable ?? 0))}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { GlobalTopNav } from "../../../components/common/GlobalTopNav";

const IconChevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconBack = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const NAV_ITEMS = [
  {
    path: "/accounts/dashboard",
    label: "Dashboard & KPIs",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    path: "/accounts/chart-of-accounts",
    label: "Chart of Accounts",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
  },
  {
    path: "/accounts/journals",
    label: "Journal Entries",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    path: "/accounts/ledger",
    label: "General Ledger",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
  },
  {
    path: "/accounts/payables",
    label: "Accounts Payable",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    path: "/accounts/receivables",
    label: "Accounts Receivable",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    path: "/accounts/cash-bank",
    label: "Cash & Bank",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    path: "/accounts/expenses",
    label: "Expense Tracking",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21.21 15.89A10 10 0 118 2.83" />
        <path d="M22 12A10 10 0 0012 2v10z" />
      </svg>
    ),
  },
  {
    path: "/accounts/fixed-assets",
    label: "Fixed Assets",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    path: "/accounts/financial-reports",
    label: "Financial Statements",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    path: "/accounts/period-closing",
    label: "Closing & Controls",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
  },
  {
    path: "/accounts/credit-debit-notes",
    label: "Credit & Debit Notes",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    path: "/accounts/vouchers",
    label: "Voucher Entry",
    section: "Accounts Management",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    path: "/accounts/voucher-templates",
    label: "Voucher Templates",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
  },
  {
    path: "/accounts/credit-debit-notes",
    label: "Credit & Debit Notes",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    path: "/accounts/ledger-statement",
    label: "Ledger Statement",
    section: "A/C Reports",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
  },
  {
    path: "/accounts/vendor-ledger",
    label: "Vendor Ledger",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    path: "/accounts/financial-reports",
    label: "Financial Statements",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    path: "/accounts/period-closing",
    label: "Closing & Controls",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
    ),
  },
];

// Group nav items by section
const NAV_SECTIONS = [
  {
    label: "Overview",
    items: NAV_ITEMS.filter((i) => ["/accounts/dashboard"].includes(i.path)),
  },
  {
    label: "Accounts Management",
    items: NAV_ITEMS.filter((i) =>
      ["/accounts/chart-of-accounts", "/accounts/journals", "/accounts/ledger",
        "/accounts/vouchers", "/accounts/voucher-templates", "/accounts/payables",
        "/accounts/receivables", "/accounts/cash-bank", "/accounts/expenses",
        "/accounts/fixed-assets", "/accounts/credit-debit-notes"].includes(i.path)
    ),
  },
  {
    label: "A/C Reports",
    items: NAV_ITEMS.filter((i) =>
      ["/accounts/ledger-statement", "/accounts/vendor-ledger",
        "/accounts/financial-reports", "/accounts/period-closing"].includes(i.path)
    ),
  },
];

export const AccountsLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    window.location.href = "/";
  };

  const getBreadcrumbs = () => {
    const segments = location.pathname.split("/").filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join("/")}`;
      let label = segment.charAt(0).toUpperCase() + segment.slice(1);
      if (segment === "accounts") label = "Accounts";
      if (segment === "dashboard") label = "Dashboard & KPIs";
      if (segment === "chart-of-accounts") label = "Chart of Accounts";
      if (segment === "journals") label = "Journal Entries";
      if (segment === "ledger") label = "General Ledger";
      if (segment === "payables") label = "Accounts Payable";
      if (segment === "receivables") label = "Accounts Receivable";
      if (segment === "cash-bank") label = "Cash & Bank";
      if (segment === "expenses") label = "Expense Tracking";
      if (segment === "fixed-assets") label = "Fixed Assets";
      if (segment === "financial-reports") label = "Financial Statements";
      if (segment === "period-closing") label = "Closing & Controls";
      if (segment === "credit-debit-notes") label = "Credit & Debit Notes";
      if (segment === "vouchers") label = "Voucher Entry";
      if (segment === "voucher-templates") label = "Voucher Templates";
      if (segment === "ledger-statement") label = "Ledger Statement";
      if (segment === "vendor-ledger") label = "Vendor Ledger";
      return { path, label };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="home-root">
      {/* ═══ Sidebar ═══════════════════════════════════════════════════════════ */}
      <aside className={`sidebar ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div>
                <div className="sidebar-brand-name">TechRive ERP</div>
                <div className="sidebar-brand-sub">Accounts & Finance</div>
              </div>
            )}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle sidebar"
          >
            <IconChevron />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {!sidebarCollapsed && (
                <div style={{
                  padding: "0.5rem 1rem 0.25rem",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.35)",
                  marginTop: "0.5rem",
                }}>
                  {section.label}
                </div>
              )}
              {section.items.map((item, i) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                return (
                  <Link
                    key={i}
                    to={item.path}
                    className={`sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <span className="sidebar-link-icon">{item.icon}</span>
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="sidebar-logout-btn"
            onClick={() => navigate("/dashboard")}
            style={{ marginBottom: "6px", background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)" }}
          >
            <IconBack />
            {!sidebarCollapsed && <span>Back to ERP</span>}
          </button>
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <IconLogout />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ═══ Main Content Area ═════════════════════════════════════════════════ */}
      <main className="home-main">
        {/* Topbar */}
        <GlobalTopNav breadcrumbs={breadcrumbs} />

        {/* Page Content Outlet */}
        <div style={{ padding: "1.5rem" }}>
          <React.Suspense
            fallback={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
                <div style={{ width: "32px", height: "32px", border: "3px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            }
          >
            <Outlet />
          </React.Suspense>
        </div>
      </main>
    </div>
  );
};

export default AccountsLayout;

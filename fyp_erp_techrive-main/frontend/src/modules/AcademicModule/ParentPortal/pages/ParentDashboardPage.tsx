import React, { useState, useEffect } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { GlobalTopNav } from "../../../../components/common/GlobalTopNav";
import { parentService } from "../services/parentService";

/* ── SVG Icons ──────────────────────────────────────────────────────────────── */
const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconBook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const IconBarChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const IconTrendingUp = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
  </svg>
);

const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconChevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const IconIdCard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

const IconGraduationCap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IconCheckCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconInfo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const NAV_ITEMS = [
  { path:"/parent/dashboard",          icon: <IconDashboard />,   label:"Dashboard" },
  { path:"/parent/student",            icon: <IconUser />,        label:"Student Info" },
  { path:"/parent/courses",            icon: <IconBook />,        label:"Courses" },
  { path:"/parent/results",            icon: <IconBarChart />,    label:"Results" },
  { path:"/parent/progress",           icon: <IconTrendingUp />,  label:"Progress" },
  { path:"/parent/teachers",           icon: <IconUsers />,       label:"Teachers" },
  { path:"/parent/academic-calendar",  icon: <IconCalendar />,    label:"Calendar" },
];

const ParentLayout: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [user, setUser] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("erp_token");  // only erp_token — parent logs in via main login
    if (!token) { navigate("/parent/login"); return; }
    // Support both parent_token (from /parent/login) and erp_token (from main login)
    const u = localStorage.getItem("erp_user");
    if (u) {
      const parsed = JSON.parse(u);
      // If logged in via main login, verify user_type is parent
      if (parsed.user_type && parsed.user_type !== "parent") {
        navigate("/dashboard"); return;
      }
      setUser(parsed);
    }
    parentService.getStudentInfo().then(res => { if (res.success) setStudent(res.data); }).catch(() => {});
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    localStorage.removeItem("parent_token"); // legacy cleanup
    localStorage.removeItem("parent_user");  // legacy cleanup
    navigate("/parent/login");
  };

  // Build breadcrumb based on current path
  const getBreadcrumbLabel = () => {
    const segment = location.pathname.split("/").pop();
    const match = NAV_ITEMS.find(item => item.path === location.pathname);
    return match?.label || segment || "Dashboard";
  };

  return (
    <div className="home-root">
      {/* ═══ Sidebar ═══════════════════════════════════════════════════════════ */}
      <aside className={`sidebar ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div>
                <div className="sidebar-brand-name">Parent Portal</div>
                <div className="sidebar-brand-sub">
                  {student ? `Viewing: ${student.full_name}` : "TechRive ERP"}
                </div>
              </div>
            )}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <IconChevron />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item, i) => {
            const isActive = location.pathname === item.path;
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
        </nav>

        <div className="sidebar-footer">
          {!sidebarCollapsed && user && (
            <div style={{ padding: "0 1rem 0.5rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>
              {user.name}
            </div>
          )}
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <IconLogout />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ═══ Main Content ═════════════════════════════════════════════════════ */}
      <main className="home-main">
        {/* Top Navigation Bar — consistent with all roles */}
        <GlobalTopNav breadcrumbs={[{ path: location.pathname, label: getBreadcrumbLabel() }]} />

        <div style={{ padding: "1.5rem" }}>
          {/* If on exact /parent/dashboard show summary cards */}
          {location.pathname === "/parent/dashboard" && (
            <div>
              <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--text-dark,#1a1a2e)", marginBottom: "0.25rem" }}>
                Welcome, {user?.name || "Parent"}
              </h2>
              <p style={{ color: "var(--text-dark-sub,#6b7280)", marginBottom: "1.5rem" }}>
                {student ? `Here's a quick overview of ${student.full_name}'s academic status.` : "Use the sidebar to navigate your child's information."}
              </p>

              {/* Student Card — show if student linked */}
              {student ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                    {[
                      { label: "Student Name",  value: student.full_name,                    icon: <IconUser /> },
                      { label: "Reg No",        value: student.reg_no        || "—",         icon: <IconIdCard /> },
                      { label: "Program",       value: student.program_name  || "—",         icon: <IconGraduationCap /> },
                      { label: "Status",        value: student.academic_status || "Active",  icon: <IconCheckCircle /> },
                    ].map(card => (
                      <div key={card.label} style={{ background: "var(--card-bg,#fff)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "1.25rem", boxShadow: "var(--shadow-card, 0 2px 8px rgba(0,0,0,0.06))" }}>
                        <div style={{ marginBottom: "0.5rem", color: "var(--accent,#1d6fbf)" }}>{card.icon}</div>
                        <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-dark-sub,#6b7280)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{card.label}</div>
                        <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-dark,#1a1a2e)", marginTop: "0.25rem" }}>{card.value}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ padding: "1.5rem", background: "rgba(29,111,191,0.06)", borderRadius: "12px", marginBottom: "1.5rem", border: "1px dashed var(--accent,#1d6fbf)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ color: "var(--accent,#1d6fbf)", flexShrink: 0 }}><IconInfo /></span>
                  <p style={{ fontSize: "0.875rem", color: "var(--accent,#1d6fbf)", fontWeight: 500, margin: 0 }}>
                    No student linked to your account yet. Please contact the administration to link your child.
                  </p>
                </div>
              )}

              {/* Quick links — always show */}
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-dark-sub,#6b7280)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Quick Access</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "1rem" }}>
                {NAV_ITEMS.slice(1).map(item => (
                  <Link key={item.path} to={item.path}
                    style={{ background: "var(--card-bg,#fff)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "1.25rem", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.75rem", boxShadow: "var(--shadow-card, 0 2px 8px rgba(0,0,0,0.06))", color: "var(--text-dark,#1a1a2e)", fontWeight: 600, fontSize: "0.875rem" }}>
                    <span style={{ color: "var(--accent,#1d6fbf)" }}>{item.icon}</span>{item.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default ParentLayout;

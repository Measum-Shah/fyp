import React, { useState, useEffect, useCallback, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useRoleAccess } from "../hooks/useRoleAccess";
import { ToastContainer } from "../components/common/ToastContainer";
import type { ToastMessage } from "../components/common/ToastContainer";
import { GlobalTopNav } from "../../../components/common/GlobalTopNav";

/* ── Toast helper (module-level singleton) ─────────────────────────────────── */
let _addToast: ((t: Omit<ToastMessage, "id">) => void) | null = null;

export const toast = {
  success: (title: string, message?: string) => _addToast?.({ type: "success", title, message }),
  error: (title: string, message?: string) => _addToast?.({ type: "error", title, message }),
  info: (title: string, message?: string) => _addToast?.({ type: "info", title, message }),
  warning: (title: string, message?: string) => _addToast?.({ type: "warning", title, message }),
};

/* ── Icons ─────────────────────────────────────────────────────────────────── */
const IconHome = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

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
    path: "/academic/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    path: "/academic/structure",
    label: "Academic Structure",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0v-2M5 21H3m2 0v-2m0-4h14m-14 0V9m0 6h14m0-6V9m0 0H5" />
      </svg>
    ),
  },
  {
    path: "/academic/courses",
    label: "Course Catalog",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    path: "/academic/curriculum",
    label: "Curriculum",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    path: "/academic/prerequisites",
    label: "Prerequisites",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    path: "/academic/lms",
    label: "LMS Content",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    path: "/academic/enrollment",
    label: "Enrollment",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    path: "/academic/reports",
    label: "Reports",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    path: "/academic/results",
    label: "Result Generation",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    path: "/academic/graduation",
    label: "Graduation / Alumni",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 4l-8 4 8 4 8-4-8-4zM4 12v4c0 2 8 4 8 4s8-2 8-4v-4" />
        <path d="M20 8v6M18 14h4" />
      </svg>
    ),
  },
  {
    path: "/academic/parents",
    label: "Parents",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    path: "/academic/student-enrollment",
    label: "Student Enrollment",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <line x1="20" y1="8" x2="20" y2="14" />
        <line x1="23" y1="11" x2="17" y2="11" />
      </svg>
    ),
  },
  {
    path: "/academic/teacher-enrollment",
    label: "Teacher Enrollment",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    path: "/academic/active-sessions",
    label: "Session Management",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    path: "/academic/active-session-info",
    label: "Active Session Info",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  {
    path: "/academic/timetable",
    label: "Timetable Management",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="14" x2="8" y2="17" />
        <line x1="12" y1="14" x2="12" y2="17" />
      </svg>
    ),
  },
  {
    path: "/academic/rooms",
    label: "Room / Venue Management",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
        <path d="M9 7h.01M13 7h.01M9 11h.01M13 11h.01M9 15h.01M13 15h.01" />
      </svg>
    ),
  },
  {
    path: "/academic/academic-calendar",
    label: "Academic Calendar",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    path: "/academic/fines",
    label: "Fine Management",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
    ),
  },
  {
    path: "/academic/semester-promotion",
    label: "Semester Promotion",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="13 17 18 12 13 7" />
        <polyline points="6 17 11 12 6 7" />
      </svg>
    ),
  },
];

const AcademicLayout: React.FC = () => {
  const { role, institutionType, setInstitutionType } = useRoleAccess();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  const addToast = useCallback((t: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4500);
  }, []);

  _addToast = addToast;

  const dismissToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const handleLogout = () => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    window.location.href = "/";
  };

  // Generate functional breadcrumbs
  const getBreadcrumbs = () => {
    const segments = location.pathname.split("/").filter(Boolean);
    const crumbs = segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join("/")}`;
      let label = segment.charAt(0).toUpperCase() + segment.slice(1);
      // specific overrides
      if (segment === "lms") label = "LMS Content";
      if (segment === "curriculum") label = "Curriculum";
      if (segment === "student-enrollment") label = "Student Enrollment";
      if (segment === "teacher-enrollment") label = "Teacher Enrollment";
      if (segment === "active-sessions") label = "Session Management";
      if (segment === "active-session-info") label = "Active Session Info";
      if (segment === "academic-calendar") label = "Academic Calendar";
      if (segment === "rooms") label = "Room / Venue Management";
      if (segment === "results") label = "Result Generation";
      if (segment === "graduation") label = "Graduation Management";
      if (segment === "alumni") label = "Alumni Directory";
      if (segment === "semester-promotion") label = "Semester Promotion";
      return { path, label };
    });
    return crumbs;
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
                <div className="sidebar-brand-sub">Academic Module</div>
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
          {NAV_ITEMS.map((item, i) => {
            // Hide Timetable Management and Rooms Management for non-admins
            if ((item.path === "/academic/timetable" || item.path === "/academic/rooms") && role !== "admin") return null;
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
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={() => navigate("/dashboard")} style={{ marginBottom: "6px", background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)" }}>
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
        <div style={{ padding: "0" }}>
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

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default AcademicLayout;

import React, { useState, useCallback, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { GlobalTopNav } from "../../../../components/common/GlobalTopNav";
import { ToastContainer } from "../../components/common/ToastContainer";
import type { ToastMessage } from "../../components/common/ToastContainer";

let _addToast: ((t: Omit<ToastMessage, "id">) => void) | null = null;
export const toast = {
  success: (title: string, message?: string) => _addToast?.({ type: "success", title, message }),
  error: (title: string, message?: string) => _addToast?.({ type: "error", title, message }),
  info: (title: string, message?: string) => _addToast?.({ type: "info", title, message }),
  warning: (title: string, message?: string) => _addToast?.({ type: "warning", title, message }),
};

/* ── Inline SVG Icons ─────────────────────────────────────────────── */
const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
);
const IconProfile = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const IconCourses = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
);
const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const IconLMS = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
);
const IconExam = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
);
const IconFee = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);
const IconEnroll = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
);
const IconNotif = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
);
const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);
const IconChevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
);

const StudentLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const handleLogout = () => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    window.location.href = "/";
  };

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = useCallback((t: Omit<ToastMessage, "id">) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
  }, []);
  useEffect(() => { _addToast = addToast; }, [addToast]);

  const menuItems = [
    { label: "Dashboard",              icon: <IconDashboard />, path: "/student/dashboard" },
    { label: "My Profile",            icon: <IconProfile />,   path: "/student/profile" },
    { label: "My Courses",            icon: <IconCourses />,   path: "/student/courses" },
    { label: "Timetable & Attendance", icon: <IconCalendar />,  path: "/student/attendance" },
    { label: "Academic Calendar",     icon: <IconCalendar />,  path: "/student/academic-calendar" },
    { label: "Assignments & LMS",     icon: <IconLMS />,       path: "/student/lms" },
    { label: "Exams & Results",       icon: <IconExam />,      path: "/student/results" },
    { label: "Fee & Finance",         icon: <IconFee />,       path: "/student/fees" },
    { label: "My Fines",              icon: <IconFee />,       path: "/student/fines" },
    { label: "Course Registration",   icon: <IconEnroll />,    path: "/student/enrollment" },
  ];

  return (
    <div className="home-root">
      <aside className={`sidebar ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div>
                <div className="sidebar-brand-name">Student Portal</div>
                <div className="sidebar-brand-sub">TechRive ERP</div>
              </div>
            )}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <IconChevron />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item, i) => {
            const isActive = location.pathname.startsWith(item.path);
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
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <IconLogout />
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className="home-main">
        <GlobalTopNav breadcrumbs={[{ path: location.pathname, label: "Student Portal" }]} />
        <div style={{ padding: "1.5rem" }}>
          <Outlet />
        </div>
      </main>
      
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(x => x.id !== id))} />
    </div>
  );
};

export default StudentLayout;

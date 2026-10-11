import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { GlobalTopNav } from "../../../../components/common/GlobalTopNav";

const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconCourses = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const IconLMS = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const IconAttendance = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5v2M15 5v2M5 11h14M5 17h14" />
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </svg>
);

const IconExams = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20" />
    <path d="M5 6h14" />
    <path d="M5 12h14" />
    <path d="M5 18h14" />
  </svg>
);

const IconGradebook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <path d="M16 2v20" />
  </svg>
);

const IconTimetable = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="12" y1="4" x2="12" y2="20" />
  </svg>
);

const IconCommunication = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h12a2 2 0 012 2z" />
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

const IconCalendar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
  </svg>
);

const TeacherLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const handleLogout = () => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    window.location.href = "/";
  };

  const menuItems = [
    { label: "Dashboard Overview", icon: <IconDashboard />, path: "/teacher/dashboard" },
    { label: "My Courses", icon: <IconCourses />, path: "/teacher/courses" },
    { label: "LMS Management", icon: <IconLMS />, path: "/teacher/lms" },
    { label: "Attendance Management", icon: <IconAttendance />, path: "/teacher/attendance" },
    { label: "Exams & Results", icon: <IconExams />, path: "/teacher/exams" },
    { label: "Gradebook", icon: <IconGradebook />, path: "/teacher/gradebook" },
    { label: "Timetable & Schedule", icon: <IconTimetable />, path: "/teacher/timetable" },
    { label: "Academic Calendar", icon: <IconCalendar />, path: "/teacher/academic-calendar" },
    { label: "Communication & Notices", icon: <IconCommunication />, path: "/teacher/communication" },
  ];

  return (
    <div className="home-root">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div>
                <div className="sidebar-brand-name">Teacher Portal</div>
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

      {/* Main Content */}
      <main className="home-main">
        <GlobalTopNav breadcrumbs={[{ path: location.pathname, label: "Teacher Portal" }]} />
        <div style={{ padding: "1.5rem" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default TeacherLayout;

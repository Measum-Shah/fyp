import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { authAPI } from "../api/api";
import { GlobalTopNav } from "../components/common/GlobalTopNav";

/* ── Icons ─────────────────────────────────────────────────────────────────── */
const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconDashboard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconStudents = () => (
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
  </svg>
);

const IconMoney = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const IconSettings = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const IconBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconChevron = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconTrend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const IconHome = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

interface UserData {
  id: number;
  name: string;
  email: string;
  role_id?: number;
  branch_id?: number;
  user_type?: string;
  active?: number;
  status?: number;
}

/* ── Component ─────────────────────────────────────────────────────────────── */
const HomePage: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(() => {
    try {
      const storedUser = localStorage.getItem("erp_user");
      if (storedUser && storedUser !== "undefined") {
        return JSON.parse(storedUser) as UserData;
      }
    } catch (e) {
      console.warn("Failed to parse erp_user from localStorage", e);
    }
    return { id: 1, name: "System Administrator", email: "admin@techrive.com", user_type: "admin", active: 1 };
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // ─── PARENT/TEACHER GUARD — block from accessing admin dashboard ──────
    const storedUser = localStorage.getItem("erp_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.user_type === "parent") {
          window.location.href = "/parent/dashboard";
          return;
        }
        if (parsed.user_type === "staff" || parsed.user_type === "teacher") {
          window.location.href = "/teacher/dashboard";
          return;
        }
      } catch { /* ignore parse error */ }
    }

    // Fetch fresh user data from API if available
    authAPI.getMe()
      .then((res) => {
        if (res.data?.user) {
          // Double-check user_type from server response
          if (res.data.user.user_type === "parent") {
            window.location.href = "/parent/dashboard";
            return;
          }
          if (res.data.user.user_type === "staff" || res.data.user.user_type === "teacher") {
            window.location.href = "/teacher/dashboard";
            return;
          }
          setUser(res.data.user);
          localStorage.setItem("erp_user", JSON.stringify(res.data.user));
        }
      })
      .catch((err) => {
        console.warn("Backend getMe endpoint unavailable, using local session state.", err);
      });

    // Update clock every second
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

const handleLogout = async () => {
    // MUST be awaited before navigating: window.location.href below
    // triggers a full-page unload, and browsers abort any still-in-flight
    // request when that happens. The previous fire-and-forget version
    // (authAPI.logout().catch(...) with no await) fired the POST but
    // navigated away before it could reach the server, so the session in
    // erp_user_sessions was NEVER actually closed on a normal logout —
    // only force-logout (triggered from a different browser/tab, so
    // nothing here navigates away) ever completed. That's why sessions
    // kept showing as "active" indefinitely after a normal Sign Out.
    // try/catch so a failed call (e.g. token already expired) still lets
    // the user log out client-side either way.
    try {
      await authAPI.logout();
    } catch {
      // ignore — still clearing local session below regardless
    }
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    window.location.href = "/";
  };
  const greeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const stats = [
    { label: "Total Students", value: "2,847", change: "+12%", icon: <IconStudents />, color: "blue" },
    { label: "Active Staff", value: "186", change: "+3%", icon: <IconUser />, color: "green" },
    { label: "Fee Collected", value: "₨ 4.2M", change: "+18%", icon: <IconMoney />, color: "gold" },
    { label: "Attendance Today", value: "94.2%", change: "+1.5%", icon: <IconCalendar />, color: "purple" },
  ];
  const location = useLocation();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const menuItems = [
    { label: "Dashboard", icon: <IconDashboard />, path: "/dashboard" },
    { label: "Academics", icon: <IconCalendar />, path: "/academic/dashboard" },
    { label: "Students", icon: <IconStudents />, path: "#" },
    { label: "HR & Payroll", icon: <IconUser />, path: "/hr/dashboard" },
    { label: "Fee Management", icon: <IconMoney />, path: "/fee-management" },
    { label: "Accounts", icon: <IconTrend />, path: "/accounts/dashboard" },
    { label: "Settings", icon: <IconSettings />, path: "#" },
  ];

  const handleMenuClick = (e: React.MouseEvent, item: typeof menuItems[0]) => {
    if (item.path === "#") {
      e.preventDefault();
      setToastMessage(`${item.label} module is under development and will be available in the upcoming release.`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const recentActivities = [
    { text: "Fee payment received from Student #2341", time: "2 min ago", type: "success" },
    { text: "New student enrolled in BS Computer Science", time: "15 min ago", type: "info" },
    { text: "Attendance report generated for June 2026", time: "1 hour ago", type: "info" },
    { text: "Payroll processed for 186 staff members", time: "3 hours ago", type: "success" },
    { text: "System backup completed successfully", time: "5 hours ago", type: "info" },
  ];

  return (
    <div className="home-root">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold shadow-2xl flex items-center gap-3 animate-bounce">
          <span>ℹ️</span>
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white font-bold">✕</button>
        </div>
      )}

      {/* ═══ Sidebar ═══════════════════════════════════════════════════════════ */}
      <aside className={`sidebar ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div>
                <div className="sidebar-brand-name">TechRive ERP</div>
                <div className="sidebar-brand-sub">Management System</div>
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
          {menuItems.map((item, i) => {
            const isActive = location.pathname === item.path || (item.path !== "#" && item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={i}
                to={item.path}
                onClick={(e) => handleMenuClick(e, item)}
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

      {/* ═══ Main Content ═════════════════════════════════════════════════════ */}
      <main className="home-main">
        {/* Top Bar */}
        <GlobalTopNav breadcrumbs={[{ path: "/dashboard", label: "Dashboard" }]} />

        {/* Welcome Banner */}
        <section className="welcome-banner">
          <div className="welcome-content">
            <h2 className="welcome-greeting">
              {greeting()}, <span>{user?.name?.split(" ")[0] || "Admin"}</span> 
            </h2>
            <p className="welcome-text">
              Here's an overview of your institution's performance today.
              Everything looks great!
            </p>
          </div>
          <div className="welcome-visual">
            <div className="welcome-circle welcome-circle-1" />
            <div className="welcome-circle welcome-circle-2" />
            <div className="welcome-circle welcome-circle-3" />
          </div>
        </section>

        {/* Stats Grid */}
        <section className="stats-grid">
          {stats.map((stat, i) => (
            <div key={i} className={`stat-card stat-card-${stat.color}`}>
              <div className="stat-header">
                <div className={`stat-icon stat-icon-${stat.color}`}>
                  {stat.icon}
                </div>
                <span className="stat-change">
                  <IconTrend /> {stat.change}
                </span>
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </section>

        {/* Bottom Panels */}
        <div className="panels-grid">
          {/* Recent Activity */}
          <section className="panel-card">
            <div className="panel-card-header">
              <h3>Recent Activity</h3>
              <a href="#" className="panel-view-all">View All</a>
            </div>
            <div className="activity-list">
              {recentActivities.map((activity, i) => (
                <div key={i} className="activity-item">
                  <div className={`activity-dot activity-dot-${activity.type}`} />
                  <div className="activity-content">
                    <p className="activity-text">{activity.text}</p>
                    <span className="activity-time">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Info */}
          <section className="panel-card">
            <div className="panel-card-header">
              <h3>Your Profile</h3>
            </div>
            <div className="profile-info">
              <div className="profile-avatar-large">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <h4 className="profile-name">{user?.name || "Administrator"}</h4>
              <p className="profile-email">{user?.email || "admin@techrive.com"}</p>
              <div className="profile-details">
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Role</span>
                  <span className="profile-detail-value">
                    {user?.user_type === "admin" ? "System Administrator" : user?.user_type || "Staff"}
                  </span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Branch ID</span>
                  <span className="profile-detail-value">{user?.branch_id || "N/A"}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Status</span>
                  <span className={`profile-status ${user?.active === 1 ? "status-active" : "status-inactive"}`}>
                    {user?.active === 1 ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">User ID</span>
                  <span className="profile-detail-value">#{user?.id || "—"}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
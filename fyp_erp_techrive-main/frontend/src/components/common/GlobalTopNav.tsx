import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRoleAccess } from "../../modules/AcademicModule/hooks/useRoleAccess";
import API from "../../api/api";
import type { InstitutionType } from "../../modules/AcademicModule/types";

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

const IconLogout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

interface GlobalTopNavProps {
  breadcrumbs: { path: string; label: string }[];
}

export const GlobalTopNav: React.FC<GlobalTopNavProps> = ({ breadcrumbs }) => {
  const { role, institutionType, setInstitutionType, branchId, setBranchId } = useRoleAccess();
  const navigate = useNavigate();
  const currentRole = String(role).toLowerCase();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [branches, setBranches] = useState<{ id: number; name: string; branch_code: string }[]>([]);

  // Load branches for the current institution type
  useEffect(() => {
    API.get("/academic/branches", { params: { institution_type: institutionType } })
      .then(res => {
        if (res.data?.success && Array.isArray(res.data?.data)) setBranches(res.data.data);
        else setBranches([]);
      })
      .catch(() => setBranches([]));
  }, [institutionType]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const getNotifBaseUrl = () => {
    try {
      const u = JSON.parse(localStorage.getItem("erp_user") || "{}");
      return u.user_type === "student" ? "/academic/student-portal/notifications" : "/academic/notifications";
    } catch {
      return "/academic/notifications";
    }
  };

  const fetchNotifications = () => {
    API.get(getNotifBaseUrl())
      .then(res => {
        if (res.data?.success) {
          // Some backend APIs return the array directly in data, some inside data.notifications
          const notifs = res.data.data.notifications || res.data.data || [];
          setNotifications(notifs);
          setUnreadCount(res.data.data.unreadCount ?? notifs.filter((n: any) => n.status === 'unread').length);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchNotifications();
    // Optional: poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = () => {
    API.put(`${getNotifBaseUrl()}/read-all`)
      .then(() => fetchNotifications())
      .catch(console.error);
  };

  const handleMarkRead = (id: number) => {
    API.put(`${getNotifBaseUrl()}/${id}/read`)
      .then(() => fetchNotifications())
      .catch(console.error);
  };


  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    window.location.href = "/";
  };

  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    const updateUserName = () => {
      try {
        const raw = localStorage.getItem("erp_user");
        if (raw && raw !== "undefined") {
          const u = JSON.parse(raw);
          setUserName(u.name || "Admin");
        }
      } catch {
        setUserName("Admin");
      }
    };
    updateUserName();
    window.addEventListener("erp_user_updated", updateUserName);
    return () => window.removeEventListener("erp_user_updated", updateUserName);
  }, []);

  const formatTime = () => {
    return currentTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <header className="topbar" style={{ padding: "12px 24px", borderBottom: "1px solid var(--topbar-border)", background: "var(--topbar-bg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div className="topbar-left" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <style>
          {`
            .breadcrumb-hover {
              transition: color 0.2s;
            }
            .breadcrumb-hover:hover {
              color: var(--accent) !important;
            }
          `}
        </style>
        <nav className="breadcrumb" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: 600 }}>
          {/* Conditionally render Home link when not in teacher portal */}
{breadcrumbs[0] && !breadcrumbs[0].path.startsWith('/teacher') && (
  <Link to="/dashboard" className="breadcrumb-item breadcrumb-hover" style={{ textDecoration: 'none', display: "flex", alignItems: "center", gap: "4px", color: "var(--text-dark-sub)" }}>
    <IconHome /> Home
  </Link>
)}
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.path}>
              <span className="breadcrumb-separator" style={{ color: "var(--text-muted)" }}>›</span>
              {idx === breadcrumbs.length - 1 ? (
                <span className="breadcrumb-item breadcrumb-current" style={{ color: "var(--text-dark)", fontWeight: 700 }}>{crumb.label}</span>
              ) : (
                <Link to={crumb.path} className="breadcrumb-item breadcrumb-hover" style={{ textDecoration: 'none', color: "var(--text-dark-sub)" }}>
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div className="topbar-search" style={{ position: "relative" }}>
          <span className="topbar-search-icon" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}>
            <IconSearch />
          </span>
          <input 
            type="text" 
            placeholder="Search academic records..." 
            style={{
              padding: "0.4rem 1rem 0.4rem 2rem",
              borderRadius: "20px",
              border: "1px solid var(--topbar-border)",
              background: "var(--input-bg)",
              color: "var(--text-dark)",
              fontSize: "0.8rem",
              outline: "none"
            }} 
          />
        </div>

        <div className="topbar-time" style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-dark-sub)" }}>
          {formatTime()}
        </div>

        {/* Notifications Dropdown */}
        <div style={{ position: "relative" }} ref={notifRef}>
          <style>
            {`
              .topbar-icon-hover {
                background: transparent;
                border: none;
                color: var(--text-dark-sub);
                cursor: pointer;
                position: relative;
                padding: 6px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
              }
              .topbar-icon-hover:hover {
                background: var(--input-bg);
                color: var(--accent);
              }
            `}
          </style>
          <button 
            className="topbar-icon-hover" 
            aria-label="Notifications"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <IconBell />
            <span className="notification-dot" style={{ display: unreadCount > 0 ? "block" : "none", position: "absolute", top: "2px", right: "4px", width: "8px", height: "8px", background: "var(--error, #ef4444)", borderRadius: "50%", border: "2px solid var(--topbar-bg)" }} />
          </button>
          {showNotifications && (
            <div style={{ position: "absolute", right: 0, top: "100%", marginTop: "0.5rem", width: showAllNotifications ? "450px" : "320px", background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "10px", boxShadow: "var(--shadow-card)", zIndex: 100, overflow: "hidden" }}>
              <div style={{ padding: "1rem", borderBottom: "1px solid var(--divider-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ margin: 0, fontSize: "0.9rem", color: "var(--text-dark)" }}>Notifications ({unreadCount})</h4>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} style={{ background: "transparent", border: "none", color: "var(--accent)", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}>Mark all read</button>
                )}
              </div>
              <div style={{ maxHeight: showAllNotifications ? "60vh" : "300px", overflowY: "auto" }}>
                {notifications.length > 0 ? (showAllNotifications ? notifications : notifications.slice(0, 5)).map((n, i) => (
                  <div key={n.id} onClick={() => { if (n.status === 'unread') handleMarkRead(n.id); }} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--divider-color)", cursor: "pointer", transition: "background 0.2s", opacity: n.status === 'read' ? 0.6 : 1 }} onMouseOver={e => e.currentTarget.style.background = 'var(--input-bg)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <h5 style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-dark)", fontWeight: 600 }}>{n.title || "Notification"}</h5>
                      {n.status === 'unread' && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)", alignSelf: "center", flexShrink: 0, marginLeft: "8px" }} />}
                    </div>
                    <p style={{ margin: "0.25rem 0", fontSize: "0.75rem", color: "var(--text-dark-sub)", whiteSpace: showAllNotifications ? "normal" : "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.reason || n.justification || n.message}</p>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                )) : (
                  <div style={{ padding: "1rem", textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>No notifications</div>
                )}
              </div>
              {notifications.length > 5 && !showAllNotifications && (
                <div style={{ padding: "0.75rem", textAlign: "center", borderTop: "1px solid var(--divider-color)", background: "var(--input-bg)" }}>
                  <button onClick={() => setShowAllNotifications(true)} style={{ background: "transparent", border: "none", color: "var(--text-dark)", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}>View All</button>
                </div>
              )}
              {showAllNotifications && (
                <div style={{ padding: "0.75rem", textAlign: "center", borderTop: "1px solid var(--divider-color)", background: "var(--input-bg)" }}>
                  <button onClick={() => setShowAllNotifications(false)} style={{ background: "transparent", border: "none", color: "var(--text-dark)", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}>Show Less</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div style={{ position: "relative" }} ref={profileRef}>
          <style>
            {`
              .topbar-user-hover {
                cursor: pointer;
                padding: 4px 12px 4px 4px;
                border-radius: 20px;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border: 1px solid transparent;
              }
              .topbar-user-hover:hover {
                background: var(--input-bg);
                border-color: var(--accent);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                transform: translateY(-1px);
              }
            `}
          </style>
          <div 
            className="topbar-user-hover" 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="topbar-avatar" style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.9rem" }}>
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="topbar-user-info" style={{ display: "flex", flexDirection: "column" }}>
              <span className="topbar-user-name" style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-dark)", lineHeight: 1.2 }}>{userName}</span>
              <span className="topbar-user-role" style={{ fontSize: "0.7rem", color: "var(--text-dark-sub)", textTransform: "capitalize", lineHeight: 1.2 }}>{role}</span>
            </div>
          </div>
          
          {showProfileMenu && (
            <div style={{ position: "absolute", right: 0, top: "100%", marginTop: "0.5rem", width: "200px", background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "10px", boxShadow: "var(--shadow-card)", zIndex: 100, padding: "0.5rem 0", animation: "toast-slide-in 0.2s forwards" }}>
              <div style={{ padding: "0.5rem 1rem", borderBottom: "1px solid var(--divider-color)", marginBottom: "0.5rem" }}>
                <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-dark)" }}>{userName}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-dark-sub)", textTransform: "capitalize" }}>System {role}</div>
              </div>
              
              <button onClick={() => { 
                if (currentRole === 'student') navigate("/student/profile");
                else if (currentRole === 'faculty' || currentRole === 'teacher' || currentRole === 'staff') navigate("/teacher/profile");
                else navigate("/academic/profile"); 
                setShowProfileMenu(false); 
              }} style={{ width: "100%", textAlign: "left", padding: "0.5rem 1rem", background: "transparent", border: "none", color: "var(--text-dark)", fontSize: "0.8rem", cursor: "pointer", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = 'var(--input-bg)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                My Profile
              </button>
              
              {currentRole !== 'student' && currentRole !== 'faculty' && currentRole !== 'teacher' && currentRole !== 'staff' && (
                <button onClick={() => { 
                  navigate("/academic/settings"); 
                  setShowProfileMenu(false); 
                }} style={{ width: "100%", textAlign: "left", padding: "0.5rem 1rem", background: "transparent", border: "none", color: "var(--text-dark)", fontSize: "0.8rem", cursor: "pointer", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = 'var(--input-bg)'} onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                  Account Settings
                </button>
              )}
              
              <div style={{ height: "1px", background: "var(--divider-color)", margin: "0.5rem 0" }} />
              
              <button 
                onClick={handleLogout}
                style={{ width: "100%", textAlign: "left", padding: "0.5rem 1rem", background: "transparent", border: "none", color: "var(--error, #dc2626)", fontSize: "0.8rem", cursor: "pointer", transition: "background 0.2s", display: "flex", alignItems: "center", gap: "0.5rem" }} 
                onMouseOver={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} 
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                <IconLogout /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

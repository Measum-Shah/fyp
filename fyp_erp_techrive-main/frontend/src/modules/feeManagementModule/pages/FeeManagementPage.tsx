import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../../../api/api";
import FeeModuleWorkspace, {
  FEE_NAV_ITEMS,
  type FeeTabKey,
} from "../components/FeeModuleWorkspace";
import { FeeSelfServicePanel } from "../components/FeeSelfServicePanel";
import { FeeAlert, FeeLoading } from "../components/FeeUI";
import { useFeeAccess } from "../hooks/useFeeAccess";
import { FEE_SIDEBAR_ICONS, FeeBackToErpIcon } from "./FeeSidebarIcons";
import "./FeeManagementSidebar.css";

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

const FeeManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(() => {
    const stored = localStorage.getItem("erp_user");
    return stored ? (JSON.parse(stored) as UserData) : null;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<FeeTabKey>("overview");
  const [pageAlert, setPageAlert] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  const { profile, loading: accessLoading, error: accessError, canOpenTab, allowedTabs } =
    useFeeAccess();

  const navItems = useMemo(() => {
    if (profile?.is_self_service) return [];
    return FEE_NAV_ITEMS.filter((item) => canOpenTab(item.key));
  }, [profile, canOpenTab]);

  const activeNav =
    navItems.find((item) => item.key === activeTab) ||
    navItems[0] ||
    FEE_NAV_ITEMS[0];

  useEffect(() => {
    authAPI
      .getMe()
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem("erp_user", JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem("erp_token");
        localStorage.removeItem("erp_user");
        window.location.href = "/";
      });
  }, []);

  useEffect(() => {
    if (!profile || profile.is_self_service) return;
    if (!canOpenTab(activeTab) && allowedTabs[0]) {
      setActiveTab(allowedTabs[0]);
    }
  }, [profile, activeTab, canOpenTab, allowedTabs]);

  const handleLogout = () => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_user");
    window.location.href = "/";
  };

  const showAlert = (type: "success" | "error" | "info", message: string) => {
    setPageAlert({ type, message });
    window.setTimeout(() => setPageAlert(null), 4500);
  };

  const roleLabel = () => {
    if (profile?.fee_role === "admin") return "Administrator";
    if (profile?.fee_role === "accountant") return "Accountant";
    if (profile?.fee_role === "teacher") return "Teacher (Restricted)";
    if (profile?.fee_role === "parent") return "Parent";
    if (profile?.fee_role === "student") return "Student";
    return user?.user_type || "User";
  };

  if (accessLoading) {
    return (
      <div className="home-root">
        <main className="home-main" style={{ padding: "2rem" }}>
          <FeeLoading label="Checking Fee Management access…" />
        </main>
      </div>
    );
  }

  if (accessError || !profile || profile.fee_role === "denied") {
    return (
      <div className="home-root">
        <main className="home-main" style={{ padding: "2rem" }}>
          <div className="fee-panel">
            <div className="fee-empty">
              <h4>Access denied</h4>
              <p>
                {accessError ||
                  "Your account is not authorized to access Fee Management."}
              </p>
              <button
                type="button"
                className="fee-btn fee-btn-primary"
                onClick={() =>
                  navigate(user?.user_type === "parent" ? "/parent/dashboard" : "/dashboard")
                }
              >
                Go back
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="home-root">
      <aside className={`sidebar ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <div>
                <div className="sidebar-brand-name">TechRive ERP</div>
                <div className="sidebar-brand-sub">Fee Management</div>
              </div>
            )}
          </div>
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-group fee-sidebar-group">
            <button
              type="button"
              className="sidebar-link sidebar-link-active"
              onClick={() => {
                if (profile.is_self_service) return;
                if (navItems[0]) setActiveTab(navItems[0].key);
              }}
              title={sidebarCollapsed ? "Fee Management" : undefined}
            >
              <span className="sidebar-link-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              {!sidebarCollapsed && (
                <span>{profile.is_self_service ? "My Fees" : "Fee Management"}</span>
              )}
            </button>

            {!sidebarCollapsed && !profile.is_self_service && (
              <div
                className="fee-sidebar-subnav"
                role="group"
                aria-label="Fee Management sections"
              >
                {navItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={`fee-sidebar-sublink ${
                      activeTab === item.key ? "fee-sidebar-sublink-active" : ""
                    }`}
                    onClick={() => setActiveTab(item.key)}
                    aria-current={activeTab === item.key ? "page" : undefined}
                  >
                    <span className="fee-sidebar-sublink-icon" aria-hidden="true">
                      {FEE_SIDEBAR_ICONS[item.key]}
                    </span>
                    <span className="fee-sidebar-sublink-label">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="sidebar-footer fee-sidebar-footer">
          <button
            type="button"
            className="fee-sidebar-back"
            onClick={() =>
              navigate(profile.is_self_service ? "/parent/dashboard" : "/dashboard")
            }
            title={sidebarCollapsed ? "Back to ERP" : undefined}
          >
            <span className="fee-sidebar-back-icon" aria-hidden="true">
              {FeeBackToErpIcon}
            </span>
            {!sidebarCollapsed && (
              <span className="fee-sidebar-back-label">Back to ERP</span>
            )}
          </button>

          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className="home-main">
        <header className="topbar">
          <div className="topbar-left">
            <nav className="breadcrumb">
              <button
                type="button"
                className="breadcrumb-item"
                onClick={() =>
                  navigate(profile.is_self_service ? "/parent/dashboard" : "/dashboard")
                }
              >
                Home
              </button>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-item breadcrumb-current">
                {profile.is_self_service ? "My Fees" : activeNav.label}
              </span>
            </nav>
            <p className="topbar-date">
              {profile.is_self_service
                ? "Your personal fee summary and payments"
                : activeNav.subtitle}
            </p>
          </div>
          <div className="topbar-right">
            <div className="topbar-user">
              <div className="topbar-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || "A"}
              </div>
              <div className="topbar-user-info">
                <span className="topbar-user-name">{user?.name || "User"}</span>
                <span className="topbar-user-role">{roleLabel()}</span>
              </div>
            </div>
          </div>
        </header>

        {pageAlert && (
          <div style={{ padding: "0 1.25rem" }}>
            <FeeAlert
              type={pageAlert.type}
              message={pageAlert.message}
              onClose={() => setPageAlert(null)}
            />
          </div>
        )}

        {profile.is_self_service ? (
          <div style={{ padding: "1rem 1.25rem 1.5rem" }}>
            <FeeSelfServicePanel profile={profile} showAlert={showAlert} />
          </div>
        ) : (
          <FeeModuleWorkspace
            userBranchId={user?.branch_id}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            allowedTabs={allowedTabs}
            teacherRestricted={profile.is_teacher_restricted}
          />
        )}
      </main>
    </div>
  );
};

export default FeeManagementPage;

import React, { useState, useEffect } from "react";
import { StudentAPI } from "../services/api";

const StudentDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      StudentAPI.getDashboard().then(res => res.data.data),
      fetch("http://localhost:5000/api/academic/student-portal/fines", { headers: { Authorization: `Bearer ${localStorage.getItem("erp_token")}` } }).then(r => r.json())
    ])
      .then(([dashboardData, finesData]) => {
        setData(dashboardData);
        setFines(Array.isArray(finesData) ? finesData : []);
        setError(null);
      })
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="stat-card" style={{height:120}}/>)}
      </div>
    </div>
  );

  if (error) return <div className="teacher-dashboard-error" role="alert">{error}</div>;

  const outstandingFines = fines.reduce((acc, fine) => acc + fine.remainingAmount, 0);

  const stats = [
    { label: "CGPA",               value: data?.academic_summary?.cgpa ?? "N/A", color: "blue",   icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { label: "Enrolled Courses",   value: data?.academic_summary?.enrolled_courses ?? 0, color: "green",  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> },
    { label: "Attendance",         value: `${(data?.attendance?.percentage ?? 0).toFixed(1)}%`, color: "gold",   icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
    { label: "Pending Assignments",value: data?.pending_assignments ?? 0, color: "purple", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg> },
    { label: "Outstanding Fines",  value: `Rs. ${outstandingFines}`, color: outstandingFines > 0 ? "red" : "green", icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{color: "var(--text-dark)"}}>Dashboard Overview</h1>
        <span className="text-sm text-slate-500">Welcome, {data?.student?.first_name} {data?.student?.last_name}</span>
      </div>

      {/* Stat Cards */}
      <div className="teacher-stats-grid">
        {stats.map((s, i) => (
          <div key={i} className={`stat-card stat-card-${s.color}`}>
            <div className="stat-header">
              <div className={`stat-icon stat-icon-${s.color}`}><span style={{fontSize:20}}>{s.icon}</span></div>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Announcements */}
        <div className="panel-card flex flex-col h-full" style={{padding: "1.5rem"}}>
          <div className="panel-card-header" style={{borderBottom: "1px solid var(--card-border)", paddingBottom: "1rem", marginBottom: "1rem", marginTop: 0}}>
            <h3 style={{display:"flex", alignItems:"center", gap:"8px", margin: 0}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--accent)"}}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              Recent Announcements
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto" style={{maxHeight: "320px", paddingRight: "0.25rem"}}>
            {data?.recent_announcements?.length > 0 ? (
              <div className="flex flex-col gap-3">
                {data.recent_announcements.map((n: any) => (
                  <div key={n.id} style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem",
                    padding: "1rem",
                    borderRadius: "var(--radius-card)",
                    background: n.status === 'unread' ? "var(--input-bg)" : "transparent",
                    border: "1px solid var(--card-border)",
                  }}>
                    <div style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      marginTop: "6px",
                      background: n.status === 'unread' ? "var(--accent)" : "transparent",
                      border: n.status === 'unread' ? "none" : "2px solid var(--input-border)",
                      flexShrink: 0
                    }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <p className="font-semibold text-sm truncate" style={{color: n.status === 'unread' ? "var(--text-dark)" : "var(--text-secondary)"}}>{n.title}</p>
                        <span className="text-xs font-medium whitespace-nowrap" style={{color:"var(--text-muted)"}}>
                          {new Date(n.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                        </span>
                      </div>
                      <p className="text-xs line-clamp-2" style={{color:"var(--text-muted)", lineHeight: 1.5}}>{n.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center" style={{padding: "2.5rem 0", color: "var(--text-secondary)"}}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom: "0.75rem", opacity: 0.4}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="text-sm font-semibold text-slate-400">No recent announcements</p>
                <p className="text-xs mt-1" style={{color: "var(--text-muted)"}}>You're all caught up!</p>
              </div>
            )}
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="panel-card flex flex-col h-full" style={{padding: "1.5rem"}}>
          <div className="panel-card-header" style={{borderBottom: "1px solid var(--card-border)", paddingBottom: "1rem", marginBottom: "1rem", marginTop: 0}}>
            <h3 style={{display:"flex", alignItems:"center", gap:"8px", margin: 0}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color:"var(--success)"}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
              Attendance Summary
            </h3>
          </div>
          <div className="flex-1 flex flex-col justify-center gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div style={{
                background: "var(--input-bg)",
                padding: "1.25rem",
                borderRadius: "var(--radius-card)",
                border: "1px solid var(--card-border)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center"
              }}>
                <span style={{fontSize: "2rem", fontWeight: 800, color: "var(--text-dark)", lineHeight: 1}}>{data?.attendance?.total_classes ?? 0}</span>
                <span style={{fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "10px"}}>Total Classes</span>
              </div>
              <div style={{
                background: "var(--success-bg)",
                padding: "1.25rem",
                borderRadius: "var(--radius-card)",
                border: "1px solid var(--success-border)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center"
              }}>
                <span style={{fontSize: "2rem", fontWeight: 800, color: "var(--success)", lineHeight: 1}}>{data?.attendance?.present_classes ?? 0}</span>
                <span style={{fontSize: "0.75rem", fontWeight: 700, color: "var(--success)", opacity: 0.85, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "10px"}}>Present</span>
              </div>
            </div>
            
            <div style={{
              padding: "1.5rem",
              borderRadius: "var(--radius-card)",
              background: "var(--input-bg)",
              border: "1px solid var(--card-border)",
              position: "relative",
              overflow: "hidden"
            }}>
              <div className="flex justify-between items-end mb-3 relative z-10">
                <div>
                  <h4 style={{fontSize: "0.875rem", fontWeight: 700, color: "var(--text-dark)"}}>Attendance Rate</h4>
                  <p style={{fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", fontWeight: 500}}>
                    {(data?.attendance?.percentage ?? 0) >= 75 ? "You are on track!" : "Attention required"}
                  </p>
                </div>
                <span style={{
                  fontSize: "1.75rem", 
                  fontWeight: 800, 
                  lineHeight: 1,
                  color: (data?.attendance?.percentage ?? 0) >= 75 ? "var(--success)" : "var(--error)",
                  textShadow: "0 2px 4px rgba(0,0,0,0.05)"
                }}>
                  {(data?.attendance?.percentage ?? 0).toFixed(1)}%
                </span>
              </div>
              
              {/* Progress Bar Container */}
              <div style={{
                width: "100%",
                height: "8px",
                background: "var(--input-border)",
                borderRadius: "9999px",
                overflow: "hidden",
                position: "relative",
                zIndex: 10
              }}>
                <div style={{
                  width: `${Math.min(100, Math.max(0, data?.attendance?.percentage ?? 0))}%`,
                  height: "100%",
                  background: (data?.attendance?.percentage ?? 0) >= 75 ? "var(--success)" : "var(--error)",
                  borderRadius: "9999px",
                  transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "inset 0 -1px 2px rgba(0,0,0,0.1)"
                }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboardPage;

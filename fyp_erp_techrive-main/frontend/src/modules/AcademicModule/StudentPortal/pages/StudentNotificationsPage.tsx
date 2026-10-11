import React, { useState, useEffect } from "react";
import { StudentAPI } from "../services/api";

const StudentNotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = () => {
    setLoading(true);
    StudentAPI.getNotifications()
      .then(res => {
        setNotifications(res.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = (id: number) => {
    StudentAPI.markNotificationRead(id).then(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
    });
  };

  if (loading && notifications.length === 0) return <div className="flex flex-col gap-6 animate-pulse"><div className="panel-card" style={{height:400}}/></div>;

  const filteredNotifs = filter === 'all' ? notifications : notifications.filter(n => n.status === 'unread');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold" style={{color: "var(--text-dark)"}}>Notifications</h1>
        <div className="flex gap-2">
          <button style={{ background: filter === 'all' ? "var(--accent)" : "var(--input-bg)", color: filter === 'all' ? "#ffffff" : "var(--text-dark)", border: filter === 'all' ? "none" : "1px solid var(--input-border)", padding: "0.375rem 0.75rem", borderRadius: "9999px", fontWeight: 600, cursor: "pointer", fontSize: "0.75rem" }} onClick={() => setFilter('all')}>All</button>
          <button style={{ background: filter === 'unread' ? "var(--accent)" : "var(--input-bg)", color: filter === 'unread' ? "#ffffff" : "var(--text-dark)", border: filter === 'unread' ? "none" : "1px solid var(--input-border)", padding: "0.375rem 0.75rem", borderRadius: "9999px", fontWeight: 600, cursor: "pointer", fontSize: "0.75rem" }} onClick={() => setFilter('unread')}>Unread</button>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-card-header flex justify-between items-center">
          <h3>All Announcements & Alerts</h3>
        </div>
        <div className="p-4">
          {filteredNotifs.length > 0 ? (
            <div className="flex flex-col gap-4">
              {filteredNotifs.map((n: any) => (
                <div key={n.id} className="p-4 flex items-start gap-4 transition-all" style={{background:"var(--input-bg)", borderRadius:"12px", border:"1px solid var(--input-border)"}}>
                  <div style={{display:"flex", alignItems:"center", justifyContent:"center", width:40, height:40, borderRadius:"50%", background: n.status === 'unread' ? "rgba(59,130,246,0.1)" : "var(--card-bg)"}}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={n.status === 'unread' ? "var(--accent)" : "var(--text-muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-base" style={{color:"var(--text-dark)"}}>{n.title || n.reason || 'Notification'}</h4>
                    <p className="text-sm mt-1" style={{color:"var(--text-secondary)"}}>{n.reason || n.description}</p>
                    {n.justification && <p className="text-sm mt-2 italic" style={{color:"var(--text-muted)"}}>"{n.justification}"</p>}
                    <div className="flex gap-4 mt-3 text-xs font-medium" style={{color:"var(--text-muted)", alignItems: "center"}}>
                      <span>{new Date(n.created_at).toLocaleDateString()}</span>
                      {n.type && <span style={{textTransform:"uppercase"}}>{n.type}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <span className="text-xs font-semibold" style={{padding:"4px 8px", borderRadius:"6px",
                      background: n.status === 'unread' ? "rgba(59,130,246,0.1)" : "var(--card-bg)",
                      color: n.status === 'unread' ? "var(--accent)" : "var(--text-muted)"
                    }}>
                      {n.status === 'unread' ? 'New' : 'Read'}
                    </span>
                    {n.status === 'unread' && (
                      <button style={{ background: "transparent", color: "var(--accent)", border: "none", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, padding: 0 }} onClick={() => handleMarkAsRead(n.id)}>Mark as read</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center text-sm" style={{color:"var(--text-secondary)"}}>
              No notifications found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentNotificationsPage;

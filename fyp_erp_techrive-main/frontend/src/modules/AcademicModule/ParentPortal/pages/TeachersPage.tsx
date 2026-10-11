import React, { useState, useEffect } from "react";
import { parentService } from "../services/parentService";

/* ── SVG Icons ──────────────────────────────────────────────────────────────── */
const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
);

const TeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    parentService.getStudentTeachers()
      .then(res => { if (res.success) setTeachers(res.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding:"2rem", color:"var(--text-dark-sub)" }}>Loading teachers...</div>;

  return (
    <div>
      <h2 style={{ fontSize:"1.4rem", fontWeight:700, color:"var(--text-dark)", marginBottom:"0.5rem" }}>Teachers &amp; Contact Info</h2>
      <p style={{ color:"var(--text-dark-sub)", marginBottom:"1.5rem" }}>Contact your child&apos;s teachers directly for queries.</p>

      {teachers.length === 0 ? (
        <div style={{ padding:"3rem", textAlign:"center", background:"var(--card-bg,#fff)", borderRadius:"12px", color:"var(--text-dark-sub)" }}>
          No teacher information available yet.
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"1rem" }}>
          {teachers.map(t => (
            <div key={t.id} style={{ background:"var(--card-bg,#fff)", border:"1px solid var(--card-border)", borderRadius:"12px", padding:"1.5rem", boxShadow:"var(--shadow-card, 0 2px 8px rgba(0,0,0,0.06))", display:"flex", gap:"1rem", alignItems:"flex-start" }}>
              {/* Avatar */}
              <div style={{ width:"48px", height:"48px", borderRadius:"50%", background:"var(--accent,#1d6fbf)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, color:"white", fontWeight:700, fontSize:"1.2rem" }}>
                {t.full_name?.charAt(0) || "T"}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <h4 style={{ fontWeight:700, fontSize:"0.9rem", color:"var(--text-dark)", margin:"0 0 0.2rem" }}>{t.full_name}</h4>
                {t.designation && <p style={{ fontSize:"0.75rem", color:"var(--text-dark-sub)", margin:"0 0 0.75rem" }}>{t.designation}</p>}

                {t.email && (
                  <a href={`mailto:${t.email}`}
                    style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.8rem", color:"var(--accent)", textDecoration:"none", marginBottom:"0.375rem" }}>
                    <IconMail /> {t.email}
                  </a>
                )}
                {t.phone && (
                  <a href={`tel:${t.phone}`}
                    style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.8rem", color:"var(--text-dark)", textDecoration:"none" }}>
                    <IconPhone /> {t.phone}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeachersPage;

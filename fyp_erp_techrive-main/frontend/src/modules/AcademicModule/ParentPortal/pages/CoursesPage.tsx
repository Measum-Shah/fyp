import React, { useState, useEffect } from "react";
import { parentService } from "../services/parentService";

/* ── SVG Icons ──────────────────────────────────────────────────────────────── */
const IconBook = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const IconClock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parentService.getStudentCourses()
      .then(res => { if (res.success) setCourses(res.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding:"2rem", color:"var(--text-dark-sub)" }}>Loading courses...</div>;

  return (
    <div>
      <h2 style={{ fontSize:"1.4rem", fontWeight:700, color:"var(--text-dark)", marginBottom:"1.5rem" }}>
        Enrolled Courses <span style={{ fontSize:"0.875rem", fontWeight:500, color:"var(--text-dark-sub)" }}>({courses.length})</span>
      </h2>
      {courses.length === 0 ? (
        <div style={{ padding:"3rem", textAlign:"center", background:"var(--card-bg,#fff)", borderRadius:"12px", color:"var(--text-dark-sub)" }}>
          No courses enrolled yet.
        </div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:"1rem" }}>
          {courses.map(c => (
            <div key={c.id} style={{ background:"var(--card-bg,#fff)", border:"1px solid var(--card-border)", borderRadius:"12px", padding:"1.25rem", boxShadow:"var(--shadow-card, 0 2px 8px rgba(0,0,0,0.06))" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"0.75rem" }}>
                <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:"0.8rem", color:"var(--accent,#1d6fbf)", background:"rgba(29,111,191,0.1)", padding:"0.2rem 0.5rem", borderRadius:"4px" }}>
                  {c.code || "—"}
                </span>
                <span style={{ fontSize:"0.7rem", fontWeight:700, padding:"0.2rem 0.5rem", borderRadius:"6px",
                  background: c.enrollment_status==="active"?"rgba(16,185,129,0.12)":"rgba(217,119,6,0.12)",
                  color: c.enrollment_status==="active"?"#059669":"#d97706" }}>
                  {c.enrollment_status}
                </span>
              </div>
              <h4 style={{ fontWeight:700, fontSize:"0.9rem", color:"var(--text-dark)", margin:"0 0 0.5rem" }}>{c.name}</h4>
              <div style={{ display:"flex", gap:"1rem", fontSize:"0.75rem", color:"var(--text-dark-sub)" }}>
                <span style={{ display:"flex", alignItems:"center", gap:"0.25rem" }}><IconBook /> {c.category || "—"}</span>
                <span style={{ display:"flex", alignItems:"center", gap:"0.25rem" }}><IconClock /> {c.credit_hours ?? 0} Credits</span>
                {c.semester && <span style={{ display:"flex", alignItems:"center", gap:"0.25rem" }}><IconCalendar /> Sem {c.semester}</span>}
              </div>
              {(c.lecture_hours || c.lab_hours) && (
                <div style={{ marginTop:"0.5rem", fontSize:"0.75rem", color:"var(--text-dark-sub)" }}>
                  Lec: {c.lecture_hours || 0}h | Lab: {c.lab_hours || 0}h
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;

import React, { useState, useEffect } from "react";
import API from "../../../api/api";
import "./StudentEnrollmentPage.css";

const BASE = "/academic/teacher-enrollment";

type Option = { id: number; name: string; title?: string };

type ActiveSession = {
  id: number;
  title: string;
  program_id: number;
  class_id: number;
};

type Section = {
  id: number; // active_session_section_id
  section_id: number;
  name: string;
};

type Teacher = {
  id: number;
  staff_id: number;
  name: string;
  reg_no: string;
  designation: string;
  courses: { id: number; name: string; subject_code: string }[];
};

const ActiveSessionInfoPage: React.FC = () => {
  const [universities, setUniversities] = useState<Option[]>([]);
  const [campuses, setCampuses] = useState<Option[]>([]);
  const [selUniversity, setSelUniversity] = useState("");
  const [selCampus, setSelCampus] = useState("");

  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);
  const [sections, setSections] = useState<Record<number, Section[]>>({});
  const [teachers, setTeachers] = useState<Record<number, Teacher[]>>({});

  useEffect(() => {
    API.get(`${BASE}/universities`).then(r => setUniversities(r.data.data || []));
  }, []);

  useEffect(() => {
    setCampuses([]);
    setSelCampus("");
    setActiveSessions([]);
    if (!selUniversity) return;
    API.get(`${BASE}/campuses/${selUniversity}`).then(r => setCampuses(r.data.data || []));
  }, [selUniversity]);

  useEffect(() => {
    if (!selCampus) {
      setActiveSessions([]);
      return;
    }
    fetchSessions();
  }, [selCampus]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const r = await API.get(`${BASE}/active-sessions/${selCampus}`);
      setActiveSessions(r.data.data || []);
      setError("");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load active sessions.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSession = async (sessionId: number) => {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      return;
    }
    setExpandedSessionId(sessionId);
    if (!sections[sessionId]) {
      try {
        const res = await API.get(`${BASE}/sections/${sessionId}`);
        const sessionSections = res.data.data || [];
        setSections(prev => ({ ...prev, [sessionId]: sessionSections }));

        // Fetch teachers for each section
        sessionSections.forEach(async (sec: Section) => {
          const tRes = await API.get(`${BASE}/enrolled/${sec.id}`);
          setTeachers(prev => ({ ...prev, [sec.id]: tRes.data.data || [] }));
        });
      } catch (err) {
        console.error("Failed to load details", err);
      }
    }
  };

  return (
    <div className="se-page">
      <div className="se-header">
        <div>
          <h1 className="se-title">Active Session Info</h1>
          <p className="se-subtitle">View detailed information about all active sessions.</p>
        </div>
      </div>

      {error && <div className="se-banner se-banner-error" style={{ marginBottom: "1rem" }}>{error}</div>}

      <div className="se-card se-form-card" style={{ marginBottom: "1.5rem" }}>
        <h2 className="se-card-title">Select Campus Filter</h2>
        <div className="se-fields">
          <div className="se-field">
            <label className="se-label">University / School</label>
            <select className="se-select" value={selUniversity} onChange={e => setSelUniversity(e.target.value)}>
              <option value="">-- Select --</option>
              {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="se-field">
            <label className="se-label">Campus / Branch</label>
            <select className="se-select" value={selCampus} onChange={e => setSelCampus(e.target.value)} disabled={!campuses.length}>
              <option value="">-- Select --</option>
              {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {selCampus && (
        <div className="se-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 className="se-card-title" style={{ margin: 0 }}>Active Sessions List</h2>
            <div style={{ background: "var(--accent)", color: "#fff", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "bold" }}>
              Total: {activeSessions.length}
            </div>
          </div>

          {loading ? (
            <p>Loading sessions...</p>
          ) : activeSessions.length === 0 ? (
            <p>No active sessions found for this campus.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {activeSessions.map(session => (
                <div key={session.id} style={{ border: "1px solid var(--card-border)", borderRadius: "8px", overflow: "hidden" }}>
                  <div 
                    style={{ padding: "1rem", background: "var(--input-bg)", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                    onClick={() => toggleSession(session.id)}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--text-dark)" }}>{session.title || "Untitled Session"}</h3>
                      <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "var(--text-dark-sub)" }}>
                        ID: {session.id} | Program ID: {session.program_id} | Class ID: {session.class_id}
                      </p>
                    </div>
                    <div>
                      <span style={{ fontSize: "1.5rem", color: "var(--text-dark-sub)" }}>
                        {expandedSessionId === session.id ? "−" : "+"}
                      </span>
                    </div>
                  </div>

                  {expandedSessionId === session.id && (
                    <div style={{ padding: "1rem", background: "var(--card-bg)", borderTop: "1px solid var(--card-border)" }}>
                      <h4 style={{ margin: "0 0 0.5rem 0", color: "var(--text-dark)" }}>Sections & Assignments</h4>
                      {!sections[session.id] ? (
                        <p style={{ fontSize: "0.9rem", color: "var(--text-dark-sub)" }}>Loading sections...</p>
                      ) : sections[session.id].length === 0 ? (
                        <p style={{ fontSize: "0.9rem", color: "var(--text-dark-sub)" }}>No sections linked to this session.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          {sections[session.id].map(sec => (
                            <div key={sec.id} style={{ padding: "0.75rem", border: "1px dashed var(--card-border)", borderRadius: "6px" }}>
                              <h5 style={{ margin: "0 0 0.5rem 0", color: "var(--text-dark)" }}>{sec.name} (ID: {sec.section_id})</h5>
                              
                              {!teachers[sec.id] ? (
                                <p style={{ fontSize: "0.85rem", color: "var(--text-dark-sub)", margin: 0 }}>Loading teachers...</p>
                              ) : teachers[sec.id].length === 0 ? (
                                <p style={{ fontSize: "0.85rem", color: "var(--text-dark-sub)", margin: 0 }}>No teachers assigned to this section.</p>
                              ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginTop: "0.5rem" }}>
                                  <thead>
                                    <tr style={{ borderBottom: "1px solid var(--card-border)", textAlign: "left", color: "var(--text-dark)" }}>
                                      <th style={{ padding: "0.5rem 0.25rem" }}>Teacher</th>
                                      <th style={{ padding: "0.5rem 0.25rem" }}>Reg No</th>
                                      <th style={{ padding: "0.5rem 0.25rem" }}>Courses</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {teachers[sec.id].map(t => (
                                      <tr key={t.id} style={{ borderBottom: "1px solid var(--card-border)", color: "var(--text-dark-sub)" }}>
                                        <td style={{ padding: "0.5rem 0.25rem" }}>{t.name}</td>
                                        <td style={{ padding: "0.5rem 0.25rem" }}>{t.reg_no}</td>
                                        <td style={{ padding: "0.5rem 0.25rem" }}>
                                          {t.courses.map(c => c.name).join(", ") || "-"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActiveSessionInfoPage;

import React, { useState, useEffect } from "react";
import API from "../../../api/api";
import "./StudentEnrollmentPage.css";

const BASE = "/academic/teacher-enrollment";

type Option = { id: number; name: string; title?: string; semester?: string };

const ActiveSessionManagementPage: React.FC = () => {
  const [universities, setUniversities] = useState<Option[]>([]);
  const [campuses, setCampuses] = useState<Option[]>([]);
  const [lookupPrograms, setLookupPrograms] = useState<Option[]>([]);
  const [lookupClasses, setLookupClasses] = useState<Option[]>([]);
  const [lookupSemesters, setLookupSemesters] = useState<Option[]>([]);
  const [lookupBoards, setLookupBoards] = useState<Option[]>([]);
  const [lookupAcadSessions, setLookupAcadSessions] = useState<Option[]>([]);
  
  // Section Mgmt Lookups
  const [activeSessionsList, setActiveSessionsList] = useState<Option[]>([]);
  const [lookupAllSections, setLookupAllSections] = useState<Option[]>([]);

  // States for Active Session Form
  const [instType, setInstType] = useState<"university" | "school">("university");
  const [selUniversity, setSelUniversity] = useState("");
  const [selCampus, setSelCampus] = useState("");
  const [newSessTitle, setNewSessTitle] = useState("");
  const [newSessAcad, setNewSessAcad] = useState("");
  const [newSessProg, setNewSessProg] = useState("");
  const [newSessClass, setNewSessClass] = useState("");
  const [newSessBoard, setNewSessBoard] = useState("");

  // States for Section Form
  const [selTargetSession, setSelTargetSession] = useState("");
  const [newSecGlobalId, setNewSecGlobalId] = useState("");

  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Load Initial Lookups
  useEffect(() => {
    API.get(`${BASE}/universities`).then(r => setUniversities(r.data.data || []));
    API.get(`${BASE}/lookup/sessions`).then(r => setLookupAcadSessions(r.data.data || []));
    API.get(`${BASE}/lookup/classes`).then(r => setLookupClasses(r.data.data || []));
    API.get(`${BASE}/lookup/sections`).then(r => setLookupAllSections(r.data.data || []));
  }, []);

  // When University changes -> load Campus
  useEffect(() => {
    setCampuses([]); setSelCampus(""); setLookupPrograms([]); setLookupBoards([]); setActiveSessionsList([]);
    if (!selUniversity) return;
    API.get(`${BASE}/campuses/${selUniversity}`).then(r => setCampuses(r.data.data || []));
  }, [selUniversity]);

  // When Campus or InstType changes -> load Programs, Boards, and existing Active Sessions
  useEffect(() => {
    if (!selCampus) return;
    setNewSessProg(""); // Reset program selection when toggling types
    setLookupSemesters([]);
    if (instType === "university") {
      API.get(`${BASE}/lookup/semesters?branch_id=${selCampus}`).then(r => setLookupSemesters(r.data.data || []));
    }
    API.get(`${BASE}/lookup/programs?branch_id=${selCampus}&institution_type=${instType}`).then(r => setLookupPrograms(r.data.data || []));
    API.get(`${BASE}/lookup/boards?branch_id=${selCampus}&institution_type=${instType}`).then(r => setLookupBoards(r.data.data || []));
    API.get(`${BASE}/active-sessions/${selCampus}`).then(r => setActiveSessionsList(r.data.data || []));
  }, [selCampus, instType]);

  const submitCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selCampus || !newSessTitle || !newSessAcad || !newSessProg || !newSessClass || !newSessBoard) return;
    try {
      setSaving(true);
      await API.post(`${BASE}/create-session`, {
        title: newSessTitle, branch_id: Number(selCampus),
        session_id: Number(newSessAcad), program_id: Number(newSessProg),
        class_id: Number(newSessClass), board_id: Number(newSessBoard)
      });
      setBanner({ type: "success", msg: "Active Session created successfully!" });
      setNewSessTitle(""); setNewSessAcad(""); setNewSessProg(""); setNewSessClass(""); setNewSessBoard("");
      // reload active sessions
      const r = await API.get(`${BASE}/active-sessions/${selCampus}`);
      setActiveSessionsList(r.data.data || []);
    } catch (err: any) {
      setBanner({ type: "error", msg: err?.response?.data?.message || "Failed to create session." });
    } finally { setSaving(false); }
  };

  const submitAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selTargetSession || !newSecGlobalId) return;
    try {
      setSaving(true);
      await API.post(`${BASE}/add-section`, {
        active_session_id: Number(selTargetSession),
        section_id: Number(newSecGlobalId)
      });
      setBanner({ type: "success", msg: "Section successfully mapped to Active Session!" });
      setNewSecGlobalId("");
    } catch (err: any) {
      setBanner({ type: "error", msg: err?.response?.data?.message || "Failed to add section." });
    } finally { setSaving(false); }
  };

  return (
    <div className="se-page">
      <div className="se-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 className="se-title">Session Management</h1>
          <p className="se-subtitle">Create new academic sessions and map sections.</p>
        </div>
        
        {/* ── Role Toggle ── */}
        <div style={{ display: "flex", gap: "0.5rem", padding: "0.3rem", background: "var(--input-bg)", borderRadius: "10px", border: "1px solid var(--card-border)" }}>
          {(["university", "school"] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setInstType(type)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "7px",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.82rem",
                transition: "all 0.18s",
                background: instType === type ? "var(--accent)" : "transparent",
                color: instType === type ? "#fff" : "var(--text-dark-sub)",
                boxShadow: instType === type ? "0 2px 8px rgba(15,76,129,0.25)" : "none",
              }}
            >
              {type === "university" ? "University" : "School"}
            </button>
          ))}
        </div>
      </div>

      {banner && (
        <div className={`se-banner ${banner.type === "success" ? "se-banner-success" : "se-banner-error"}`} style={{ marginBottom: "1rem" }}>
          {banner.msg}
        </div>
      )}

      {/* Campus Selector (Needed for both forms) */}
      <div className="se-card se-form-card" style={{ marginBottom: "1rem" }}>
        <h2 className="se-card-title">1. Select Campus</h2>
        <div className="se-fields">
          <div className="se-field">
            <label className="se-label">University / School <span className="se-req">*</span></label>
            <select className="se-select" value={selUniversity} onChange={e => setSelUniversity(e.target.value)}>
              <option value="">-- Select --</option>
              {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="se-field">
            <label className="se-label">Campus / Branch <span className="se-req">*</span></label>
            <select className="se-select" value={selCampus} onChange={e => setSelCampus(e.target.value)} disabled={!campuses.length}>
              <option value="">-- Select --</option>
              {campuses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {selCampus && (
        <>
          {/* Create Active Session Form */}
          <div className="se-card se-form-card" style={{ marginBottom: "1rem" }}>
            <h2 className="se-card-title">2. Create New {instType === "university" ? "Semester Batch" : "Academic Session"}</h2>
            <form onSubmit={submitCreateSession}>
              <div className="se-fields se-fields-3">
                <div className="se-field">
                  <label className="se-label">Session Title <span className="se-req">*</span></label>
                  <input className="se-input" required placeholder={instType === "university" ? "e.g. BS-CS Fall 2024" : "e.g. Matric 2024-2025"} value={newSessTitle} onChange={e => setNewSessTitle(e.target.value)} />
                </div>
                <div className="se-field">
                  <label className="se-label">Academic Year <span className="se-req">*</span></label>
                  <select className="se-select" required value={newSessAcad} onChange={e => setNewSessAcad(e.target.value)}>
                    <option value="">-- Select --</option>
                    {lookupAcadSessions.map(x => <option key={x.id} value={x.id}>{x.title || x.name}</option>)}
                  </select>
                </div>
                <div className="se-field">
                  <label className="se-label">{instType === "university" ? "Program / Degree" : "Study Group / Curriculum"} <span className="se-req">*</span></label>
                  <select className="se-select" required value={newSessProg} onChange={e => setNewSessProg(e.target.value)}>
                    <option value="">-- Select --</option>
                    {lookupPrograms.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                </div>
                <div className="se-field">
                  <label className="se-label">{instType === "university" ? "Semester" : "Grade / Class"} <span className="se-req">*</span></label>
                  <select className="se-select" required value={newSessClass} onChange={e => setNewSessClass(e.target.value)}>
                    <option value="">-- Select --</option>
                    {(instType === "university" ? lookupSemesters : lookupClasses).map(x => (
                      <option key={x.id} value={x.id}>{instType === "university" ? x.semester || x.name : x.name}</option>
                    ))}
                  </select>
                </div>
                <div className="se-field">
                  <label className="se-label">Board / Univ <span className="se-req">*</span></label>
                  <select className="se-select" required value={newSessBoard} onChange={e => setNewSessBoard(e.target.value)}>
                    <option value="">-- Select --</option>
                    {lookupBoards.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: "1rem" }}>
                <button type="submit" className="se-btn se-btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Create Active Session"}
                </button>
              </div>
            </form>
          </div>

          {/* Map Section to Session */}
          <div className="se-card se-form-card">
            <h2 className="se-card-title">3. Link Section to an Active Session</h2>
            <form onSubmit={submitAddSection}>
              <div className="se-fields">
                <div className="se-field">
                  <label className="se-label">Active Session <span className="se-req">*</span></label>
                  <select className="se-select" required value={selTargetSession} onChange={e => setSelTargetSession(e.target.value)}>
                    <option value="">-- Select --</option>
                    {activeSessionsList.map(x => <option key={x.id} value={x.id}>{x.title || x.name}</option>)}
                  </select>
                </div>
                <div className="se-field">
                  <label className="se-label">Global Section <span className="se-req">*</span></label>
                  <select className="se-select" required value={newSecGlobalId} onChange={e => setNewSecGlobalId(e.target.value)}>
                    <option value="">-- Select --</option>
                    {lookupAllSections.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: "1rem" }}>
                <button type="submit" className="se-btn se-btn-primary" disabled={saving || !activeSessionsList.length}>
                  {saving ? "Saving..." : "Add Section to Session"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ActiveSessionManagementPage;

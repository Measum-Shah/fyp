import React, { useState, useEffect, useCallback } from "react";
import API from "../../../../api/api";
import "../../pages/StudentEnrollmentPage.css"; /* reuse same CSS tokens */

/* â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
type Option       = { id: number; name?: string; title?: string };
type CourseOption = Option & { subject_code?: string; credit_hours?: number };
type StaffOption  = Option & { reg_no?: string; designation?: string };
type EnrolledTeacher = {
  id: number; staff_id: number; name: string;
  reg_no?: string; designation?: string; courses: CourseOption[];
};

const BASE = "/academic/teacher-enrollment";

const TeacherEnrollmentPage: React.FC = () => {
  /* â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const [universities, setUniversities] = useState<Option[]>([]);
  const [campuses,     setCampuses]     = useState<Option[]>([]);
  const [sessions,     setSessions]     = useState<Option[]>([]);
  const [sections,     setSections]     = useState<Option[]>([]);
  const [staffList,    setStaffList]    = useState<StaffOption[]>([]);
  const [courses,      setCourses]      = useState<CourseOption[]>([]);
  const [enrolled,     setEnrolled]     = useState<EnrolledTeacher[]>([]);

  const [selUniversity, setSelUniversity] = useState("");
  const [selCampus,     setSelCampus]     = useState("");
  const [selSession,    setSelSession]    = useState("");
  const [selSection,    setSelSection]    = useState("");
  const [selStaff,      setSelStaff]      = useState("");
  const [selCourses,    setSelCourses]    = useState<number[]>([]);

  const [staffType, setStaffType] = useState<"lecturer" | "teacher">("lecturer");
  const institutionType = staffType === "lecturer" ? "university" : "school";

  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const lookupError = (message: string) =>
    setBanner({ type: "error", msg: `Unable to load enrollment options: ${message}` });

  /* â”€â”€ Data loading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  useEffect(() => {
    API.get(`${BASE}/universities`)
      .then(r => setUniversities(r.data.data || []))
      .catch(err => lookupError(err?.response?.data?.message || "check the server connection."));
  }, []);

  useEffect(() => {
    setCampuses([]); setSelCampus(""); setSessions([]); setSelSession("");
    setSections([]); setSelSection(""); setStaffList([]); setSelStaff(""); setCourses([]); setSelCourses([]);
    if (!selUniversity) return;
    API.get(`${BASE}/campuses/${selUniversity}`)
      .then(r => setCampuses(r.data.data || []))
      .catch(err => lookupError(err?.response?.data?.message || "check the server connection."));
  }, [selUniversity]);

  useEffect(() => {
    setSessions([]); setSelSession(""); setSections([]); setSelSection("");
    setStaffList([]); setSelStaff(""); setCourses([]); setSelCourses([]);
    if (!selCampus) return;
    API.get(`${BASE}/active-sessions/${selCampus}`)
      .then(r => setSessions(r.data.data || []))
      .catch(err => lookupError(err?.response?.data?.message || "check the server connection."));
  }, [selCampus]);

  useEffect(() => {
    setSections([]); setSelSection(""); setStaffList([]); setSelStaff(""); setCourses([]); setSelCourses([]);
    if (!selSession) return;
    API.get(`${BASE}/sections/${selSession}`)
      .then(r => setSections(r.data.data || []))
      .catch(err => lookupError(err?.response?.data?.message || "check the server connection."));
  }, [selSession]);

  const loadSectionData = useCallback(() => {
    if (!selSection || !selSession) return;
    API.get(`${BASE}/staff`, { params: { branch_id: selCampus, staff_type: staffType } })
      .then(r => setStaffList(r.data.data || []))
      .catch(err => lookupError(err?.response?.data?.message || "check the server connection."));
    API.get(`${BASE}/courses`, { params: { active_session_id: selSession, institution_type: institutionType } })
      .then(r => setCourses(r.data.data || []))
      .catch(err => lookupError(err?.response?.data?.message || "check the server connection."));
    API.get(`${BASE}/enrolled/${selSection}`)
      .then(r => setEnrolled(r.data.data || []))
      .catch(err => lookupError(err?.response?.data?.message || "check the server connection."));
  }, [selSection, selSession, selCampus, staffType, institutionType]);

  useEffect(() => {
    setSelStaff(""); setSelCourses([]);
    loadSectionData();
  }, [loadSectionData]);

  /* â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const toggleCourse = (id: number) =>
    setSelCourses(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selSection || !selStaff || selCourses.length === 0)
      return setBanner({ type: "error", msg: "Please select section, staff and at least one subject." });
    try {
      setSaving(true);
      await API.post(`${BASE}/assign`, {
        active_session_section_id: Number(selSection),
        staff_id: Number(selStaff),
        course_ids: selCourses,
      });
      setBanner({ type: "success", msg: "Teacher assigned successfully!" });
      setSelStaff(""); setSelCourses([]);
      const r = await API.get(`${BASE}/enrolled/${selSection}`);
      setEnrolled(r.data.data || []);
    } catch (err: any) {
      setBanner({ type: "error", msg: err?.response?.data?.message || "Assignment failed." });
    } finally { setSaving(false); }
  };

  const handleRemove = useCallback(async (id: number) => {
    if (!window.confirm("Remove this assignment?")) return;
    try {
      await API.delete(`${BASE}/remove/${id}`);
      setEnrolled(prev => prev.filter(e => e.id !== id));
      setBanner({ type: "success", msg: "Assignment removed." });
    } catch { setBanner({ type: "error", msg: "Failed to remove." }); }
  }, []);

  /* â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  return (
    <div className="se-page">

      {/* â”€â”€ Page Header â”€â”€ */}
      <div className="se-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 className="se-title">Teacher Enrollment</h1>
          <p className="se-subtitle">
            Assign {staffType === "lecturer" ? "Lecturers (University)" : "Teachers (School)"} to sections and subjects
          </p>
        </div>
        {/* â”€â”€ Role Toggle â”€â”€ */}
        <div style={{ display: "flex", gap: "0.5rem", padding: "0.3rem", background: "var(--input-bg)", borderRadius: "10px", border: "1px solid var(--card-border)" }}>
          {(["lecturer", "teacher"] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setStaffType(type)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "7px",
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "0.82rem",
                transition: "all 0.18s",
                background: staffType === type ? "var(--accent)" : "transparent",
                color: staffType === type ? "#fff" : "var(--text-dark-sub)",
                boxShadow: staffType === type ? "0 2px 8px rgba(15,76,129,0.25)" : "none",
              }}
            >
              {type === "lecturer" ? "Lecturer (University)" : "Teacher (School)"}
            </button>
          ))}
        </div>
      </div>

      {/* â”€â”€ Banner â”€â”€ */}
      {banner && (
        <div className={`se-banner ${banner.type === "success" ? "se-banner-success" : "se-banner-error"}`}
          style={{ marginBottom: "1rem" }}>
          {banner.msg}
        </div>
      )}

      {/* â”€â”€ Step 1: Location & Session â”€â”€ */}
      <div className="se-card se-form-card" style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--card-border)" }}>
          <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>1</span>
          <h2 className="se-card-title" style={{ margin: 0, border: 0, padding: 0 }}>Select Location &amp; Session</h2>
        </div>

        <div className="se-fields se-fields-3" style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
          {/* University */}
          <div className="se-field">
            <label className="se-label">University / School <span className="se-req">*</span></label>
            <select className="se-select" value={selUniversity} onChange={e => setSelUniversity(e.target.value)}>
              <option value="">-- Select --</option>
              {universities.map(u => <option key={u.id} value={u.id}>{u.name || u.title}</option>)}
            </select>
          </div>

          {/* Campus */}
          <div className="se-field">
            <label className="se-label">Campus / Branch <span className="se-req">*</span></label>
            <select className="se-select" value={selCampus} onChange={e => setSelCampus(e.target.value)} disabled={!campuses.length}>
              <option value="">-- Select --</option>
              {campuses.map(c => <option key={c.id} value={c.id}>{c.name || c.title}</option>)}
            </select>
          </div>

          {/* Session */}
          <div className="se-field">
            <label className="se-label">Active Session / Batch <span className="se-req">*</span></label>
            <select className="se-select" value={selSession} onChange={e => setSelSession(e.target.value)} disabled={!sessions.length}>
              <option value="">-- Select --</option>
              {sessions.map(s => <option key={s.id} value={s.id}>{s.title || s.name}</option>)}
            </select>
          </div>

          {/* Section */}
          <div className="se-field">
            <label className="se-label">Section <span className="se-req">*</span></label>
            <select className="se-select" value={selSection} onChange={e => setSelSection(e.target.value)} disabled={!sections.length}>
              <option value="">-- Select --</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name || s.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* â”€â”€ Step 2: Assign â”€â”€ */}
      {selSection && (
        <div className="se-card se-form-card" style={{ marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--card-border)" }}>
            <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>2</span>
            <h2 className="se-card-title" style={{ margin: 0, border: 0, padding: 0 }}>
              Assign {staffType === "lecturer" ? "Lecturer" : "Teacher"} &amp; Subjects
            </h2>
          </div>

          <form onSubmit={handleAssign}>
            {/* Staff select */}
            <div className="se-fields" style={{ gridTemplateColumns: "1fr", marginBottom: "1.1rem" }}>
              <div className="se-field">
                <label className="se-label">
                  Select {staffType === "lecturer" ? "Lecturer" : "Teacher"} <span className="se-req">*</span>
                </label>
                <select className="se-select" value={selStaff} onChange={e => setSelStaff(e.target.value)} required>
                  <option value="">-- Select Staff --</option>
                  {staffList.length === 0
                    ? <option disabled>No {staffType}s found for this campus</option>
                    : staffList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name}{s.reg_no ? ` (${s.reg_no})` : ""}{s.designation ? ` - ${s.designation}` : ""}
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>

            {/* Subject multi-select */}
            <div style={{ marginBottom: "1.25rem" }}>
              <p className="se-label" style={{ marginBottom: "0.6rem" }}>
                {institutionType === "university" ? "University" : "School"} Subjects
                <span style={{ fontWeight: 400, marginLeft: "0.4rem", color: "var(--accent)" }}>
                  {selCourses.length > 0 ? `(${selCourses.length} selected)` : ""}
                </span>
              </p>

              {courses.length === 0 ? (
                <div style={{ padding: "1rem", border: "1px dashed var(--card-border)", borderRadius: "8px", textAlign: "center", color: "var(--text-dark-sub)", fontSize: "0.83rem" }}>
                  No subjects found for this session and institution type.
                </div>
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
                  gap: "0.45rem",
                  maxHeight: "280px",
                  overflowY: "auto",
                  padding: "0.6rem",
                  border: "1px solid var(--input-border, rgba(15,76,129,0.18))",
                  borderRadius: "8px",
                  background: "var(--input-bg)"
                }}>
                  {courses.map(c => {
                    const checked = selCourses.includes(c.id);
                    return (
                      <label key={c.id} style={{
                        display: "flex", alignItems: "flex-start", gap: "0.5rem",
                        padding: "0.55rem 0.65rem", borderRadius: "7px", cursor: "pointer",
                        background: checked ? "rgba(15,76,129,0.1)" : "transparent",
                        border: `1px solid ${checked ? "var(--accent)" : "transparent"}`,
                        transition: "all 0.15s"
                      }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCourse(c.id)}
                          style={{ marginTop: "2px", accentColor: "var(--accent)", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.8rem", color: "var(--text-dark)", lineHeight: 1.4 }}>
                          <strong style={{ display: "block", fontSize: "0.78rem" }}>
                            {c.subject_code || ""}
                          </strong>
                          {c.name}
                          {c.credit_hours ? (
                            <span style={{ color: "var(--text-dark-sub)", fontSize: "0.72rem" }}> &middot; {c.credit_hours} cr</span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="se-btn se-btn-primary"
              disabled={saving || !selStaff || selCourses.length === 0}
            >
              {saving ? "Saving..." : `Assign ${staffType === "lecturer" ? "Lecturer" : "Teacher"}`}
            </button>
          </form>
        </div>
      )}

      {/* ── Enrolled List ── */}
      {selSection && (
        <div className="se-card se-recent-card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--card-border)" }}>
            <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: enrolled.length > 0 ? "#0d7a4f" : "var(--text-dark-sub)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>✓</span>
            <h2 className="se-card-title" style={{ margin: 0, border: 0, padding: 0 }}>
              Assigned Staff in This Section
              <span style={{ marginLeft: "0.5rem", padding: "0.15rem 0.55rem", borderRadius: "20px", fontSize: "0.7rem", background: "var(--input-bg)", border: "1px solid var(--card-border)", fontWeight: 400 }}>
                {enrolled.length}
              </span>
            </h2>
          </div>

          {enrolled.length === 0 ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-dark-sub)", fontSize: "0.85rem" }}>
              No teachers assigned yet. Use the form above to assign.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.83rem", color: "var(--text-dark)" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--card-border)" }}>
                    {["#", "Name", "Reg No", "Designation", "Assigned Subjects", ""].map(h => (
                      <th key={h} style={{ padding: "0.65rem 0.75rem", textAlign: "left", fontWeight: 700, fontSize: "0.72rem", color: "var(--text-dark-sub)", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {enrolled.map((t, i) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid var(--card-border)" }}>
                      <td style={{ padding: "0.75rem", color: "var(--text-dark-sub)", fontSize: "0.72rem" }}>{i + 1}</td>
                      <td style={{ padding: "0.75rem", fontWeight: 700 }}>{t.name}</td>
                      <td style={{ padding: "0.75rem" }}>{t.reg_no || ""}</td>
                      <td style={{ padding: "0.75rem" }}>
                        {t.designation ? (
                          <span style={{
                            padding: "0.2rem 0.6rem", borderRadius: "20px", fontSize: "0.72rem", fontWeight: 600,
                            background: t.designation.toLowerCase().includes("lecturer") ? "rgba(15,76,129,0.1)" : "rgba(13,122,79,0.1)",
                            color: t.designation.toLowerCase().includes("lecturer") ? "var(--accent)" : "#0d7a4f"
                          }}>
                            {t.designation}
                          </span>
                        ) : ""}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                          {t.courses.length === 0
                            ? <span style={{ color: "var(--text-dark-sub)" }}></span>
                            : t.courses.map(c => (
                              <span key={c.id} style={{
                                padding: "0.18rem 0.5rem", borderRadius: "5px", fontSize: "0.7rem",
                                background: "var(--input-bg)", border: "1px solid var(--card-border)"
                              }}>
                                {c.subject_code || c.name}
                              </span>
                            ))
                          }
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        <button
                          type="button"
                          onClick={() => handleRemove(t.id)}
                          className="se-btn se-btn-secondary"
                          style={{ fontSize: "0.75rem", padding: "0.35rem 0.7rem", color: "#c0392b", borderColor: "rgba(192,57,43,0.3)" }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherEnrollmentPage;

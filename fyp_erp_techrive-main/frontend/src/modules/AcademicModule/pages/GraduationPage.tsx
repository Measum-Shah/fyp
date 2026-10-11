import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "./AcademicLayout";

const API_BASE = "http://localhost:5000/api";

const GraduationPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchingLookups, setFetchingLookups] = useState(true);
  const [formData, setFormData] = useState({ program_id: "", term_id: "" });
  const [students, setStudents] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"graduate" | "alumni">("graduate");
  const [alumni, setAlumni] = useState<any[]>([]);
  const [alumniLoading, setAlumniLoading] = useState(false);

  const [lookups, setLookups] = useState<{
    programs: { id: number; name: string }[];
    terms: { id: number; name: string; start_year: string; end_year: string }[];
  }>({ programs: [], terms: [] });

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const token = localStorage.getItem("erp_token");
        const res = await axios.get(`${API_BASE}/academic/lookups/result-lookups`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setLookups(res.data.data);
        }
      } catch (err: any) {
        toast.error("Lookup Error", "Failed to load programs and terms.");
      } finally {
        setFetchingLookups(false);
      }
    };
    fetchLookups();
  }, []);

  const cardStyle: React.CSSProperties = {
    background: "var(--card-bg, #fff)",
    border: "1px solid var(--card-border, #e5e7eb)",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--card-border, #e5e7eb)",
    background: "var(--input-bg, #f9fafb)",
    color: "var(--text-dark, #111)",
    fontSize: "14px",
  };

  const fetchEligibleStudents = async () => {
    if (!formData.program_id || !formData.term_id) {
      toast.warning("Missing Fields", "Please select Program and Final Term.");
      return;
    }
    try {
      setFetching(true);
      const token = localStorage.getItem("erp_token");
      const res = await axios.get(`${API_BASE}/academic/alumni/eligible`, {
        params: { program_id: formData.program_id, term_id: formData.term_id },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setStudents(res.data.data);
        setSelectedIds([]);
      }
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || err.message);
    } finally {
      setFetching(false);
    }
  };

  const fetchAlumni = async () => {
    try {
      setAlumniLoading(true);
      const token = localStorage.getItem("erp_token");
      const res = await axios.get(`${API_BASE}/academic/alumni/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setAlumni(res.data.data);
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || err.message);
    } finally {
      setAlumniLoading(false);
    }
  };

  const handleTabChange = (tab: "graduate" | "alumni") => {
    setActiveTab(tab);
    if (tab === "alumni" && alumni.length === 0) fetchAlumni();
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedIds(e.target.checked ? students.map((s) => s.id) : []);
  };

  const handleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleGraduate = async () => {
    if (selectedIds.length === 0) {
      toast.warning("No Selection", "Select at least one student.");
      return;
    }
    if (!window.confirm(`Graduate ${selectedIds.length} student(s) and mark them as Alumni?`)) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("erp_token");
      const res = await axios.post(
        `${API_BASE}/academic/alumni/graduate`,
        { studentIds: selectedIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Graduated!", `${selectedIds.length} student(s) marked as Alumni.`);
        fetchEligibleStudents();
        setAlumni([]); // reset so alumni tab refreshes
      }
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const thStyle: React.CSSProperties = {
    padding: "10px 14px",
    textAlign: "left",
    fontWeight: 600,
    color: "var(--text-dark)",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    background: "var(--input-bg, #f9fafb)",
    borderBottom: "2px solid var(--card-border)",
  };

  const tdStyle: React.CSSProperties = {
    padding: "11px 14px",
    color: "var(--text-dark)",
    verticalAlign: "middle",
    borderBottom: "1px solid var(--card-border)",
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: 0, color: "var(--text-dark)", fontSize: "1.5rem", fontWeight: 700 }}>
          Graduation & Alumni Management
        </h2>
        <p style={{ margin: "6px 0 0", color: "var(--text-secondary, #6b7280)", fontSize: "0.875rem" }}>
          Mark final-term students as Alumni and view the Alumni Directory
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
        {(["graduate", "alumni"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: "1px solid var(--card-border)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "14px",
              background: activeTab === tab ? "var(--accent, #4f46e5)" : "var(--card-bg, #fff)",
              color: activeTab === tab ? "#fff" : "var(--text-dark)",
              transition: "all 0.15s",
            }}
          >
            {tab === "graduate" ? (
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
                Graduate Students
              </span>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                </svg>
                Alumni Directory
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB 1: Graduate Students ── */}
      {activeTab === "graduate" && (
        <>
          <div style={cardStyle}>
            <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600, color: "var(--text-dark)" }}>
              Find Students in Final Term
            </h3>
            
            {fetchingLookups ? (
              <div style={{ padding: "1rem 0", color: "var(--text-secondary)" }}>Loading options...</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "1rem", alignItems: "flex-end" }}>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "var(--text-dark)" }}>Program</label>
                  <select
                    value={formData.program_id}
                    onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">-- Select Program --</option>
                    {lookups.programs.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, fontWeight: 600, color: "var(--text-dark)" }}>Final Term / Semester</label>
                  <select
                    value={formData.term_id}
                    onChange={(e) => setFormData({ ...formData, term_id: e.target.value })}
                    style={inputStyle}
                  >
                    <option value="">-- Select Term --</option>
                    {lookups.terms.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} {t.start_year ? `(${t.start_year})` : ''}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={fetchEligibleStudents}
                  disabled={fetching}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: "var(--accent, #4f46e5)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "14px",
                    cursor: fetching ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {fetching ? "Searching..." : "Search"}
                </button>
              </div>
            )}
          </div>

          {students.length > 0 && (
            <div style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--text-dark)" }}>
                  Eligible Students ({students.length})
                </h3>
                <button
                  onClick={handleGraduate}
                  disabled={loading || selectedIds.length === 0}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "8px",
                    border: "none",
                    background: selectedIds.length === 0 ? "var(--card-border)" : "#16a34a",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "14px",
                    cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? (
                    "Processing..."
                  ) : (
                    <span style={{ display: "inline-flex", alignItems: "center" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                      </svg>
                      Graduate Selected ({selectedIds.length})
                    </span>
                  )}
                </button>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: 44 }}>
                        <input
                          type="checkbox"
                          onChange={handleSelectAll}
                          checked={selectedIds.length === students.length && students.length > 0}
                        />
                      </th>
                      <th style={thStyle}>Student ID</th>
                      <th style={thStyle}>Reg. No</th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Current Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s.id} style={{ background: i % 2 === 0 ? "var(--card-bg)" : "var(--input-bg, #f9fafb)" }}>
                        <td style={tdStyle}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(s.id)}
                            onChange={() => handleSelect(s.id)}
                          />
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{s.id}</td>
                        <td style={tdStyle}>{s.reg_no || "—"}</td>
                        <td style={tdStyle}>{s.mt_email || "—"}</td>
                        <td style={tdStyle}>
                          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(79,70,229,0.1)", color: "var(--accent, #4f46e5)" }}>
                            {s.admission_status || "Active"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {students.length === 0 && formData.program_id && !fetching && (
            <div style={{ ...cardStyle, textAlign: "center", color: "var(--text-secondary, #6b7280)", padding: "2rem" }}>
              No eligible active students found for this program and term.
            </div>
          )}
        </>
      )}

      {/* ── TAB 2: Alumni Directory ── */}
      {activeTab === "alumni" && (
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "var(--text-dark)" }}>
              Alumni Directory
            </h3>
            <button
              onClick={fetchAlumni}
              style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid var(--card-border)", background: "var(--card-bg)", color: "var(--text-dark)", fontSize: 13, cursor: "pointer" }}
            >
              <span style={{ display: "inline-flex", alignItems: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Refresh
              </span>
            </button>
          </div>

          {alumniLoading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>Loading...</div>
          ) : alumni.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
              No alumni found. Graduate students first to see them here.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Reg. No</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Program ID</th>
                    <th style={thStyle}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {alumni.map((a, i) => (
                    <tr key={a.id} style={{ background: i % 2 === 0 ? "var(--card-bg)" : "var(--input-bg, #f9fafb)" }}>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>{a.id}</td>
                      <td style={tdStyle}>{a.reg_no || "—"}</td>
                      <td style={tdStyle}>{a.mt_email || "—"}</td>
                      <td style={tdStyle}>{a.program_id || "—"}</td>
                      <td style={tdStyle}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(22,163,74,0.12)", color: "#16a34a" }}>
                          {a.admission_status}
                        </span>
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

export default GraduationPage;

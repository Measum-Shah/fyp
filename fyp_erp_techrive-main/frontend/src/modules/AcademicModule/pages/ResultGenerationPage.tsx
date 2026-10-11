import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "./AcademicLayout";

const API_BASE = "http://localhost:5000/api";

const ResultGenerationPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fetchingLookups, setFetchingLookups] = useState(true);
  const [formData, setFormData] = useState({
    program_id: "",
    session_id: "",
    term_id: "",
  });
  const [results, setResults] = useState<any[]>([]);
  
  const [lookups, setLookups] = useState<{
    programs: { id: number; name: string }[];
    sessions: { id: number; title: string; start_year: string; end_year: string }[];
    terms: { id: number; name: string; start_year: string; end_year: string }[];
  }>({ programs: [], sessions: [], terms: [] });

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
        toast.error("Lookup Error", "Failed to load programs, sessions, and terms.");
      } finally {
        setFetchingLookups(false);
      }
    };
    fetchLookups();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerate = async () => {
    if (!formData.program_id || !formData.term_id || !formData.session_id) {
      toast.warning("Missing Fields", "Please select all fields.");
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem("erp_token");
      const res = await axios.post(
        `${API_BASE}/academic/results/generate`,
        {
          program_id: parseInt(formData.program_id),
          term_id: parseInt(formData.term_id),
          session_id: parseInt(formData.session_id),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        toast.success("Results Generated", "Batch results have been calculated successfully.");
        setResults(res.data.data || []);
      }
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

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

  const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-dark, #374151)",
  };

  return (
    <div style={{ padding: "1.5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ margin: 0, color: "var(--text-dark)", fontSize: "1.5rem", fontWeight: 700 }}>
          Result Generation
        </h2>
        <p style={{ margin: "6px 0 0", color: "var(--text-secondary, #6b7280)", fontSize: "0.875rem" }}>
          Generate term-wise GPA/CGPA results for a batch of students
        </p>
      </div>

      {/* Form Card */}
      <div style={cardStyle}>
        <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600, color: "var(--text-dark)" }}>
          Select Batch
        </h3>
        
        {fetchingLookups ? (
          <div style={{ padding: "1rem", color: "var(--text-secondary)" }}>Loading options...</div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.25rem" }}>
              <div>
                <label style={labelStyle}>Program</label>
                <select
                  name="program_id"
                  value={formData.program_id}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">-- Select Program --</option>
                  {lookups.programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Session</label>
                <select
                  name="session_id"
                  value={formData.session_id}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">-- Select Session --</option>
                  {lookups.sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.title} ({s.start_year}-{s.end_year})</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Term / Semester</label>
                <select
                  name="term_id"
                  value={formData.term_id}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">-- Select Term --</option>
                  {lookups.terms.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} {t.start_year ? `(${t.start_year})` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              style={{
                padding: "10px 24px",
                borderRadius: "8px",
                border: "none",
                background: loading ? "var(--card-border)" : "var(--accent, #4f46e5)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "14px",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  Generating...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                  Generate Results
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600, color: "var(--text-dark)" }}>
            Generated Results — {results.length} student(s)
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "var(--input-bg, #f9fafb)", borderBottom: "2px solid var(--card-border)" }}>
                  {["Student ID", "Email / Name", "Status", "GPA", "Message"].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: "var(--text-dark)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--card-border)", background: i % 2 === 0 ? "var(--card-bg)" : "var(--input-bg, #f9fafb)" }}>
                    <td style={{ padding: "10px 12px", color: "var(--text-dark)", fontWeight: 600 }}>{r.student_id}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text-dark)" }}>{r.name || "—"}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        padding: "3px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: r.success ? "rgba(22,163,74,0.12)" : "rgba(220,38,38,0.12)",
                        color: r.success ? "#16a34a" : "#dc2626",
                      }}>
                        {r.success ? "✓ Success" : "✗ Failed"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "var(--text-dark)", fontWeight: 700 }}>{r.gpa || "—"}</td>
                    <td style={{ padding: "10px 12px", color: "var(--text-secondary, #6b7280)", fontSize: "13px" }}>{r.message || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultGenerationPage;

import React, { useState, useEffect } from "react";
import { parentService } from "../services/parentService";

const ResultsPage: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parentService.getStudentResults()
      .then(res => { if (res.success) setResults(res.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding:"2rem", color:"var(--text-dark-sub)" }}>Loading results...</div>;

  return (
    <div>
      <h2 style={{ fontSize:"1.4rem", fontWeight:700, color:"var(--text-dark)", marginBottom:"1.5rem" }}>Exam Results</h2>
      {results.length === 0 ? (
        <div style={{ padding:"3rem", textAlign:"center", background:"var(--card-bg,#fff)", borderRadius:"12px", color:"var(--text-dark-sub)" }}>
          No results available yet.
        </div>
      ) : (
        <div style={{ background:"var(--card-bg,#fff)", border:"1px solid var(--card-border)", borderRadius:"12px", overflow:"hidden", boxShadow:"var(--shadow-card, 0 2px 8px rgba(0,0,0,0.06))" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"var(--input-bg,#f9fafb)", borderBottom:"1px solid var(--card-border)" }}>
                {["Exam ID","Theory","Practical","Total","Out of","Percentage","Passing","Status"].map(h => (
                  <th key={h} style={{ padding:"0.75rem 1rem", textAlign:"left", fontSize:"0.75rem", fontWeight:700, color:"var(--text-dark-sub)", textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r.id} style={{ borderTop:"1px solid var(--card-border,#e5e7eb)", color:"var(--text-dark)", background: i%2===0?"transparent":"var(--input-bg,#f9fafb)" }}>
                  <td style={{ padding:"0.75rem 1rem", fontFamily:"monospace", fontSize:"0.8rem", color:"var(--accent)" }}>#{r.exam_schedule_id || r.id}</td>
                  <td style={{ padding:"0.75rem 1rem", fontSize:"0.875rem" }}>{r.obtain_mark_theory ?? "—"}</td>
                  <td style={{ padding:"0.75rem 1rem", fontSize:"0.875rem" }}>{r.obtain_mark_practical ?? "—"}</td>
                  <td style={{ padding:"0.75rem 1rem", fontSize:"0.875rem", fontWeight:700 }}>{r.total_obtained}</td>
                  <td style={{ padding:"0.75rem 1rem", fontSize:"0.875rem" }}>{r.total_marks}</td>
                  <td style={{ padding:"0.75rem 1rem", fontSize:"0.875rem", fontWeight:700, color: Number(r.percentage)>=50?"#059669":"#dc2626" }}>
                    {r.percentage ? `${r.percentage}%` : "—"}
                  </td>
                  <td style={{ padding:"0.75rem 1rem", fontSize:"0.875rem" }}>{r.passing_marks ?? "—"}</td>
                  <td style={{ padding:"0.75rem 1rem" }}>
                    <span style={{ fontSize:"0.7rem", fontWeight:700, padding:"0.2rem 0.5rem", borderRadius:"6px",
                      background: r.passed?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)",
                      color: r.passed?"#059669":"#dc2626" }}>
                      {r.passed ? "PASS" : "FAIL"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;

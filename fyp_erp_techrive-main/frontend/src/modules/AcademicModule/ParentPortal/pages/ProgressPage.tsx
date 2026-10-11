import React, { useState, useEffect } from "react";
import { parentService } from "../services/parentService";

const ProgressPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    parentService.getStudentProgress()
      .then(res => { if (res.success) setReports(res.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding:"2rem", color:"var(--text-dark-sub)" }}>Loading progress...</div>;

  return (
    <div>
      <h2 style={{ fontSize:"1.4rem", fontWeight:700, color:"var(--text-dark)", marginBottom:"1.5rem" }}>Academic Progress Reports</h2>
      {reports.length === 0 ? (
        <div style={{ padding:"3rem", textAlign:"center", background:"var(--card-bg,#fff)", borderRadius:"12px", color:"var(--text-dark-sub)" }}>
          No progress reports available yet.
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          {reports.map(r => (
            <div key={r.id} style={{ background:"var(--card-bg,#fff)", border:"1px solid var(--card-border)", borderRadius:"12px", padding:"1.5rem", boxShadow:"var(--shadow-card, 0 2px 8px rgba(0,0,0,0.06))" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
                <h3 style={{ fontWeight:700, fontSize:"1rem", color:"var(--text-dark)", margin:0 }}>{r.name || `Report #${r.id}`}</h3>
                {r.grade != null && (
                  <span style={{ fontSize:"1.2rem", fontWeight:800, color:"var(--accent,#1d6fbf)" }}>
                    Grade: {r.grade}%
                  </span>
                )}
              </div>
              {r.details?.length > 0 && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"0.75rem" }}>
                  {r.details.map((d: any, i: number) => (
                    <div key={i} style={{ background:"var(--input-bg,#f9fafb)", borderRadius:"8px", padding:"0.75rem" }}>
                      <div style={{ fontSize:"0.7rem", fontWeight:700, color:"var(--text-dark-sub)", textTransform:"uppercase" }}>{d.name || d.parameter}</div>
                      <div style={{ fontSize:"1rem", fontWeight:700, color:"var(--text-dark)", marginTop:"0.2rem" }}>{d.marks ?? "—"}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgressPage;

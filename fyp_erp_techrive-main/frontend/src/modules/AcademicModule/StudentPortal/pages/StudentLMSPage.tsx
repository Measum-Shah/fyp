import React, { useState, useEffect } from "react";
import { StudentAPI } from "../services/api";
import { toast } from "../layouts/StudentLayout";

const StudentLMSPage: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"assignments" | "materials" | "quizzes">("assignments");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  
  const [submittingAssignment, setSubmittingAssignment] = useState<any>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionFile, setSubmissionFile] = useState("");

  const handleAssignmentSubmit = async () => {
    if (!submittingAssignment) return;
    try {
      await StudentAPI.submitAssignment(submittingAssignment.id, {
        submission_text: submissionText,
        file_url: submissionFile || (submittingAssignment.submission_type !== 'text' ? "https://example.com/mock-file.pdf" : undefined)
      });
      toast.success("Success", "Assignment submitted successfully!");
      setSubmittingAssignment(null);
      setSubmissionText("");
      setSubmissionFile("");
      // Refresh assignments
      const res = await StudentAPI.getAssignments();
      setAssignments(res.data.data || []);
    } catch (err: any) {
      toast.error("Error", "Error submitting assignment: " + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    Promise.all([StudentAPI.getAssignments(), StudentAPI.getMaterials(), StudentAPI.getQuizzes()])
      .then(([aRes, mRes, qRes]) => { 
        setAssignments(aRes.data.data || []); 
        setMaterials(mRes.data.data || []); 
        const qData = qRes.data.data || { section_timetables: [], teacher_quizzes: [] };
        const combinedQuizzes = [
          ...(qData.section_timetables || []).map((q: any) => ({ ...q, source: 'section' })),
          ...(qData.teacher_quizzes || []).map((q: any) => ({ ...q, source: 'teacher' }))
        ];
        setQuizzes(combinedQuizzes);
      })
      .catch((err) => { console.error('LMS Page API error:', err); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex flex-col gap-6 animate-pulse"><div className="panel-card" style={{height:400}}/></div>;

  const filteredAssignments = assignments.filter((a: any) => {
    if (filter === "pending") return a.status === "published" && new Date(a.deadline) > new Date();
    if (filter === "overdue") return a.status === "published" && new Date(a.deadline) < new Date();
    return true;
  }).filter((a: any) => !search || a.title?.toLowerCase().includes(search.toLowerCase()));

  const filteredMaterials = materials.filter((m: any) => !search || m.title?.toLowerCase().includes(search.toLowerCase()));

  const deadlineBadge = (deadline: string) => {
    if (!deadline) return null;
    const d = new Date(deadline);
    const now = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000*60*60*24));
    const bg = diff < 0 ? "var(--error-bg)" : diff <= 3 ? "var(--gold-light)" : "var(--success-bg)";
    const color = diff < 0 ? "var(--error)" : diff <= 3 ? "var(--text-dark)" : "var(--success)";
    const border = diff < 0 ? "var(--error-border)" : diff <= 3 ? "var(--gold)" : "var(--success-border)";
    const label = diff < 0 ? `Overdue by ${Math.abs(diff)}d` : diff === 0 ? "Due Today" : `${diff} days left`;
    return <span className="inline-block text-xs font-semibold" style={{padding:"4px 8px", borderRadius:"6px", background:bg,color,border:`1px solid ${border}`}}>{label}</span>;
  };

  const materialIcon = (type: string) => {
    if (type === "video") return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>;
    if (type === "pptx") return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>;
    return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{color: "var(--text-dark)"}}>Assignments & Learning Materials</h1>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex gap-1 p-1 rounded-lg" style={{background:"var(--input-bg)"}}>
          {(["assignments","materials","quizzes"] as const).map(t => (
            <button key={t} onClick={() => {setTab(t); setSearch("");}} className="text-sm font-semibold transition-all" style={{
              padding:"8px 16px", borderRadius:"6px",
              background: tab === t ? "var(--accent)" : "transparent",
              color: tab === t ? "#fff" : "var(--text-secondary)",
            }}>{t === "assignments" ? `Assignments (${assignments.length})` : t === "materials" ? `Materials (${materials.length})` : `Quizzes (${quizzes.length})`}</button>
          ))}
        </div>
        <div className="relative" style={{minWidth:240}}>
          <input className="form-input w-full" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{paddingLeft:36}} />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",opacity:.5}}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
      </div>

      {tab === "assignments" && (
        <>
          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {["all","pending","overdue"].map(f => (
              <button key={f} onClick={() => setFilter(f)} className="text-xs font-semibold transition-all" style={{
                padding:"6px 12px", borderRadius:"9999px",
                background: filter === f ? "var(--accent)" : "var(--input-bg)",
                color: filter === f ? "#fff" : "var(--text-secondary)",
              }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
            ))}
          </div>
          <div className="flex flex-col gap-4">
            {filteredAssignments.length > 0 ? filteredAssignments.map((a: any) => (
              <div key={a.id} className="panel-card">
                <div className="p-5 flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold" style={{color:"var(--text-dark)"}}>{a.title}</h3>
                      {deadlineBadge(a.deadline)}
                    </div>
                    <p className="text-sm mt-2" style={{color:"var(--text-secondary)"}}>{a.description}</p>
                    <div className="flex gap-4 mt-3 text-xs" style={{color:"var(--text-muted)"}}>
                      <span>Course: {a.course_name || a.course_id || 'N/A'}</span>
                      <span>Max Score: {a.max_score}</span>
                      <span>Type: {a.submission_type}</span>
                      <span>Status: {a.student_submission?.status || 'Pending'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs" style={{color:"var(--text-muted)"}}>Due: {a.deadline ? new Date(a.deadline).toLocaleDateString() : "N/A"}</span>
                    {!a.student_submission ? (
                      <button onClick={() => setSubmittingAssignment(a)} style={{ background: "var(--accent)", color: "#ffffff", border: "none", padding: "0.375rem 1rem", borderRadius: "0.375rem", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>Submit</button>
                    ) : (
                      <button disabled style={{ background: "var(--success-bg)", color: "var(--success)", border: "1px solid var(--success-border)", padding: "0.375rem 1rem", borderRadius: "0.375rem", fontWeight: 600, cursor: "default", fontSize: "0.875rem" }}>Submitted</button>
                    )}
                  </div>
                </div>
              </div>
            )) : <div className="panel-card p-8 text-center"><p className="text-sm" style={{color:"var(--text-secondary)"}}>No assignments found</p></div>}
          </div>
        </>
      )}

      {tab === "materials" && (
        <div className="flex flex-col gap-3">
          {filteredMaterials.length > 0 ? filteredMaterials.map((m: any) => (
            <div key={m.id} className="panel-card">
              <div className="p-4 flex items-center gap-4">
                <div style={{width:44,height:44,borderRadius:10,background:"var(--input-bg)",display:"flex",alignItems:"center",justifyContent:"center", color:"var(--accent)"}}>
                  {materialIcon(m.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm" style={{color:"var(--text-dark)"}}>{m.title}</h4>
                  <p className="text-xs mt-0.5" style={{color:"var(--text-muted)"}}>{m.description}</p>
                  <div className="flex gap-3 mt-1 text-xs" style={{color:"var(--text-muted)"}}>
                    <span>{m.course_name || 'N/A'}</span>
                    <span>{m.uploaded_by_name}</span>
                    <span>{m.file_size}</span>
                    <span className="uppercase">{m.material_type?.replace("_"," ")}</span>
                  </div>
                </div>
                {m.file_url ? (
                  <a href={m.file_url} download target="_blank" rel="noreferrer" style={{ background: "var(--input-bg)", color: "var(--text-dark)", border: "1px solid var(--input-border)", padding: "0.375rem 1rem", borderRadius: "0.375rem", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem", textDecoration: "none", whiteSpace: "nowrap", transition: "all 0.2s" }} onMouseOver={e => e.currentTarget.style.background="var(--accent)"} onMouseOut={e => e.currentTarget.style.background="var(--input-bg)"}>Download</a>
                ) : (
                  <button onClick={() => toast.error("Unavailable", "File URL is missing for this material.")} style={{ background: "var(--input-bg)", color: "var(--text-muted)", border: "1px solid var(--input-border)", padding: "0.375rem 1rem", borderRadius: "0.375rem", fontWeight: 600, cursor: "not-allowed", fontSize: "0.875rem" }}>Unavailable</button>
                )}
              </div>
            </div>
          )) : <div className="panel-card p-8 text-center"><p className="text-sm" style={{color:"var(--text-secondary)"}}>No materials found</p></div>}
        </div>
      )}

      {tab === "quizzes" && (
        <div className="flex flex-col gap-4">
          {quizzes.length > 0 ? quizzes.map((q: any, i) => (
            <div key={i} className="panel-card">
              <div className="p-5 flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-lg" style={{color:"var(--text-dark)"}}>{q.title || "Untitled Quiz"}</h3>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 12px",
                      borderRadius: "9999px",
                      background: q.status === 1 ? "var(--success-bg)" : "var(--input-bg)",
                      color: q.status === 1 ? "var(--success)" : "var(--text-secondary)",
                      border: q.status === 1 ? "1px solid var(--success-border)" : "1px solid var(--input-border)",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      letterSpacing: "0.02em",
                    }}>
                      {q.status === 1 && (
                        <span style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: "var(--success)",
                          display: "inline-block",
                        }} />
                      )}
                      {q.status === 1 ? "Active" : "Scheduled"}
                    </div>
                  </div>
                  <p className="text-sm mt-2" style={{color:"var(--text-secondary)"}}>{q.description}</p>
                  <div className="flex gap-4 mt-3 text-xs" style={{color:"var(--text-muted)"}}>
                    <span>Source: {q.source === 'section' ? 'Section Schedule' : 'Course Teacher'}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs" style={{color:"var(--text-muted)"}}>Date: {q.start ? new Date(q.start).toLocaleDateString() : (q.created_at ? new Date(q.created_at).toLocaleDateString() : "N/A")}</span>
                  <button
                    onClick={() => toast.info("Coming Soon", "Quiz interface launching...")}
                    disabled={q.status !== 1}
                    style={{
                      background: q.status === 1 ? "var(--accent)" : "var(--input-bg)",
                      color: q.status === 1 ? "#ffffff" : "var(--text-muted)",
                      border: q.status === 1 ? "none" : "1px solid var(--input-border)",
                      padding: "0.375rem 1rem",
                      borderRadius: "0.375rem",
                      fontWeight: 600,
                      cursor: q.status !== 1 ? "not-allowed" : "pointer",
                      fontSize: "0.875rem",
                      boxShadow: q.status === 1 ? "0 2px 8px rgba(29,111,191,0.25)" : "none",
                      opacity: q.status !== 1 ? 0.6 : 1,
                      transition: "all 0.25s ease",
                    }}
                    onMouseOver={e => { if (q.status === 1) { e.currentTarget.style.background = "var(--accent-bright)"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
                    onMouseOut={e => { if (q.status === 1) { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.transform = "translateY(0)"; }}}
                  >Start Quiz</button>
                </div>
              </div>
            </div>
          )) : <div className="panel-card p-8 text-center"><p className="text-sm" style={{color:"var(--text-secondary)"}}>No quizzes found</p></div>}
        </div>
      )}

      {/* Submission Modal */}
      {submittingAssignment && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="panel-card" style={{ width: "100%", maxWidth: "500px", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", marginBottom: "0.5rem", color: "var(--text-dark)" }}>Submit Assignment</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "1.5rem" }}>{submittingAssignment.title}</p>
            
            {(submittingAssignment.submission_type === 'text' || submittingAssignment.submission_type === 'file+text') && (
              <div style={{ marginBottom: "1rem" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-dark)" }}>Text Submission</label>
                <textarea 
                  className="form-input w-full" 
                  rows={4} 
                  placeholder="Type your response here..." 
                  value={submissionText} 
                  onChange={(e) => setSubmissionText(e.target.value)} 
                />
              </div>
            )}
            
            {(submittingAssignment.submission_type === 'file' || submittingAssignment.submission_type === 'file+text') && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem", color: "var(--text-dark)" }}>File Upload</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', border: '1px dashed var(--input-border)', borderRadius: '8px', background: 'var(--input-bg)' }}>
                  <label style={{ background: 'var(--accent)', color: '#ffffff', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, transition: "background 0.2s", display: "inline-block" }}>
                    Choose File
                    <input 
                      type="file" 
                      style={{ display: "none" }}
                      onChange={(e) => setSubmissionFile(e.target.files?.[0]?.name || "mock-upload.pdf")} 
                    />
                  </label>
                  <span style={{ fontSize: '0.875rem', color: submissionFile ? 'var(--text-dark)' : 'var(--text-muted)', overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {submissionFile || "No file chosen"}
                  </span>
                </div>
              </div>
            )}
            
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button 
                onClick={() => setSubmittingAssignment(null)} 
                style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", background: "transparent", border: "1px solid var(--input-border)", color: "var(--text-dark)", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignmentSubmit} 
                style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", background: "var(--accent)", border: "none", color: "#fff", fontWeight: 600, cursor: "pointer" }}
              >
                Confirm Submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLMSPage;

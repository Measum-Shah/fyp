import React, { useState, useEffect } from "react";
import { StudentAPI } from "../services/api";

const StudentCoursesPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    StudentAPI.getCourses()
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3,4,5,6].map(i => <div key={i} className="panel-card" style={{height:160}}/>)}
      </div>
    </div>
  );

  const courses = (data?.courses || []).filter((c: any) =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.subject_code?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl font-bold" style={{color: "var(--text-dark)"}}>My Courses</h1>
        <div className="relative" style={{minWidth:260}}>
          <input className="form-input w-full" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} style={{paddingLeft:36}} />
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",opacity:.5}}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </div>
      </div>

      <p className="text-sm" style={{color:"var(--text-secondary)"}}>{courses.length} course{courses.length !== 1 ? 's' : ''} enrolled</p>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c: any) => (
            <div key={c.id} className="panel-card" style={{display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <span className="inline-block text-xs font-bold" style={{padding:"4px 8px", borderRadius:"6px", background:"rgba(59,130,246,.1)",color:"var(--accent)"}}>{c.subject_code}</span>
                  <span className="inline-block text-xs font-medium" style={{padding:"4px 12px", borderRadius:"9999px", background:"var(--success-bg)",color:"var(--success)", border:"1px solid var(--success-border)"}}>Enrolled</span>
                </div>
                <h3 className="mt-3 font-semibold text-base" style={{color:"var(--text-dark)"}}>{c.name}</h3>
              </div>
              <div className="flex items-center justify-between" style={{padding: "12px 20px 16px 20px", borderTop:"1px solid var(--input-border)"}}>
                <span className="text-xs font-medium" style={{color:"var(--text-secondary)"}}>Credits: {c.credit_hours || "—"}</span>
                <span className="text-xs" style={{color:"var(--text-muted)"}}>Program ID: {c.program_id}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel-card p-8 text-center">
          <p className="text-sm" style={{color:"var(--text-secondary)"}}>No courses found.</p>
        </div>
      )}
    </div>
  );
};

export default StudentCoursesPage;

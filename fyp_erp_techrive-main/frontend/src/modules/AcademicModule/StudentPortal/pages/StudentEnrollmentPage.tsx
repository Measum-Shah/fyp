import React, { useState, useEffect } from "react";
import { StudentAPI } from "../services/api";
import { DataTable } from "../../components/common/DataTable";

const StudentEnrollmentPagePortal: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [status, setStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([StudentAPI.getAvailableCourses(), StudentAPI.getEnrollmentStatus()])
      .then(([crsRes, statRes]) => { setCourses(crsRes.data.data || []); setStatus(statRes.data.data || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRegister = async (courseId: number) => {
    if (!window.confirm("Are you sure you want to register for this course?")) return;
    setRegistering(courseId);
    try {
      await StudentAPI.registerCourse(courseId);
      alert("Registration successful");
      const statRes = await StudentAPI.getEnrollmentStatus();
      setStatus(statRes.data.data || []);
    } catch (err: any) {
      alert(err.response?.data?.message || "Registration failed");
    }
    setRegistering(null);
  };

  if (loading) return <div className="flex flex-col gap-6 animate-pulse"><div className="panel-card" style={{height:400}}/></div>;

  const enrolledIds = new Set(status.map((s: any) => s.subject_id));
  const availableToRegister = courses.filter((c: any) => !enrolledIds.has(c.id));

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold" style={{color: "var(--text-dark)"}}>Course Registration</h1>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold" style={{color:"var(--text-dark)"}}>Available Courses</h2>
        {availableToRegister.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {availableToRegister.map((c: any) => (
              <div key={c.id} className="panel-card p-5 flex flex-col justify-between">
                <div>
                  <span className="inline-block text-xs font-bold mb-2" style={{padding:"4px 8px", borderRadius:"6px", background:"rgba(59,130,246,.1)",color:"var(--accent)"}}>{c.subject_code}</span>
                  <h3 className="font-semibold text-base" style={{color:"var(--text-dark)"}}>{c.name}</h3>
                </div>
                <div className="flex justify-between items-center mt-5 pt-4" style={{borderTop:"1px solid var(--input-border)"}}>
                  <span className="text-sm font-medium" style={{color:"var(--text-secondary)"}}>Credits: {c.credit_hours}</span>
                  <button
                    onClick={() => handleRegister(c.id)}
                    disabled={registering === c.id}
                    className="student-register-btn"
                    style={{
                      background: registering === c.id ? "var(--input-bg)" : "var(--accent)",
                      color: registering === c.id ? "var(--text-muted)" : "#ffffff",
                      border: "none",
                      padding: "0.5rem 1.5rem",
                      borderRadius: "var(--radius-btn)",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      cursor: registering === c.id ? "not-allowed" : "pointer",
                      boxShadow: registering === c.id ? "none" : "0 2px 8px rgba(29,111,191,0.25)",
                      transition: "all 0.25s ease",
                      opacity: registering === c.id ? 0.7 : 1,
                      letterSpacing: "0.01em",
                    }}
                    onMouseOver={e => { if (registering !== c.id) { e.currentTarget.style.background = "var(--accent-bright)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(29,111,191,0.35)"; e.currentTarget.style.transform = "translateY(-1px)"; }}}
                    onMouseOut={e => { if (registering !== c.id) { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(29,111,191,0.25)"; e.currentTarget.style.transform = "translateY(0)"; }}}
                  >
                    {registering === c.id ? (
                      <span style={{display:"flex",alignItems:"center",gap:"6px"}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{animation:"spin 1s linear infinite"}}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                        Registering…
                      </span>
                    ) : "Register"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="panel-card p-8 text-center text-sm" style={{color:"var(--text-secondary)"}}>
            No new courses available for registration.
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold" style={{color:"var(--text-dark)"}}>My Registrations</h2>
        <div className="panel-card">
          <div className="p-4">
            <DataTable 
              columns={[
                { key: "subject_id", header: "Course ID", render: (s: any) => `#${s.subject_id}` },
                { key: "created_at", header: "Registration Date", render: (s: any) => s.created_at ? new Date(s.created_at).toLocaleDateString() : "—" },
                { key: "status", header: "Status", render: () => <span className="inline-block text-xs font-semibold" style={{padding:"4px 8px", borderRadius:"6px", background:"var(--success-bg)",color:"var(--success)", border:"1px solid var(--success-border)"}}>Active</span> }
              ]}
              data={status}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentEnrollmentPagePortal;

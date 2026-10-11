import React, { useState, useEffect } from "react";
import { academicService } from "../services/academicService";
import { useRoleAccess } from "../hooks/useRoleAccess";
import type { Course, EnrollmentEligibility } from "../types";
import { toast } from "./AcademicLayout";

interface RecentCheck {
  studentId: string;
  courseTitle: string;
  isEligible: boolean;
  timestamp: string;
}

const EnrollmentValidationPage: React.FC = () => {
  const { institutionType } = useRoleAccess();
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentId, setStudentId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnrollmentEligibility | null>(null);
  const [history, setHistory] = useState<RecentCheck[]>([]);

  useEffect(() => {
    academicService.getCourses(undefined, institutionType).then(setCourses);
  }, [institutionType]);


  const handleCheckEligibility = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !selectedCourseId) {
      toast.warning("Validation Error", "Please enter a Student ID and select a course.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await academicService.validateEnrollmentEligibility(Number(selectedCourseId), Number(studentId));
      setResult(data);

      const targetCourse = courses.find((c) => c.id === Number(selectedCourseId));
      setHistory((prev) => [
        {
          studentId,
          courseTitle: targetCourse ? `${targetCourse.code} — ${targetCourse.title}` : `Course #${selectedCourseId}`,
          isEligible: data.eligible,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 4), // keep last 5
      ]);

      if (data.eligible) {
        toast.success("Eligibility Verified", "Student meets all prerequisite requirements!");
      } else {
        toast.warning("Ineligible", "Student has unfulfilled prerequisites.");
      }
    } catch (err: any) {
      toast.error("Check Failed", err.message || "Could not validate enrollment.");
    }
    setLoading(false);
  };

  const selectedCourse = courses.find((c) => c.id === Number(selectedCourseId));

  return (
    <div style={{ padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Top Header */}
      <div className="panel-card-header">
        <div>
          <h2 className="topbar-title" style={{ fontSize: "1.4rem" }}>Student Enrollment & Prerequisite Validation</h2>
          <p className="topbar-date">Check student eligibility, prerequisite fulfillment, and course registration rules</p>
        </div>
      </div>

      {/* Validation Card */}
      <div className="panel-card" style={{ padding: "1.5rem" }}>
        <form onSubmit={handleCheckEligibility} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
            <div>
              <label className="field-label" style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.75rem" }}>
                Student ID / Roll Number *
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="e.g. STU-2026-0042"
                className="field-input"
              />
            </div>

            <div>
              <label className="field-label" style={{ textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.75rem" }}>
                Target Course *
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : "")}
                className="field-input"
              >
                <option value="">Select target course...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.title} ({c.credit_hours} Cr)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
            style={{ 
              width: "100%", padding: "0.75rem", fontSize: "0.95rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" 
            }}
          >
            {loading ? (
              <>
                <svg style={{ width: "20px", height: "20px", animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Evaluating Prerequisites...
              </>
            ) : (
              <>
                <svg style={{ width: "20px", height: "20px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Check Enrollment Eligibility
              </>
            )}
          </button>
        </form>
      </div>

      {/* Result Display Box */}
      {result && (
        <div
          style={{
            padding: "1.5rem", borderRadius: "1.25rem", border: "2px solid", transition: "all 0.3s",
            background: result.eligible ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)",
            borderColor: result.eligible ? "var(--success, #10b981)" : "var(--error, #ef4444)"
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
            <div
              style={{
                width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                color: "white", fontWeight: "bold", fontSize: "1.25rem",
                background: result.eligible ? "var(--success, #10b981)" : "var(--error, #ef4444)",
                boxShadow: result.eligible ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "0 4px 12px rgba(239, 68, 68, 0.3)"
              }}
            >
              {result.eligible ? "✓" : "✕"}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 800, margin: 0, color: result.eligible ? "var(--success, #10b981)" : "var(--error, #ef4444)" }}>
                  {result.eligible ? "Eligible for Enrollment" : "Enrollment Blocked — Missing Prerequisites"}
                </h3>
                <span style={{ fontSize: "0.75rem", fontFamily: "monospace", fontWeight: 700, padding: "0.25rem 0.6rem", borderRadius: "8px", background: "var(--input-bg)", color: "var(--text-dark)" }}>
                  {studentId}
                </span>
              </div>

              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-dark)", marginTop: "0.5rem" }}>
                Target: <span style={{ color: "var(--accent)" }}>{selectedCourse ? `${selectedCourse.code} — ${selectedCourse.title}` : ""}</span>
              </p>

              {/* Recommendation text */}
              {result.recommendation && (
                <p style={{ fontSize: "0.75rem", color: "var(--text-dark-sub)", marginTop: "0.75rem", background: "var(--input-bg)", padding: "0.75rem", borderRadius: "8px" }}>
                  {result.recommendation}
                </p>
              )}

              {/* Missing Prerequisite List if ineligible */}
              {!result.eligible && result.missing_prerequisites && result.missing_prerequisites.length > 0 && (
                <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--error, #ef4444)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Unfulfilled Requirements:</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {result.missing_prerequisites.map((req, idx) => (
                      <div key={idx} style={{ padding: "0.75rem", background: "var(--card-bg)", borderRadius: "8px", border: "1px solid var(--card-border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap", fontSize: "0.75rem" }}>
                        <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--error, #ef4444)" }}>{req.code || `COURSE-${req.prerequisite_course_id}`}</span>
                        <span style={{ color: "var(--text-dark)", fontWeight: 500 }}>{req.title || "Required Course"}</span>
                        <span style={{ padding: "0.2rem 0.5rem", borderRadius: "6px", background: "rgba(239, 68, 68, 0.1)", color: "var(--error, #ef4444)", fontWeight: 700, fontSize: "0.7rem" }}>
                          Min Grade: {req.min_grade || "C"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Checks Audit Trail */}
      {history.length > 0 && (
        <div className="panel-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h4 style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-dark-sub)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>Recent Validation History</h4>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {history.map((h, i) => (
              <div key={i} style={{ padding: "0.5rem 0", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: i > 0 ? "1px solid var(--divider-color)" : "none", fontSize: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: h.isEligible ? "var(--success, #10b981)" : "var(--error, #ef4444)" }} />
                  <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--text-dark)" }}>{h.studentId}</span>
                  <span style={{ color: "var(--text-dark-sub)" }}>→</span>
                  <span style={{ color: "var(--text-dark)", fontWeight: 500, maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.courseTitle}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ fontWeight: 700, color: h.isEligible ? "var(--success, #10b981)" : "var(--error, #ef4444)" }}>
                    {h.isEligible ? "Eligible" : "Blocked"}
                  </span>
                  <span style={{ fontSize: "0.65rem", color: "var(--text-dark-sub)" }}>{h.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnrollmentValidationPage;

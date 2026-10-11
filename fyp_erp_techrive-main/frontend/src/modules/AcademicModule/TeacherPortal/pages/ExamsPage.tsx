import React, { useState, useEffect } from "react";
import { teacherService } from "../services/teacherService";

const ExamsPage: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [myCourses, setMyCourses] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [examType, setExamType] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const user = JSON.parse(localStorage.getItem("erp_user") || "{}");
  const roleStr = (user?.role_name || user?.user_type || "").toLowerCase();
  const isUni = roleStr.includes("lecturer") || roleStr.includes("professor");

  useEffect(() => {
    fetchExams();
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await teacherService.getMyCourses();
      if (res.success) setMyCourses(res.data);
    } catch { /* silently ignore */ }
  };

  const fetchExams = async () => {
    try {
      setLoading(true);
      const res = await teacherService.getExams();
      if (res.success) setExams(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !examType) return setNotice({ type: "error", msg: "Please select subject and assessment type." });
    try {
      setSaving(true);
      const res = await teacherService.createExamSlot({ course_id: Number(courseId), title: examType, total_marks: Number(totalMarks) });
      if (res.success) {
        setNotice({ type: "success", msg: `"${examType}" slot created successfully.` });
        setShowCreateForm(false);
        setCourseId(""); setExamType(""); setTotalMarks("100");
        fetchExams();
      }
    } catch (err: any) {
      setNotice({ type: "error", msg: err?.response?.data?.message || "Failed to create slot." });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectExam = async (exam: any) => {
    setSelectedExam(exam);
    setNotice(null);
    try {
      setLoadingStudents(true);
      const res = await teacherService.getExamStudents(exam.id);
      if (res.success) setStudents(res.data);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleMarkChange = (studentId: number, field: string, value: string) => {
    const numValue = value === "" ? 0 : Number(value);
    setStudents(prev => prev.map(s => s.students_id === studentId ? { ...s, [field]: numValue } : s));
  };

  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;
    try {
      setSaving(true);
      const res = await teacherService.saveMarks(selectedExam.id, students);
      if (res.success) setNotice({ type: "success", msg: "Marks saved successfully!" });
    } catch {
      setNotice({ type: "error", msg: "Failed to save marks." });
    } finally {
      setSaving(false);
    }
  };

  const uniTypes = ["Assignment", "Quiz", "Mid Term", "Final Term"];
  const schoolTypes = ["Exam", "Monthly Test"];

  return (
    <div className="teacher-attendance-page">
      {/* ── Header ── */}
      <header className="teacher-attendance-header">
        <div>
          <h1 className="teacher-attendance-title">Exams &amp; Results</h1>
          <p className="teacher-attendance-subtitle">
            {isUni ? "University: Assignments · Quizzes · Mid · Final" : "School: Exam · Monthly Test"}
          </p>
        </div>
        {!selectedExam && (
          <button
            type="button"
            className="teacher-attendance-save"
            style={{ padding: "0.55rem 1.1rem", fontSize: "0.82rem" }}
            onClick={() => { setShowCreateForm(v => !v); setNotice(null); }}
          >
            {showCreateForm ? "✕ Cancel" : "+ Create Slot"}
          </button>
        )}
      </header>

      {/* ── Notice ── */}
      {notice && (
        <div className={`teacher-attendance-message ${notice.type}`}>
          {notice.msg}
        </div>
      )}

      {/* ── Create Slot Form ── */}
      {showCreateForm && !selectedExam && (
        <div className="teacher-attendance-panel">
          <h2 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 700 }}>New Assessment Slot</h2>
          <form onSubmit={handleCreateSlot}>
            <div className="teacher-attendance-filters">
              <label>
                Subject
                <select value={courseId} onChange={e => setCourseId(e.target.value)} required>
                  <option value="">-- Select Subject --</option>
                  {myCourses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} {c.subject_code ? `(${c.subject_code})` : ""}</option>
                  ))}
                </select>
              </label>
              <label>
                Assessment Type
                <select value={examType} onChange={e => setExamType(e.target.value)} required>
                  <option value="">-- Select Type --</option>
                  {(isUni ? uniTypes : schoolTypes).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Total Marks
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={totalMarks}
                  onChange={e => setTotalMarks(e.target.value)}
                  required
                />
              </label>
            </div>
            <button type="submit" className="teacher-attendance-save" disabled={saving}>
              {saving ? "Creating..." : "Create Slot"}
            </button>
          </form>
        </div>
      )}

      {/* ── Grading View ── */}
      {selectedExam ? (
        <div className="teacher-attendance-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>
                {selectedExam.exam_title} — {selectedExam.course_name || "—"}
              </h2>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.78rem", color: "var(--text-dark-sub)" }}>
                Total Marks: {selectedExam.total_marks}
              </p>
            </div>
            <button
              type="button"
              style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700 }}
              onClick={() => { setSelectedExam(null); setStudents([]); setNotice(null); }}
            >
              ← Back to List
            </button>
          </div>

          <form onSubmit={handleSaveMarks}>
            <div className="teacher-attendance-table-wrap">
              <table className="teacher-attendance-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Reg No</th>
                    <th>Student Name</th>
                    <th>Theory Marks</th>
                    <th>Practical / Lab</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingStudents ? (
                    <tr><td colSpan={5} className="teacher-attendance-empty">Loading students...</td></tr>
                  ) : students.length === 0 ? (
                    <tr><td colSpan={5} className="teacher-attendance-empty">No students found in this section.</td></tr>
                  ) : (
                    students.map((s, i) => (
                      <tr key={s.students_id}>
                        <td style={{ color: "var(--text-dark-sub)", fontSize: "0.75rem" }}>{i + 1}</td>
                        <td>{s.reg_no || "—"}</td>
                        <td className="teacher-attendance-student">{s.student_name}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={selectedExam.total_marks}
                            style={{ width: "80px", minHeight: "32px", padding: "0.35rem 0.5rem", border: "1px solid var(--card-border)", borderRadius: "6px", background: "var(--input-bg)", color: "var(--text-dark)" }}
                            value={s.obtain_mark_theory}
                            onChange={e => handleMarkChange(s.students_id, "obtain_mark_theory", e.target.value)}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={selectedExam.total_marks}
                            style={{ width: "80px", minHeight: "32px", padding: "0.35rem 0.5rem", border: "1px solid var(--card-border)", borderRadius: "6px", background: "var(--input-bg)", color: "var(--text-dark)" }}
                            value={s.obtain_mark_practical}
                            onChange={e => handleMarkChange(s.students_id, "obtain_mark_practical", e.target.value)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {students.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <button type="submit" className="teacher-attendance-save" disabled={saving || loadingStudents}>
                  {saving ? "Saving..." : "Save Marks"}
                </button>
              </div>
            )}
          </form>
        </div>
      ) : (
        /* ── Exam Slots List ── */
        <div className="teacher-attendance-panel">
          <h2 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 700 }}>My Assessment Slots</h2>
          <div className="teacher-attendance-table-wrap">
            <table className="teacher-attendance-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Assessment</th>
                  <th>Subject</th>
                  <th>Total Marks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="teacher-attendance-empty">Loading...</td></tr>
                ) : exams.length === 0 ? (
                  <tr><td colSpan={5} className="teacher-attendance-empty">No slots yet. Click "+ Create Slot" to get started.</td></tr>
                ) : (
                  exams.map((exam, i) => (
                    <tr key={exam.id}>
                      <td style={{ color: "var(--text-dark-sub)", fontSize: "0.75rem" }}>{i + 1}</td>
                      <td className="teacher-attendance-student">{exam.exam_title || "—"}</td>
                      <td>{exam.course_name || "—"}</td>
                      <td>{exam.total_marks ?? "—"}</td>
                      <td>
                        <button
                          type="button"
                          className="teacher-attendance-save"
                          style={{ fontSize: "0.74rem", padding: "0.35rem 0.7rem" }}
                          onClick={() => handleSelectExam(exam)}
                        >
                          Grade Students
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamsPage;

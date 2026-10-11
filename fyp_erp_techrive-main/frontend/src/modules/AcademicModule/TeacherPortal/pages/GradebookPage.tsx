import React, { useState, useEffect } from "react";
import { teacherService } from "../services/teacherService";

const GradebookPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  
  const [activeTab, setActiveTab] = useState<"categories" | "marks" | "summary">("categories");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  
  const [marks, setMarks] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ students: [], categories: [] });
  
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await teacherService.getMyCourses();
      if (res.success) setCourses(res.data);
    } catch { }
  };

  const handleSelectCourse = async (courseId: number) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    
    // TechRive structure has section attached to the course object from active session, 
    // or we assume section ID is passed along if needed. 
    // In teacherService.getMyCourses, it usually just returns unique courses. 
    // We will pass 0 for sectionId if not strictly scoped in the UI, or we can just fetch first section.
    // For simplicity, let's pass a dummy section 1 or rely on courseId mainly.
    // In TechRive it often uses the active_session_section_id = 1 for demo.
    
    setSelectedCourse(course);
    fetchCategories(course.id, 1);
  };

  const fetchCategories = async (courseId: number, sectionId: number) => {
    try {
      setLoading(true);
      const res = await teacherService.getGradebookCategories(courseId, sectionId);
      if (res.success) setCategories(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      active_session_section_id: 1, // Fallback section ID
      course_id: selectedCourse.id,
      name: formData.get("name"),
      weight: formData.get("weight"),
      total_marks: formData.get("total_marks")
    };
    try {
      const res = await teacherService.saveGradebookCategory(data);
      if (res.success) {
        setNotice({ type: "success", msg: "Category saved!" });
        fetchCategories(selectedCourse.id, 1);
      }
    } catch (err: any) {
      setNotice({ type: "error", msg: "Failed to save category." });
    }
  };

  const loadMarks = async (category: any) => {
    setSelectedCategory(category);
    setActiveTab("marks");
    try {
      setLoading(true);
      const res = await teacherService.getGradebookMarks(category.id, 1);
      if (res.success) setMarks(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await teacherService.saveGradebookMarks(selectedCategory.id, marks);
      if (res.success) setNotice({ type: "success", msg: "Marks saved successfully!" });
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    setActiveTab("summary");
    try {
      setLoading(true);
      const res = await teacherService.getGradebookSummary(selectedCourse.id, 1);
      if (res.success) setSummary(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (isPublished: boolean) => {
    try {
      setLoading(true);
      const res = await teacherService.publishGradebook(selectedCourse.id, 1, isPublished);
      if (res.success) {
        setNotice({ type: "success", msg: isPublished ? "Gradebook Published!" : "Gradebook Unpublished." });
        fetchCategories(selectedCourse.id, 1); // Refresh status
      }
    } finally {
      setLoading(false);
    }
  };

  const totalWeight = categories.reduce((sum, cat) => sum + Number(cat.weight), 0);
  const isPublished = categories.length > 0 && categories[0].is_published;

  return (
    <div className="teacher-attendance-page">
      <header className="teacher-attendance-header">
        <div>
          <h1 className="teacher-attendance-title">Gradebook</h1>
          <p className="teacher-attendance-subtitle">Manage assessment categories, grades, and publishing.</p>
        </div>
      </header>

      {notice && <div className={`teacher-attendance-message ${notice.type}`}>{notice.msg}</div>}

      <div className="teacher-attendance-panel">
        <div className="teacher-attendance-filters">
          <label>
            Select Course
            <select onChange={(e) => handleSelectCourse(Number(e.target.value))} defaultValue="">
              <option value="" disabled>-- Select Course --</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {selectedCourse && (
        <div className="teacher-attendance-panel">
          {/* ── Tab bar ── */}
          <div className="teacher-attendance-tabs" style={{ marginBottom: "1.5rem" }}>
            <button
              className={activeTab === "categories" ? "active" : ""}
              onClick={() => setActiveTab("categories")}
            >
              Categories Setup
            </button>
            <button
              className={activeTab === "marks" ? "active" : ""}
              onClick={() => setActiveTab("marks")}
            >
              Enter Marks
            </button>
            <button
              className={activeTab === "summary" ? "active" : ""}
              onClick={loadSummary}
            >
              Gradebook Summary
            </button>
          </div>

          {/* ── Categories Tab ── */}
          {activeTab === "categories" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <h2 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>
                  Assessment Categories &nbsp;
                  <span style={{ fontSize: "0.8rem", fontWeight: 500, color: totalWeight === 100 ? "var(--text-dark-sub)" : "#b91c1c" }}>
                    (Total Weight: {totalWeight}%)
                  </span>
                </h2>
                {totalWeight !== 100 && (
                  <span style={{ background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", borderRadius: "6px", padding: "0.3rem 0.7rem", color: "#b91c1c", fontSize: "0.78rem", fontWeight: 600 }}>
                    ⚠ Total weight must be 100%
                  </span>
                )}
              </div>

              <div className="teacher-attendance-table-wrap">
                <table className="teacher-attendance-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Category Name</th>
                      <th>Total Marks</th>
                      <th>Weight (%)</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.length === 0 ? (
                      <tr><td colSpan={5} className="teacher-attendance-empty">No categories yet. Add one below.</td></tr>
                    ) : categories.map((c, i) => (
                      <tr key={c.id}>
                        <td style={{ color: "var(--text-dark-sub)", fontSize: "0.75rem" }}>{i + 1}</td>
                        <td className="teacher-attendance-student">{c.name}</td>
                        <td>{c.total_marks}</td>
                        <td>{c.weight}%</td>
                        <td>
                          <button
                            type="button"
                            className="teacher-attendance-save"
                            style={{ fontSize: "0.74rem", padding: "0.35rem 0.7rem" }}
                            onClick={() => loadMarks(c)}
                          >
                            Enter Marks
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!isPublished && (
                <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid var(--card-border)" }}>
                  <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-dark-sub)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Add New Category
                  </h3>
                  <form onSubmit={handleSaveCategory}>
                    <div className="teacher-attendance-filters" style={{ marginBottom: "0.75rem" }}>
                      <label>
                        Category Name
                        <input name="name" required placeholder="e.g. Midterm" />
                      </label>
                      <label>
                        Total Marks
                        <input name="total_marks" type="number" required placeholder="e.g. 50" min="1" />
                      </label>
                      <label>
                        Weight (%)
                        <input name="weight" type="number" step="0.01" required placeholder="e.g. 25" min="0" max="100" />
                      </label>
                    </div>
                    <button type="submit" className="teacher-attendance-save">+ Add Category</button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ── Marks Tab ── */}
          {activeTab === "marks" && (
            <div>
              <div className="teacher-attendance-filters" style={{ marginBottom: "1.5rem" }}>
                <label>
                  Select Category
                  <select 
                    value={selectedCategory?.id || ""} 
                    onChange={(e) => {
                      const cat = categories.find(c => c.id === Number(e.target.value));
                      if (cat) loadMarks(cat);
                    }}
                  >
                    <option value="" disabled>-- Select Assessment Category --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (Max: {c.total_marks})</option>
                    ))}
                  </select>
                </label>
              </div>

              {!selectedCategory ? (
                <div className="teacher-attendance-empty" style={{ marginTop: "2rem" }}>
                  Please select an assessment category to enter marks.
                </div>
              ) : (
                <form onSubmit={handleSaveMarks}>
                  <h2 style={{ margin: "0 0 0.25rem", fontSize: "0.95rem", fontWeight: 700 }}>
                    Enter Marks — {selectedCategory.name}
                  </h2>
                  <p style={{ margin: "0 0 1rem", fontSize: "0.78rem", color: "var(--text-dark-sub)" }}>
                    Maximum marks: {selectedCategory.total_marks}
                  </p>
                  <div className="teacher-attendance-table-wrap">
                <table className="teacher-attendance-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student Name</th>
                      <th>Reg No</th>
                      <th>Marks Obtained</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marks.length === 0 ? (
                      <tr><td colSpan={4} className="teacher-attendance-empty">No students found.</td></tr>
                    ) : marks.map((m, i) => (
                      <tr key={m.student_id}>
                        <td style={{ color: "var(--text-dark-sub)", fontSize: "0.75rem" }}>{i + 1}</td>
                        <td className="teacher-attendance-student">{m.student_name}</td>
                        <td>{m.reg_no}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={selectedCategory.total_marks}
                            step="0.01"
                            value={m.obtained_marks}
                            disabled={isPublished}
                            style={{ width: "90px" }}
                            onChange={(e) => {
                              const newMarks = [...marks];
                              newMarks[i].obtained_marks = e.target.value;
                              setMarks(newMarks);
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isPublished && marks.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <button type="submit" className="teacher-attendance-save" disabled={loading}>
                    {loading ? "Saving..." : "Save Marks"}
                  </button>
                </div>
              )}
                </form>
              )}
            </div>
          )}

          {/* ── Summary Tab ── */}
          {activeTab === "summary" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
                <h2 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700 }}>Final Gradebook Summary</h2>
                <button
                  onClick={() => handlePublish(!isPublished)}
                  className="teacher-attendance-save"
                  style={{ background: isPublished ? "#dc2626" : "#16a34a", color: "white" }}
                >
                  {isPublished ? "Unpublish Gradebook" : "Publish Gradebook"}
                </button>
              </div>

              <div className="teacher-attendance-table-wrap">
                <table className="teacher-attendance-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student Name</th>
                      <th>Reg No</th>
                      {summary.categories.map((c: any) => (
                        <th key={c.id}>{c.name} ({c.weight}%)</th>
                      ))}
                      <th>Weighted Total</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.students.length === 0 ? (
                      <tr><td colSpan={5 + summary.categories.length} className="teacher-attendance-empty">No data available.</td></tr>
                    ) : summary.students.map((s: any, i: number) => (
                      <tr key={s.student_id}>
                        <td style={{ color: "var(--text-dark-sub)", fontSize: "0.75rem" }}>{i + 1}</td>
                        <td className="teacher-attendance-student">{s.student_name}</td>
                        <td>{s.reg_no}</td>
                        {summary.categories.map((c: any) => {
                          const m = s.categoryMarks[c.id];
                          return <td key={c.id}>{m ? `${m.obtained || 0} (${m.weighted_score.toFixed(1)}%)` : "—"}</td>;
                        })}
                        <td style={{ fontWeight: "bold" }}>{s.weightedTotal}%</td>
                        <td style={{ fontWeight: "bold", color: "var(--accent)" }}>{s.grade_letter}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GradebookPage;

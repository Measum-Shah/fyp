import React, { useState, useEffect, useCallback } from "react";
import { DataTable, type Column } from "../components/common/DataTable";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { EmptyState } from "../components/common/EmptyState";
import { RoleGuard } from "../components/common/RoleGuard";
import { useRoleAccess } from "../hooks/useRoleAccess";
import { academicService } from "../services/academicService";
import { toast } from "./AcademicLayout";
import type { Course, CoursePrerequisite, CourseCorequisite } from "../types";


const PrerequisiteManagementPage: React.FC = () => {
  const { institutionType, branchId } = useRoleAccess();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [prerequisites, setPrerequisites] = useState<CoursePrerequisite[]>([]);
  const [corequisites, setCorequisites] = useState<CourseCorequisite[]>([]);
  const [loading, setLoading] = useState(false);

  // ── University → Campus filter ─────────────────────────────────────────────
  const [universities, setUniversities] = useState<{ id: number; name: string }[]>([]);
  const [campuses, setCampuses] = useState<{ id: number; name: string; branch_code: string }[]>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<number | null>(null);
  const [selectedCampusId, setSelectedCampusId] = useState<number | null>(null);

  // Load universities on mount
  useEffect(() => {
    academicService.getUniversities().then(setUniversities).catch(() => {});
  }, []);

  // Load campuses when university selected
  useEffect(() => {
    if (selectedUniversityId) {
      academicService.getCampusesByUniversity(selectedUniversityId).then(setCampuses).catch(() => {});
    } else {
      setCampuses([]);
    }
    setSelectedCampusId(null);
  }, [selectedUniversityId]);

  const activeBranchId = selectedCampusId ?? null;  // only filter by campus when explicitly chosen
  // ─────────────────────────────────────────────────────────────────────────

  type Tab = "prerequisites" | "corequisites";
  const [activeTab, setActiveTab] = useState<Tab>("prerequisites");

  const [allPrereqs, setAllPrereqs] = useState<CoursePrerequisite[]>([]);
  const [allCoreqs, setAllCoreqs] = useState<CourseCorequisite[]>([]);

  // Assign Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetCourseId, setTargetCourseId] = useState<number | "">("");
  const [prereqCourseId, setPrereqCourseId] = useState<number | "">("");

  const [saving, setSaving] = useState(false);

  // Delete Confirm
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Load courses on mount, institution switch, or campus switch
  useEffect(() => {
    academicService.getCourses(undefined, institutionType, selectedCampusId ?? undefined).then((data) => {
      setCourses(data);
      if (data.length > 0) {
        setSelectedCourseId(data[0].id);
      } else {
        setSelectedCourseId("");
      }
    });
    academicService.getAllPrerequisites(institutionType).then(setAllPrereqs);
    academicService.getAllCorequisites(institutionType).then(setAllCoreqs);
  }, [institutionType, selectedCampusId]);


  const loadCourseDependencies = useCallback(async (courseId: number) => {
    setLoading(true);
    try {
      const data1 = await academicService.getPrerequisitesByCourse(courseId);
      setPrerequisites(data1);
      const data2 = await academicService.getCorequisitesByCourse(courseId);
      setCorequisites(data2);
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to load dependencies.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      loadCourseDependencies(Number(selectedCourseId));
    } else {
      setPrerequisites([]);
      setCorequisites([]);
    }
  }, [selectedCourseId, loadCourseDependencies]);

  const handleAssignDependency = async () => {
    if (!targetCourseId || !prereqCourseId) {
      toast.warning("Validation Error", "Please select both target course and dependency course.");
      return;
    }

    if (targetCourseId === prereqCourseId) {
      toast.error("Invalid Selection", "A course cannot depend on itself!");
      return;
    }

    setSaving(true);
    try {
      if (activeTab === "prerequisites") {
        const existing = prerequisites.find((p) => p.prerequisite_course_id === prereqCourseId);
        if (existing) { toast.warning("Duplicate", "Already a prerequisite."); setSaving(false); return; }
        const newPrereq = await academicService.assignPrerequisite(Number(targetCourseId), Number(prereqCourseId));
        setPrerequisites((prev) => [...prev, newPrereq]);
        setAllPrereqs((prev) => [...prev, newPrereq]);
        toast.success("Assigned", "Successfully linked prerequisite.");
      } else {
        const existing = corequisites.find((p) => p.corequisite_course_id === prereqCourseId);
        if (existing) { toast.warning("Duplicate", "Already a corequisite."); setSaving(false); return; }
        const newCoreq = await academicService.assignCorequisite(Number(targetCourseId), Number(prereqCourseId));
        setCorequisites((prev) => [...prev, newCoreq]);
        setAllCoreqs((prev) => [...prev, newCoreq]);
        toast.success("Assigned", "Successfully linked corequisite.");
      }
      setAssignModalOpen(false);
    } catch (err: any) {
      toast.error("Assignment Failed", err.message || "Failed to assign.");
    }
    setSaving(false);
  };

  const handleRemove = async () => {
    if (!deleteId) return;
    try {
      if (activeTab === "prerequisites") {
        await academicService.removePrerequisite(deleteId);
        toast.success("Prerequisite Removed");
        setPrerequisites((prev) => prev.filter((p) => p.id !== deleteId));
        setAllPrereqs((prev) => prev.filter((p) => p.id !== deleteId));
      } else {
        await academicService.removeCorequisite(deleteId);
        toast.success("Corequisite Removed");
        setCorequisites((prev) => prev.filter((p) => p.id !== deleteId));
        setAllCoreqs((prev) => prev.filter((p) => p.id !== deleteId));
      }
    } catch (err: any) {
      toast.error("Remove Failed", err.message);
    }
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const selectedCourse = courses.find((c) => c.id === Number(selectedCourseId));

  const columns: Column<any>[] = [
    {
      key: "index",
      header: "#",
      render: (_, index) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent)" }}>{index}</span>,
    },
    {
      key: "code",
      header: "Course Code",
      render: (r) => {
        // DB stores prerequisite as precourse_id
        const depId = r.precourse_id ?? r.prerequisite_course_id ?? r.corequisite_course_id;
        const code  = r.precourse_code || r.prerequisite_code || r.corequisite_code;
        const match = courses.find((c) => c.id === Number(depId));
        const display = code || (match ? (match.code || match.subject_code) : null) || (depId ? `ID-${depId}` : "");
        return <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent)" }}>{display}</span>;
      },
    },
    {
      key: "title",
      header: "Course Title",
      render: (r) => {
        const depId = r.precourse_id ?? r.prerequisite_course_id ?? r.corequisite_course_id;
        const title = r.precourse_title || r.prerequisite_title || r.corequisite_title;
        if (title) return title;
        const match = courses.find((c) => c.id === Number(depId));
        return match ? (match.title || match.name || "") : "";
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      width: "100px",
      render: (r) => (
        <RoleGuard allowedRoles={["admin", "faculty"]}>
          <button onClick={() => { setDeleteId(r.id); setDeleteDialogOpen(true); }} style={{ padding: "0.35rem", borderRadius: "6px", background: "transparent", border: "none", cursor: "pointer", color: "var(--error, #dc2626)", display: "flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.15s" }} title="Remove Dependency"
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </RoleGuard>
      ),
    },
  ];

  return (
    <div style={{ padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-dark)", letterSpacing: "-0.02em", margin: "0 0 0.25rem 0" }}>Prerequisites & Corequisites</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: 0 }}>Configure course dependencies</p>
        </div>
        <RoleGuard allowedRoles={["admin", "faculty"]}>
          <button onClick={() => { setTargetCourseId(selectedCourseId || ""); setPrereqCourseId(""); setAssignModalOpen(true); }} className="submit-btn" style={{ width: "auto", margin: 0, padding: "0.5rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" /></svg>
            Assign Dependency
          </button>
        </RoleGuard>
      </div>

      {/* ── Step 1: University  →  Step 2: Campus ─────────────────────────── */}
      <div className="panel-card" style={{ padding: "1rem 1.25rem", display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "1.25rem", marginBottom: "1rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-dark-sub)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            1 — Select University
          </label>
          <select
            value={selectedUniversityId ?? ""}
            onChange={e => setSelectedUniversityId(e.target.value ? Number(e.target.value) : null)}
            className="field-input"
            style={{ minWidth: "210px" }}
          >
            <option value="">All Universities</option>
            {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>

        <span style={{ fontSize: "1.4rem", color: "var(--text-muted)", paddingBottom: "0.15rem" }}>›</span>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", opacity: selectedUniversityId ? 1 : 0.45 }}>
          <label style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-dark-sub)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            2 — Select Campus
          </label>
          <select
            value={selectedCampusId ?? ""}
            onChange={e => setSelectedCampusId(e.target.value ? Number(e.target.value) : null)}
            className="field-input"
            style={{ minWidth: "190px" }}
            disabled={!selectedUniversityId}
          >
            <option value="">All Campuses</option>
            {campuses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.branch_code})</option>)}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.1rem" }}>
          {selectedCampusId ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.3rem 0.75rem", borderRadius: "20px", background: "rgba(16,185,129,0.12)", color: "var(--success,#059669)", fontSize: "0.78rem", fontWeight: 700 }}>
              ● {campuses.find(c => c.id === selectedCampusId)?.name}
            </span>
          ) : selectedUniversityId ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.3rem 0.75rem", borderRadius: "20px", background: "rgba(29,111,191,0.1)", color: "var(--accent)", fontSize: "0.78rem", fontWeight: 700 }}>
              ● {universities.find(u => u.id === selectedUniversityId)?.name}
            </span>
          ) : (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", padding: "0.3rem 0.75rem", borderRadius: "20px", background: "var(--input-bg)", color: "var(--text-dark-sub)", fontSize: "0.78rem", fontWeight: 600 }}>
              Showing all data
            </span>
          )}
          {(selectedUniversityId || selectedCampusId) && (
            <button
              onClick={() => { setSelectedUniversityId(null); setSelectedCampusId(null); }}
              style={{ padding: "0.3rem 0.6rem", borderRadius: "6px", border: "1px solid var(--input-border)", background: "transparent", color: "var(--text-dark-sub)", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}
            >✕ Clear</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "2px", padding: "0.25rem", background: "var(--input-bg)", borderRadius: "8px", width: "fit-content" }}>
        <button onClick={() => setActiveTab("prerequisites")} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: activeTab === "prerequisites" ? 700 : 600, borderRadius: "6px", border: "none", cursor: "pointer", background: activeTab === "prerequisites" ? "var(--card-bg)" : "transparent", color: activeTab === "prerequisites" ? "var(--text-dark)" : "var(--text-dark-sub)", boxShadow: activeTab === "prerequisites" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>Prerequisites</button>
        <button onClick={() => setActiveTab("corequisites")} style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: activeTab === "corequisites" ? 700 : 600, borderRadius: "6px", border: "none", cursor: "pointer", background: activeTab === "corequisites" ? "var(--card-bg)" : "transparent", color: activeTab === "corequisites" ? "var(--text-dark)" : "var(--text-dark-sub)", boxShadow: activeTab === "corequisites" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>Corequisites</button>
      </div>

      {/* Course Selector Bar */}
      <div className="panel-card" style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-dark-sub)", textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0 }}>Select Target Course:</label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value ? Number(e.target.value) : "")}
          className="field-input"
          style={{ width: "320px", margin: 0 }}
        >
          <option value="">Choose a course...</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.code} - {c.title}
            </option>
          ))}
        </select>
      </div>

      {/* Dependency List for Selected Course */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-dark)", margin: 0 }}>
          Direct {activeTab === "prerequisites" ? "Prerequisites" : "Corequisites"} for {selectedCourse ? `${selectedCourse.code} (${selectedCourse.title})` : "Selected Course"}
        </h3>

        <div className="panel-card">
          <DataTable
            columns={columns}
            data={activeTab === "prerequisites" ? prerequisites : corequisites}
            loading={loading}
            searchQuery=""
            onSearchChange={() => {}}
            page={1}
            totalPages={1}
            totalCount={activeTab === "prerequisites" ? prerequisites.length : corequisites.length}
            onPageChange={() => {}}
            itemsPerPage={10}
            onItemsPerPageChange={() => {}}
            emptyMessage={`No ${activeTab} configured for this course.`}
          />
        </div>
      </div>

      {/* Visual Dependency Tree Diagram */}
      <div className="panel-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-dark)", margin: 0 }}>Dependency Tree</h3>
          <p style={{ fontSize: "0.75rem", color: "var(--text-dark-sub)", margin: "0.25rem 0 0 0" }}>Hierarchical visual flow of required {activeTab === "prerequisites" ? "prior" : "parallel"} courses</p>
        </div>

        {!selectedCourse ? (
          <EmptyState title="No Course Selected" description="Select a course above to view its dependency tree." />
        ) : (activeTab === "prerequisites" ? prerequisites.length : corequisites.length) === 0 ? (
          <div style={{ padding: "2rem", textAlign: "center", background: "var(--input-bg)", borderRadius: "12px", border: "1px dashed var(--input-border)" }}>
            <span style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
              <svg style={{ width: "2rem", height: "2rem", color: "#059669" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </span>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-dark)", margin: 0 }}>No {activeTab === "prerequisites" ? "Prerequisites" : "Corequisites"} Required</p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-dark-sub)", marginTop: "0.25rem" }}>Students can enroll in {selectedCourse.code} without additional dependencies.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1.5rem 0", overflowX: "auto" }}>
            {/* Parent Box (Selected Course) */}
            <div style={{ padding: "0.75rem 1.5rem", background: "linear-gradient(135deg, var(--accent) 0%, #1a5fb4 100%)", color: "white", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", textAlign: "center", flexShrink: 0 }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "rgba(255,255,255,0.8)", display: "block" }}>{selectedCourse.code}</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, display: "block" }}>{selectedCourse.title}</span>
              <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.6)", marginTop: "0.1rem", display: "block", textTransform: "uppercase" }}>Target Course</span>
            </div>

            {/* Connecting Line Down */}
            <div style={{ width: "2px", height: "32px", background: "var(--accent)", opacity: 0.5, margin: "0.25rem 0" }} />

            {/* Branch Header */}
            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text-dark-sub)", background: "var(--input-bg)", padding: "0.25rem 0.75rem", borderRadius: "100px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>
              {activeTab === "prerequisites" ? "Requires Prior Completion Of" : "Requires Concurrent Enrollment In"}
            </div>

            {/* Children Grid */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem", maxWidth: "800px" }}>
              {(activeTab === "prerequisites" ? prerequisites : corequisites).map((p) => (
                <div
                  key={p.id}
                  style={{ padding: "1rem", background: "var(--card-bg)", border: "2px solid rgba(29, 111, 191, 0.2)", borderRadius: "12px", boxShadow: "var(--shadow-card)", textAlign: "center", minWidth: "170px" }}
                >
                  <span style={{ fontFamily: "monospace", fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)", display: "block" }}>
                    {(p as any).precourse_code || (p as any).prerequisite_code || (p as any).corequisite_code || courses.find(c => c.id === ((p as any).precourse_id ?? (p as any).prerequisite_course_id ?? (p as any).corequisite_course_id))?.code || `ID-${(p as any).precourse_id ?? (p as any).prerequisite_course_id ?? ""}`}
                  </span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-dark)", display: "block", marginTop: "0.1rem" }}>
                    {(p as any).precourse_title || (p as any).prerequisite_title || (p as any).corequisite_title || courses.find(c => c.id === ((p as any).precourse_id ?? (p as any).prerequisite_course_id ?? (p as any).corequisite_course_id))?.title || "-"}
                  </span>

                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Assign Dependency */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={activeTab === "prerequisites" ? "Assign Course Prerequisite" : "Assign Course Corequisite"}
        maxWidth="md"
        footer={
          <>
            <button
              onClick={() => setAssignModalOpen(false)}
              style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: 600, borderRadius: "8px", border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--text-dark)", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={handleAssignDependency}
              disabled={saving}
              className="submit-btn"
              style={{ width: "auto", margin: 0, padding: "0.5rem 1rem", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              Save Requirement
            </button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="field-label">Target Course *</label>
            <select
              value={targetCourseId}
              onChange={(e) => setTargetCourseId(e.target.value ? Number(e.target.value) : "")}
              className="field-input"
            >
              <option value="">Select target course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">{activeTab === "prerequisites" ? "Prerequisite" : "Corequisite"} Course *</label>
            <select
              value={prereqCourseId}
              onChange={(e) => setPrereqCourseId(e.target.value ? Number(e.target.value) : "")}
              className="field-input"
            >
              <option value="">Select required course...</option>
              {courses
                .filter((c) => c.id !== Number(targetCourseId))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title}
                  </option>
                ))}
            </select>
          </div>


        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleRemove}
        title={`Remove ${activeTab === "prerequisites" ? "Prerequisite" : "Corequisite"}`}
        message={`Are you sure you want to remove this ${activeTab === "prerequisites" ? "prerequisite" : "corequisite"} rule?`}
        confirmText="Remove"
        type="danger"
      />
    </div>
  );
};

export default PrerequisiteManagementPage;

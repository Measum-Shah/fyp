import React, { useState, useCallback } from "react";
import { DataTable, type Column } from "../components/common/DataTable";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { EmptyState } from "../components/common/EmptyState";
import { RoleGuard } from "../components/common/RoleGuard";
import { useAcademicData } from "../hooks/useAcademicData";
import { useRoleAccess } from "../hooks/useRoleAccess";
import { academicService } from "../services/academicService";
import { toast } from "./AcademicLayout";
import type { Course, CourseCategory, Program, CurriculumVersion } from "../types";

const badgeColors: Record<string, { bg: string; color: string }> = {
  Core:     { bg: "rgba(29,111,191,0.12)", color: "var(--accent)" },
  Elective: { bg: "rgba(124,58,237,0.12)", color: "#7c3aed" },
  Optional: { bg: "rgba(16,185,129,0.12)", color: "#059669" },
  Lab:      { bg: "rgba(217,119,6,0.12)",  color: "#d97706" },
  General:  { bg: "var(--input-bg)",        color: "var(--text-dark-sub)" },
  Thesis:   { bg: "rgba(225,29,72,0.12)",  color: "#e11d48" },
};
const CategoryBadge: React.FC<{ category?: string }> = ({ category }) => {
  const s = (category && badgeColors[category]) ? badgeColors[category] : badgeColors.General;
  return <span style={{ display:"inline-flex", padding:"0.2rem 0.6rem", borderRadius:"6px", fontSize:"0.7rem", fontWeight:700, background:s.bg, color:s.color }}>{category || "—"}</span>;
};
const StatusBadge: React.FC<{ status?: string }> = ({ status }) => (
  <span style={{ display:"inline-flex", padding:"0.2rem 0.6rem", borderRadius:"6px", fontSize:"0.7rem", fontWeight:700, background:status==="active"?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)", color:status==="active"?"var(--success,#059669)":"var(--error,#dc2626)" }}>
    {status === "active" ? "● Active" : "● Inactive"}
  </span>
);

const SCHOOL_CLASSES = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Class ${i + 1}` }));
const COLLEGE_YEARS  = ["First Year", "Second Year"];
const COLLEGE_GROUPS = ["Pre-Medical", "Pre-Engineering", "ICS", "Commerce", "Arts", "Humanities"];

const CourseCatalogPage: React.FC = () => {
  const { institutionType } = useRoleAccess();
  const isUnivOrInst = institutionType === "university" || institutionType === "institute";
  const isSchool     = institutionType === "school";
  const isCollege    = institutionType === "college";

  const creditLabel = isSchool || isCollege ? "Marks" : "Credit Hours";
  const semLabel    = isSchool ? "Class" : isCollege ? "Year/Group" : "Semester";
  const codeHeader  = isSchool || isCollege ? "Code" : "Code";

  const [viewMode,      setViewMode]      = useState<"table"|"grid">("table");
  const [categoryFilter,setCategoryFilter]= useState("all");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [deptFilter,    setDeptFilter]    = useState("all");
  const [progFilter,    setProgFilter]    = useState("all");
  const [semFilter,     setSemFilter]     = useState("all");
  const [modalOpen,     setModalOpen]     = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteDialogOpen,setDeleteDialogOpen] = useState(false);
  const [editCourse,    setEditCourse]    = useState<Course | null>(null);
  const [viewCourse,    setViewCourse]    = useState<Course | null>(null);
  const [deleteId,      setDeleteId]      = useState<number | null>(null);
  const [departments,   setDepartments]   = useState<any[]>([]);
  const [programs,      setPrograms]      = useState<Program[]>([]);
  const [versions,      setVersions]      = useState<CurriculumVersion[]>([]);
  const [saving,        setSaving]        = useState(false);

  const defaultForm = (): Partial<Course> => ({
    code: "", title: "", description: "",
    lecture_hours: isSchool || isCollege ? 0 : 3,
    lab_hours: 0,
    credit_hours: isSchool || isCollege ? 0 : 3,
    marks: isSchool || isCollege ? 100 : undefined,
    category: "Core", status: "active",
  });
  const [formData, setFormData] = useState<Partial<Course>>(defaultForm());

  React.useEffect(() => {
    academicService.getDepartments(institutionType).then(setDepartments).catch(() => {});
    academicService.getPrograms(institutionType).then(setPrograms).catch(() => {});
    academicService.getVersions(institutionType).then(setVersions).catch(() => {});
  }, [institutionType]);

  const fetcher = useCallback(() => academicService.getCourses(undefined, institutionType), [institutionType]);
  const coursesData = useAcademicData<Course>(fetcher, ["code", "title", "category", "status"]);

  const filteredData = coursesData.data.filter(c => {
    if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
    if (statusFilter   !== "all" && c.status   !== statusFilter)   return false;
    if (deptFilter     !== "all" && c.department_id !== Number(deptFilter)) return false;
    if (progFilter     !== "all" && c.program_id    !== Number(progFilter))  return false;
    if (isUnivOrInst && semFilter !== "all" && c.semester_suggested !== Number(semFilter)) return false;
    if (isSchool && semFilter !== "all" && String(c.class_id) !== semFilter) return false;
    if (isCollege && semFilter !== "all" && c.college_year !== semFilter) return false;
    return true;
  });

  const openCreateModal = () => {
    setEditCourse(null);
    setFormData({ ...defaultForm(), department_id: departments[0]?.id, program_id: programs[0]?.id });
    setModalOpen(true);
  };
  const openEditModal   = (c: Course) => { setEditCourse(c); setFormData({ ...c }); setModalOpen(true); };
  const openViewModal   = (c: Course) => { setViewCourse(c); setViewModalOpen(true); };
  const openDeleteDialog= (id: number) => { setDeleteId(id); setDeleteDialogOpen(true); };


  const handleSave = async () => {
    // ── Validation ──────────────────────────────────────────────────
    if (!formData.title) { toast.error("Validation", "Course title is required."); return; }
    if (isSchool && !formData.class_id) { toast.error("Validation", "Please select a Class."); return; }
    if (isCollege && (!formData.college_year || !formData.college_group)) {
      toast.error("Validation", "Please select Year/Class and Group."); return;
    }
    if (isUnivOrInst && !formData.semester_suggested) {
      toast.error("Validation", "Please select a Semester."); return;
    }
    setSaving(true);
    try {
      const payload = { ...formData, institution_type: institutionType };
      if (editCourse) {
        const updated = await academicService.updateCourse(editCourse.id, payload);
        coursesData.updateItem(editCourse.id, updated);
        toast.success("Course Updated", `${formData.title} updated.`);
      } else {
        const created = await academicService.createCourse(payload as any);
        coursesData.addItem(created);
        toast.success("Course Created", `${formData.title} added.`);
      }
      setModalOpen(false);
    } catch (err: any) { toast.error("Error", err.message || "Failed to save."); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await academicService.deleteCourse(deleteId);
      coursesData.removeItem(deleteId);
      toast.success("Deleted", "Course removed.");
    } catch (err: any) { toast.error("Error", err.message || "Failed to delete."); }
    setDeleteDialogOpen(false);
    setDeleteId(null);
  };

  const iconBtn: React.CSSProperties = { padding:"0.35rem", borderRadius:"6px", background:"transparent", border:"none", cursor:"pointer", color:"var(--text-dark-sub)", display:"flex", alignItems:"center", justifyContent:"center" };
  const tabBtn = (active: boolean): React.CSSProperties => ({ padding:"0.4rem 0.75rem", fontSize:"0.78rem", borderRadius:"6px", border:"none", cursor:"pointer", fontWeight:600, background:active?"var(--card-bg)":"transparent", color:active?"var(--text-dark)":"var(--text-dark-sub)", boxShadow:active?"0 1px 3px rgba(0,0,0,0.1)":"none" });
  const cancelBtn: React.CSSProperties = { padding:"0.5rem 1rem", fontSize:"0.85rem", fontWeight:600, borderRadius:"8px", border:"1px solid var(--input-border)", background:"var(--input-bg)", color:"var(--text-dark)", cursor:"pointer" };


  // ── Table columns (institution-adaptive) ──────────────────────────────────
  const actionCell = (r: Course) => (
    <div style={{ display:"flex", gap:"0.25rem", justifyContent:"center" }}>
      <button onClick={() => openViewModal(r)} style={{ ...iconBtn, color:"var(--accent)" }} title="View"
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}><svg style={{width:"16px",height:"16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button>
      <RoleGuard allowedRoles={["admin","faculty"]}>
        <button onClick={() => openEditModal(r)} style={{ ...iconBtn, color:"#059669" }} title="Edit"
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}><svg style={{width:"16px",height:"16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
        <button onClick={() => openDeleteDialog(r.id)} style={{ ...iconBtn, color:"var(--error, #dc2626)" }} title="Delete"
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}><svg style={{width:"16px",height:"16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
      </RoleGuard>
    </div>
  );

  const baseColumns: Column<Course>[] = [
    { key:"code",  header:"Code",  render:(r) => <span style={{fontFamily:"monospace",fontWeight:700,color:"var(--accent)"}}>{r.code || "—"}</span> },
    { key:"title", header:"Title", render:(r) => r.title || "—" },
  ];

  const univCols: Column<Course>[] = [
    ...baseColumns,
    { key:"department_name", header:"Department", render:(r) => r.department_name || "—" },
    { key:"semester_suggested", header:"Semester", render:(r) => r.semester_suggested ? `Sem ${r.semester_suggested}` : "—", align:"center" },
    { key:"credit_hours", header:"Credits", render:(r) => `${r.credit_hours ?? 0} (${r.lecture_hours ?? 0}+${r.lab_hours ?? 0})`, align:"center" },
    { key:"category", header:"Category", render:(r) => <CategoryBadge category={r.category} />, align:"center" },
    { key:"status",   header:"Status",   render:(r) => <StatusBadge status={r.status} />,       align:"center" },
    { key:"actions",  header:"Actions",  render:actionCell, align:"center", width:"120px" },
  ];

  const schoolCols: Column<Course>[] = [
    ...baseColumns,
    { key:"class_id",    header:"Class",     render:(r) => r.class_id ? `Class ${r.class_id}` : "—", align:"center" },
    { key:"credit_hours",header:"Marks",     render:(r) => r.marks ?? r.credit_hours ?? "—",          align:"center" },
    { key:"category",    header:"Category",  render:(r) => <CategoryBadge category={r.category} />,    align:"center" },
    { key:"status",      header:"Status",    render:(r) => <StatusBadge status={r.status} />,          align:"center" },
    { key:"actions",     header:"Actions",   render:actionCell, align:"center", width:"120px" },
  ];

  const collegeCols: Column<Course>[] = [
    ...baseColumns,
    { key:"college_year",  header:"Year",   render:(r) => r.college_year  || "—" },
    { key:"college_group", header:"Group",  render:(r) => r.college_group || "—" },
    { key:"credit_hours",  header:"Marks",  render:(r) => r.marks ?? r.credit_hours ?? "—", align:"center" },
    { key:"category",      header:"Category", render:(r) => <CategoryBadge category={r.category} />, align:"center" },
    { key:"status",        header:"Status",   render:(r) => <StatusBadge status={r.status} />,        align:"center" },
    { key:"actions",       header:"Actions",  render:actionCell, align:"center", width:"120px" },
  ];

  const columns = isSchool ? schoolCols : isCollege ? collegeCols : univCols;


  // ── Institution-specific form ─────────────────────────────────────────────
  const renderForm = () => {
    const set = (k: string, v: any) => setFormData(p => ({ ...p, [k]: v }));
    const commonTop = (
      <>
        <div>
          <label className="field-label">Course Code</label>
          <input className="field-input" value={formData.code || ""} onChange={e => set("code", e.target.value)} placeholder="e.g. CS101" />
        </div>
        <div>
          <label className="field-label">Title *</label>
          <input className="field-input" required value={formData.title || ""} onChange={e => set("title", e.target.value)} placeholder="Course name" />
        </div>
        <div style={{ gridColumn:"1 / -1" }}>
          <label className="field-label">Description</label>
          <textarea className="field-input" rows={2} style={{ resize:"none" }} value={formData.description || ""} onChange={e => set("description", e.target.value)} />
        </div>
      </>
    );

    if (isSchool) return (
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"1rem" }}>
        {commonTop}
        <div>
          <label className="field-label">Class *</label>
          <select className="field-input" value={formData.class_id || ""} onChange={e => set("class_id", Number(e.target.value))}>
            <option value="">Select Class…</option>
            {SCHOOL_CLASSES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Marks (Total)</label>
          <input type="number" className="field-input" value={formData.marks ?? 100} onChange={e => set("marks", Number(e.target.value))} min={0} />
        </div>
        <div>
          <label className="field-label">Category</label>
          <select className="field-input" value={formData.category || "Core"} onChange={e => set("category", e.target.value as CourseCategory)}>
            {["Core","Elective","Optional","General"].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Status *</label>
          <select className="field-input" value={formData.status || "active"} onChange={e => set("status", e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    );

    if (isCollege) return (
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"1rem" }}>
        {commonTop}
        <div>
          <label className="field-label">Year / Class *</label>
          <select className="field-input" value={formData.college_year || ""} onChange={e => set("college_year", e.target.value)}>
            <option value="">Select Year…</option>
            {COLLEGE_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Group *</label>
          <select className="field-input" value={formData.college_group || ""} onChange={e => set("college_group", e.target.value)}>
            <option value="">Select Group…</option>
            {COLLEGE_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Marks (Total)</label>
          <input type="number" className="field-input" value={formData.marks ?? 100} onChange={e => set("marks", Number(e.target.value))} min={0} />
        </div>
        <div>
          <label className="field-label">Category</label>
          <select className="field-input" value={formData.category || "Core"} onChange={e => set("category", e.target.value as CourseCategory)}>
            {["Core","Elective","Optional","General"].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Status *</label>
          <select className="field-input" value={formData.status || "active"} onChange={e => set("status", e.target.value)}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    );

    // University / Institute
    return (
      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"1rem" }}>
        {commonTop}
        <div>
          <label className="field-label">Department *</label>
          <select className="field-input" value={formData.department_id || ""} onChange={e => { const d = departments.find(x => x.id === Number(e.target.value)); setFormData(p => ({ ...p, department_id: Number(e.target.value), department_name: d?.name || "" })); }}>
            <option value="">Select Department…</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Program</label>
          <select className="field-input" value={formData.program_id || ""} onChange={e => { const p = programs.find(x => x.id === Number(e.target.value)); setFormData(f => ({ ...f, program_id: Number(e.target.value), program_name: p?.name || p?.title || "" })); }}>
            <option value="">Select Program…</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name || p.title}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Curriculum Version</label>
          <select className="field-input" value={formData.curriculum_version_id || ""} onChange={e => setFormData(f => ({ ...f, curriculum_version_id: Number(e.target.value) }))}>
            <option value="">Select Version…</option>
            {versions.map(v => <option key={v.id} value={v.id}>{v.version_number}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Semester *</label>
          <select className="field-input" value={formData.semester_suggested || ""} onChange={e => setFormData(p => ({ ...p, semester_suggested: Number(e.target.value) }))}>
            <option value="">Select Semester…</option>
            {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Credit Hours *</label>
          <input type="number" className="field-input" value={formData.credit_hours ?? 3} onChange={e => setFormData(p => ({ ...p, credit_hours: Number(e.target.value) }))} min={0} />
        </div>
        <div>
          <label className="field-label">Lecture Hours</label>
          <input type="number" className="field-input" value={formData.lecture_hours ?? 3} onChange={e => setFormData(p => ({ ...p, lecture_hours: Number(e.target.value) }))} min={0} />
        </div>
        <div>
          <label className="field-label">Lab Hours</label>
          <input type="number" className="field-input" value={formData.lab_hours ?? 0} onChange={e => setFormData(p => ({ ...p, lab_hours: Number(e.target.value) }))} min={0} />
        </div>
        <div>
          <label className="field-label">Category *</label>
          <select className="field-input" value={formData.category || "Core"} onChange={e => setFormData(p => ({ ...p, category: e.target.value as CourseCategory }))}>
            {["Core","Elective","Optional","Lab","General","Thesis"].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Level / Grade</label>
          <input className="field-input" value={formData.level_or_grade || ""} onChange={e => setFormData(p => ({ ...p, level_or_grade: e.target.value }))} placeholder="e.g. Undergraduate" />
        </div>
        <div>
          <label className="field-label">Status *</label>
          <select className="field-input" value={formData.status || "active"} onChange={e => setFormData(p => ({ ...p, status: e.target.value as any }))}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    );
  };


  // ── Semester filter label ─────────────────────────────────────────────────
  const semesterFilterOptions = isSchool
    ? SCHOOL_CLASSES.map(c => ({ value: String(c.id), label: c.name }))
    : isCollege
    ? COLLEGE_YEARS.map(y => ({ value: y, label: y }))
    : [1,2,3,4,5,6,7,8].map(s => ({ value: String(s), label: `Sem ${s}` }));

  return (
    <div style={{ padding:"1.5rem 2rem", display:"flex", flexDirection:"column", gap:"1.25rem" }}>
      {/* Header */}
      <div className="panel-card-header">
        <div>
          <h2 className="topbar-title" style={{ fontSize:"1.4rem" }}>Course Catalog</h2>
          <p className="topbar-date">
            {isSchool ? "Manage class-wise subjects" : isCollege ? "Manage year & group subjects" : "Manage semester-wise courses"}
          </p>
        </div>
        <RoleGuard allowedRoles={["admin","faculty"]}>
          <button onClick={openCreateModal} className="submit-btn" style={{ width:"auto", padding:"0.5rem 1rem", fontSize:"0.85rem", margin:0 }}>
            + {isSchool || isCollege ? "Add Subject" : "Add Course"}
          </button>
        </RoleGuard>
      </div>

      {/* Filters */}
      <div className="panel-card" style={{ padding:"1rem 1.25rem", display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:"0.75rem" }}>
        <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:"0.75rem" }}>
          {isUnivOrInst && (
            <>
              <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="field-input" style={{ width:"auto" }}>
                <option value="all">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select value={progFilter} onChange={e => setProgFilter(e.target.value)} className="field-input" style={{ width:"auto" }}>
                <option value="all">All Programs</option>
                {programs.map(p => <option key={p.id} value={p.id}>{p.name || p.title}</option>)}
              </select>
            </>
          )}
          <select value={semFilter} onChange={e => setSemFilter(e.target.value)} className="field-input" style={{ width:"auto" }}>
            <option value="all">All {semLabel}s</option>
            {semesterFilterOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="field-input" style={{ width:"auto" }}>
            <option value="all">All Categories</option>
            {["Core","Elective","Optional","Lab","General","Thesis"].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="field-input" style={{ width:"auto" }}>
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"2px", padding:"0.25rem", background:"var(--input-bg)", borderRadius:"8px" }}>
          <button onClick={() => setViewMode("table")} style={tabBtn(viewMode==="table")}>Table</button>
          <button onClick={() => setViewMode("grid")}  style={tabBtn(viewMode==="grid")}>Grid</button>
        </div>
      </div>

      {/* Table */}
      {viewMode === "table" ? (
        <DataTable columns={columns} data={filteredData} loading={coursesData.loading}
          searchQuery={coursesData.searchQuery} onSearchChange={coursesData.setSearchQuery}
          searchPlaceholder="Search by code, title..."
          page={coursesData.page} totalPages={coursesData.totalPages}
          totalCount={filteredData.length} onPageChange={coursesData.setPage}
          itemsPerPage={coursesData.itemsPerPage} onItemsPerPageChange={coursesData.setItemsPerPage}
          emptyMessage="No courses found." />
      ) : (
        <div>
          {coursesData.loading ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem" }}>
              {[1,2,3,4,5,6].map(i => <div key={i} style={{ height:"180px", background:"var(--input-disabled-bg)", borderRadius:"var(--radius-card)" }} />)}
            </div>
          ) : filteredData.length === 0 ? (
            <EmptyState title="No Courses Found" description="Try adjusting filters." />
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:"1rem" }}>
              {filteredData.map(course => (
                <div key={course.id} className="panel-card" style={{ padding:"1.25rem", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.5rem" }}>
                      <span style={{ fontFamily:"monospace", fontWeight:700, fontSize:"0.85rem", color:"var(--accent)", background:"rgba(29,111,191,0.1)", padding:"0.2rem 0.6rem", borderRadius:"6px" }}>{course.code || "—"}</span>
                      <div style={{ display:"flex", gap:"0.375rem" }}><CategoryBadge category={course.category} /><StatusBadge status={course.status} /></div>
                    </div>
                    <h3 style={{ fontWeight:700, fontSize:"0.95rem", color:"var(--text-dark)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{course.title}</h3>
                    {isSchool && <p style={{ fontSize:"0.75rem", color:"var(--text-dark-sub)", marginTop:"0.25rem" }}>Class {course.class_id || "—"}</p>}
                    {isCollege && <p style={{ fontSize:"0.75rem", color:"var(--text-dark-sub)", marginTop:"0.25rem" }}>{course.college_year} — {course.college_group}</p>}
                    {isUnivOrInst && <p style={{ fontSize:"0.75rem", color:"var(--text-dark-sub)", marginTop:"0.25rem" }}>{course.department_name || "—"} | Sem {course.semester_suggested || "—"}</p>}
                  </div>
                  <div style={{ marginTop:"1rem", paddingTop:"0.75rem", borderTop:"1px solid var(--divider-color)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{ fontSize:"0.75rem", fontWeight:600, color:"var(--text-dark-sub)" }}>
                      {isSchool || isCollege ? `Marks: ${course.marks ?? course.credit_hours ?? "—"}` : `Credits: ${course.credit_hours ?? 0} (${course.lecture_hours ?? 0}L+${course.lab_hours ?? 0}P)`}
                    </span>
                    <div style={{ display:"flex", gap:"0.25rem" }}>
                      <button onClick={() => openViewModal(course)} style={{ ...iconBtn, color:"var(--accent)" }} title="View"
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}><svg style={{width:"16px",height:"16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button>
                      <RoleGuard allowedRoles={["admin","faculty"]}>
                        <button onClick={() => openEditModal(course)} style={{ ...iconBtn, color:"#059669" }} title="Edit"
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}><svg style={{width:"16px",height:"16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                        <button onClick={() => openDeleteDialog(course.id)} style={{ ...iconBtn, color:"var(--error, #dc2626)" }} title="Delete"
                          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}><svg style={{width:"16px",height:"16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                      </RoleGuard>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editCourse ? "Edit Course" : isSchool || isCollege ? "Add Subject" : "Add Course"}
        subtitle={editCourse ? `Editing: ${editCourse.code}` : undefined}
        maxWidth="2xl"
        footer={<>
          <button onClick={() => setModalOpen(false)} style={cancelBtn}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="submit-btn" style={{ width:"auto", margin:0, padding:"0.5rem 1rem", fontSize:"0.85rem" }}>
            {saving ? "Saving…" : editCourse ? "Save Changes" : "Create"}
          </button>
        </>}>
        {renderForm()}
      </Modal>

      {/* View Modal */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Course Details" subtitle={viewCourse?.title} maxWidth="md">
        {viewCourse && (
          <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingBottom:"0.75rem", borderBottom:"1px solid var(--divider-color)" }}>
              <span style={{ fontFamily:"monospace", fontSize:"1.1rem", fontWeight:700, color:"var(--accent)" }}>{viewCourse.code || "—"}</span>
              <div style={{ display:"flex", gap:"0.5rem" }}><CategoryBadge category={viewCourse.category} /><StatusBadge status={viewCourse.status} /></div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem", fontSize:"0.875rem" }}>
              <div><span style={{ fontSize:"0.7rem", color:"var(--text-dark-sub)", fontWeight:700, textTransform:"uppercase" }}>Title</span><p style={{ color:"var(--text-dark)", margin:0 }}>{viewCourse.title || "—"}</p></div>
              {isSchool && <div><span style={{ fontSize:"0.7rem", color:"var(--text-dark-sub)", fontWeight:700, textTransform:"uppercase" }}>Class</span><p style={{ color:"var(--text-dark)", margin:0 }}>Class {viewCourse.class_id || "—"}</p></div>}
              {isCollege && <><div><span style={{ fontSize:"0.7rem", color:"var(--text-dark-sub)", fontWeight:700, textTransform:"uppercase" }}>Year</span><p style={{ color:"var(--text-dark)", margin:0 }}>{viewCourse.college_year || "—"}</p></div><div><span style={{ fontSize:"0.7rem", color:"var(--text-dark-sub)", fontWeight:700, textTransform:"uppercase" }}>Group</span><p style={{ color:"var(--text-dark)", margin:0 }}>{viewCourse.college_group || "—"}</p></div></>}
              {isUnivOrInst && <><div><span style={{ fontSize:"0.7rem", color:"var(--text-dark-sub)", fontWeight:700, textTransform:"uppercase" }}>Department</span><p style={{ color:"var(--text-dark)", margin:0 }}>{viewCourse.department_name || "—"}</p></div><div><span style={{ fontSize:"0.7rem", color:"var(--text-dark-sub)", fontWeight:700, textTransform:"uppercase" }}>Semester</span><p style={{ color:"var(--text-dark)", margin:0 }}>Sem {viewCourse.semester_suggested || "—"}</p></div><div><span style={{ fontSize:"0.7rem", color:"var(--text-dark-sub)", fontWeight:700, textTransform:"uppercase" }}>Credits</span><p style={{ color:"var(--text-dark)", margin:0 }}>{viewCourse.credit_hours} ({viewCourse.lecture_hours} Lec, {viewCourse.lab_hours} Lab)</p></div></>}
              {(isSchool || isCollege) && <div><span style={{ fontSize:"0.7rem", color:"var(--text-dark-sub)", fontWeight:700, textTransform:"uppercase" }}>Marks</span><p style={{ color:"var(--text-dark)", margin:0 }}>{viewCourse.marks ?? viewCourse.credit_hours ?? "—"}</p></div>}
              <div style={{ gridColumn:"1 / -1" }}><span style={{ fontSize:"0.7rem", color:"var(--text-dark-sub)", fontWeight:700, textTransform:"uppercase" }}>Description</span><p style={{ color:"var(--text-dark)", margin:0 }}>{viewCourse.description || "N/A"}</p></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete */}
      <ConfirmDialog isOpen={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onConfirm={handleDelete}
        title="Delete Course" message="Are you sure you want to delete this course?? This cannot be undone."
        confirmText="Delete" type="danger" />
    </div>
  );
};

export default CourseCatalogPage;


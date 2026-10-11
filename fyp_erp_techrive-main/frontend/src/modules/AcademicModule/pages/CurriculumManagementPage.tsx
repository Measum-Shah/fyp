import React, { useState, useCallback, useEffect } from "react";
import { DataTable, type Column } from "../components/common/DataTable";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { EmptyState } from "../components/common/EmptyState";
import { RoleGuard } from "../components/common/RoleGuard";
import { useAcademicData } from "../hooks/useAcademicData";
import { useRoleAccess } from "../hooks/useRoleAccess";
import { academicService } from "../services/academicService";
import { toast } from "./AcademicLayout";
import type { Curriculum, CurriculumVersion, Course, Program } from "../types";

type MainTab = "list" | "builder" | "versions";

const CurriculumStatusBadge: React.FC<{ status?: string | null }> = ({ status }) => {
  const colors: Record<string, { bg: string; color: string }> = {
    active:   { bg: "rgba(16,185,129,0.12)", color: "var(--success, #059669)" },
    inactive: { bg: "rgba(225,29,72,0.12)",  color: "#e11d48" },
    draft:    { bg: "rgba(217,119,6,0.12)",  color: "#d97706" },
    archived: { bg: "var(--input-bg)",        color: "var(--text-dark-sub)" },
  };
  const s = colors[status || "draft"] || colors.draft;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", padding:"0.2rem 0.6rem", borderRadius:"6px", fontSize:"0.7rem", fontWeight:700, background:s.bg, color:s.color }}>
      {status || "draft"}
    </span>
  );
};

const SCHOOL_CLASSES  = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Class ${i + 1}` }));
const COLLEGE_YEARS   = ["First Year", "Second Year"];
const COLLEGE_GROUPS  = ["Pre-Medical", "Pre-Engineering", "ICS", "Commerce", "Arts"];

const CurriculumManagementPage: React.FC = () => {
  const { institutionType } = useRoleAccess();
  const isUnivOrInst = institutionType === "university" || institutionType === "institute";
  const isSchool     = institutionType === "school";
  const isCollege    = institutionType === "college";

  // Removed static builderLanes - now computed dynamically below

  const semLabel    = isSchool ? "Class" : isCollege ? "Year/Group" : "Semester";
  const courseLabel = isSchool || isCollege ? "Subject" : "Course";
  const creditLabel = isSchool || isCollege ? "Marks" : "Credits";

  const [activeTab, setActiveTab] = useState<MainTab>("list");

  // List tab data
  const fetchCurriculums = useCallback(() => academicService.getCurriculums(institutionType), [institutionType]);
  const curriculumsData  = useAcademicData<Curriculum>(fetchCurriculums, ["code", "title", "program_name"]);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [sortBy,       setSortBy]       = useState<string>("name_asc");
  const [programs,     setPrograms]     = useState<Program[]>([]);
  const [departments,  setDepartments]  = useState<any[]>([]);
  const [majors,       setMajors]       = useState<any[]>([]);
  const [minors,       setMinors]       = useState<any[]>([]);

  useEffect(() => {
    academicService.getPrograms(institutionType).then(setPrograms).catch(() => {});
    academicService.getDepartments(institutionType).then(setDepartments).catch(() => {});
    if (isUnivOrInst) {
      academicService.getMajors(institutionType).then(setMajors).catch(() => {});
      academicService.getMinors(institutionType).then(setMinors).catch(() => {});
    }
  }, [institutionType, isUnivOrInst]);

  // Versions tab data
  const fetchVersions = useCallback(() => academicService.getVersions(institutionType), [institutionType]);
  const versionsData  = useAcademicData<CurriculumVersion>(fetchVersions, ["version_number", "change_log"]);

  // Builder state
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<number | null>(null);
  const [allCourses,    setAllCourses]    = useState<Course[]>([]);
  const [laneCourses,   setLaneCourses]   = useState<Record<string, Course[]>>({});
  const [assignModalOpen,  setAssignModalOpen]  = useState(false);
  const [assignLaneKey,    setAssignLaneKey]    = useState<string>("1");
  const [assignCourseId,   setAssignCourseId]   = useState<number | "">("");

  // Curriculum create/edit modal
  const [curriculumModalOpen, setCurriculumModalOpen] = useState(false);
  const [editCurriculum,      setEditCurriculum]      = useState<Curriculum | null>(null);
  const [curriculumFormData,  setCurriculumFormData]  = useState<Partial<Curriculum>>({ status: "draft", total_semesters: isCollege ? 2 : isSchool ? 2 : 8 });
  const [viewCurriculumOpen,  setViewCurriculumOpen]  = useState(false);
  const [viewCurriculumData,  setViewCurriculumData]  = useState<Curriculum | null>(null);

  // Version modal
  const [versionModalOpen,     setVersionModalOpen]     = useState(false);
  const [versionFormData,      setVersionFormData]      = useState<Partial<CurriculumVersion>>({ status: "draft" });
  const [editVersionStatusModal, setEditVersionStatusModal] = useState(false);
  const [editingVersion,         setEditingVersion]         = useState<CurriculumVersion | null>(null);
  const [versionStatusFormData,  setVersionStatusFormData]  = useState<string>("active");

  const [saving,            setSaving]            = useState(false);
  const [deleteModalOpen,   setDeleteModalOpen]   = useState(false);
  const [curriculumToDelete,setCurriculumToDelete]= useState<number | null>(null);

  useEffect(() => {
    academicService.getCourses(undefined, institutionType).then(setAllCourses).catch(() => {});
  }, [institutionType]);

  useEffect(() => {
    if (curriculumsData.data.length > 0 && !selectedCurriculumId) {
      setSelectedCurriculumId(curriculumsData.data[0].id);
    }
  }, [curriculumsData.data, selectedCurriculumId]);

  const activeCurriculum = React.useMemo(() => curriculumsData.data.find(c => c.id === selectedCurriculumId) || null, [curriculumsData.data, selectedCurriculumId]);

  // Dynamic lane definitions per selected curriculum
  const builderLanes = React.useMemo(() => {
    if (!activeCurriculum) return [];
    if (isSchool) {
      const total = activeCurriculum.total_semesters || 2;
      return Array.from({ length: total }, (_, i) => ({ key: String(i + 1), label: `Term ${i + 1}` }));
    }
    if (isCollege) {
      const total = activeCurriculum.total_semesters || 2;
      const years = ["First Year", "Second Year", "Third Year", "Fourth Year"].slice(0, total);
      return years.map(yr => ({ key: yr, label: yr }));
    }
    const total = activeCurriculum.total_semesters || 8;
    return Array.from({ length: total }, (_, i) => ({ key: String(i + 1), label: `Semester ${i + 1}` }));
  }, [activeCurriculum, isSchool, isCollege]);

  // Load courses dynamically for the selected curriculum's program
  useEffect(() => {
    if (activeCurriculum && activeCurriculum.program_id) {
      academicService.getCourses({ program_id: activeCurriculum.program_id }, institutionType).then((courses) => {
        const initial: Record<string, Course[]> = {};
        builderLanes.forEach(l => { initial[l.key] = []; });
        courses.forEach(course => {
          // If the course has a semester string (e.g., "1"), put it in the matching lane
          const key = course.semester ? String(course.semester) : undefined;
          if (key && initial[key] !== undefined) {
            initial[key].push(course);
          }
        });
        setLaneCourses(initial);
      }).catch(() => {});
    } else {
      const initial: Record<string, Course[]> = {};
      builderLanes.forEach(l => { initial[l.key] = []; });
      setLaneCourses(initial);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCurriculum, institutionType, builderLanes]);
  // Computed label helpers
  const currProgramHeader       = isSchool ? "Grade/Class"  : "Program";
  const currSemesterHeader      = isSchool ? "Term"         : isCollege ? "Year" : "Semester";
  const currTotalSemestersHeader= isSchool ? "Total Terms" : isCollege ? "Total Years" : "Total Semesters";
  const currCreditsHeader       = isSchool || isCollege ? "Total Marks" : "Total Credits";

  const handleAssignCourse = async () => {
    if (!assignCourseId) return;
    const course = allCourses.find(c => c.id === Number(assignCourseId));
    if (!course) return;
    if ((laneCourses[assignLaneKey] || []).some(c => c.id === course.id)) {
      toast.error("Duplicate", `Already assigned to this ${semLabel}.`);
      return;
    }
    try {
      // Persist: update the course's semester field in the database
      await academicService.updateCourse(course.id, { semester: isCollege ? assignLaneKey : Number(assignLaneKey) } as any);
      const updatedCourse: Course = { ...course, semester: Number(assignLaneKey) };
      setLaneCourses(prev => ({ ...prev, [assignLaneKey]: [...(prev[assignLaneKey] || []), updatedCourse] }));
      const laneLabel = builderLanes.find(l => l.key === assignLaneKey)?.label || assignLaneKey;
      toast.success(`${courseLabel} Assigned`, `${course.code || course.title} added to ${laneLabel}`);
    } catch (err: any) {
      toast.error("Assignment Failed", err.message || "Could not assign course.");
    }
    setAssignModalOpen(false);
    setAssignCourseId("");
  };

  const handleRemoveCourse = async (laneKey: string, courseId: number) => {
    try {
      // Clear the semester field in the database so it's no longer assigned to this lane
      await academicService.updateCourse(courseId, { semester: null } as any);
      setLaneCourses(prev => ({ ...prev, [laneKey]: (prev[laneKey] || []).filter(c => c.id !== courseId) }));
      toast.success(`${courseLabel} Removed`);
    } catch (err: any) {
      toast.error("Remove Failed", err.message || "Could not remove course.");
    }
  };

  // ── CRUD handlers ──────────────────────────────────────────────────────────
  const handleSaveCurriculum = async () => {
    setSaving(true);
    try {
      if (editCurriculum) {
        const updated = await academicService.updateCurriculum(editCurriculum.id, curriculumFormData);
        curriculumsData.updateItem(editCurriculum.id, updated);
        toast.success("Curriculum Updated");
      } else {
        const created = await academicService.createCurriculum({ ...curriculumFormData, institution_type: institutionType } as any);
        curriculumsData.addItem(created);
        toast.success("Curriculum Created");
      }
      setCurriculumModalOpen(false);
    } catch (err: any) { toast.error("Save Failed", err.message); }
    setSaving(false);
  };

  const handleSaveVersion = async () => {
    setSaving(true);
    try {
      const created = await academicService.createVersion(versionFormData as any);
      versionsData.addItem(created);
      toast.success("Version Created", `Version ${created.version_number} added.`);
      setVersionModalOpen(false);
    } catch (err: any) { toast.error("Save Failed", err.message); }
    setSaving(false);
  };

  const handleUpdateVersionStatus = async () => {
    if (!editingVersion) return;
    setSaving(true);
    try {
      const updated = await academicService.updateVersion(editingVersion.id, { status: versionStatusFormData as any });
      versionsData.updateItem(editingVersion.id, updated);
      toast.success("Version Status Updated");
      setEditVersionStatusModal(false);
    } catch (err: any) { toast.error("Update Failed", err.message); }
    setSaving(false);
  };

  const handleDeleteCurriculum = async () => {
    if (!curriculumToDelete) return;
    setSaving(true);
    try {
      await academicService.deleteCurriculum(curriculumToDelete);
      curriculumsData.removeItem(curriculumToDelete);
      toast.success("Curriculum Deleted");
      setDeleteModalOpen(false);
      setCurriculumToDelete(null);
      if (selectedCurriculumId === curriculumToDelete) setSelectedCurriculumId(null);
    } catch (err: any) { toast.error("Deletion Failed", err.message); }
    setSaving(false);
  };

  // ── Curriculum list columns ────────────────────────────────────────────────
  const curriculumColumns: Column<Curriculum>[] = [
    { key:"code",  header:"Code",       render:(r) => <span style={{fontFamily:"monospace",fontWeight:700,color:"var(--accent)"}}>{r.code || `CURR-${r.id}`}</span> },
    { key:"title", header:"Title", render:(r) => r.title || "—" },
    { key:"department_name", header:"Department", render:(r) => r.department_name || "—" },
    { key:"program_name",    header:currProgramHeader,   render:(r) => r.program_name    || "—" },
    { key:"academic_year",   header:"Academic Year",      render:(r) => r.academic_year   || "—", align:"center" },
    { key:"semester",        header:currSemesterHeader,   render:(r) => r.semester        || "N/A", align:"center" },
    { key:"total_semesters", header:currTotalSemestersHeader, align:"center", render:(r) => r.total_semesters ?? "—" },
    ...((!isCollege) ? [{ key:"total_credits" as keyof Curriculum, header:currCreditsHeader, align:"center" as const, render:(r: Curriculum) => r.total_credits ?? "—" }] : []),
    { key:"current_version", header:"Version",  render:(r) => `v${r.current_version || "1.0"}`, align:"center" },
    { key:"status",          header:"Status",   render:(r) => <CurriculumStatusBadge status={r.status} />, align:"center" },
    {
      key:"actions", header:"Actions", align:"center",
      render:(r) => (
        <div style={{display:"flex",gap:"0.5rem",justifyContent:"center"}}>
          <button onClick={() => { setViewCurriculumData(r); setViewCurriculumOpen(true); }} style={{padding:"0.35rem",border:"none",background:"transparent",cursor:"pointer",color:"var(--accent)",borderRadius:"6px",display:"inline-flex",alignItems:"center",justifyContent:"center",transition:"opacity 0.15s"}} title="View"
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            <svg style={{width:"16px",height:"16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </button>
          <RoleGuard allowedRoles={["admin","faculty"]}>
            <button onClick={() => { setEditCurriculum(r); setCurriculumFormData(r); setCurriculumModalOpen(true); }} style={{padding:"0.35rem",border:"none",background:"transparent",cursor:"pointer",color:"#059669",borderRadius:"6px",display:"inline-flex",alignItems:"center",justifyContent:"center",transition:"opacity 0.15s"}} title="Edit"
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
              <svg style={{width:"16px",height:"16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
            </button>
            <button onClick={() => { setCurriculumToDelete(r.id); setDeleteModalOpen(true); }} style={{padding:"0.35rem",border:"none",background:"transparent",cursor:"pointer",color:"var(--error, #dc2626)",borderRadius:"6px",display:"inline-flex",alignItems:"center",justifyContent:"center",transition:"opacity 0.15s"}} title="Delete"
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
              <svg style={{width:"16px",height:"16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
          </RoleGuard>
        </div>
      )
    }
  ];

  const filteredCurriculums = [...curriculumsData.data]
    .filter(c => statusFilter === "all" || c.status === statusFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case "name_asc":  return (a.title || "").localeCompare(b.title || "");
        case "name_desc": return (b.title || "").localeCompare(a.title || "");
        default: return 0;
      }
    });

  const versionColumns: Column<CurriculumVersion>[] = [
    { key:"version_number", header:"Version", render:(r) => <span style={{fontFamily:"monospace",fontWeight:700,color:"#6d28d9"}}>{r.version_number}</span> },
    { key:"change_log",     header:"Change Log" },
    { key:"effective_date", header:"Effective Date" },
    { key:"created_by_name",header:"Created By", render:(r) => r.created_by_name || "System Admin" },
    { key:"status",         header:"Status", render:(r) => <CurriculumStatusBadge status={r.status} />, align:"center" },
    {
      key:"actions", header:"Actions", align:"center",
      render:(r) => (
        <RoleGuard allowedRoles={["admin","faculty"]}>
          <button onClick={() => { setEditingVersion(r); setVersionStatusFormData(r.status); setEditVersionStatusModal(true); }}
            style={{ padding:"0.35rem", border:"none", background:"transparent", borderRadius:"6px", cursor:"pointer", color:"#059669", display:"inline-flex", alignItems:"center", justifyContent:"center", transition:"opacity 0.15s" }}
            title="Edit Status"
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            <svg style={{width:"16px",height:"16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          </button>
        </RoleGuard>
      )
    }
  ];

  const totalAssignedCredits = Object.values(laneCourses).flat().reduce((acc, c) => acc + (c.credit_hours || 0), 0);
  const totalLectureHours    = Object.values(laneCourses).flat().reduce((acc, c) => acc + (c.lecture_hours || 0), 0);
  const totalLabHours        = Object.values(laneCourses).flat().reduce((acc, c) => acc + (c.lab_hours    || 0), 0);

  const tabBtnBase: React.CSSProperties = { padding:"0.5rem 1rem", fontSize:"0.85rem", borderRadius:"6px", border:"none", cursor:"pointer", fontWeight:600 };
  const cancelBtnStyle: React.CSSProperties = { padding:"0.5rem 1rem", fontSize:"0.85rem", fontWeight:600, borderRadius:"8px", border:"1px solid var(--input-border)", background:"var(--input-bg)", color:"var(--text-dark)", cursor:"pointer" };

  return (
    <div style={{padding:"1.5rem 2rem",display:"flex",flexDirection:"column",gap:"1.25rem"}}>
      {/* Header */}
      <div className="panel-card-header">
        <div>
          <h2 className="topbar-title" style={{fontSize:"1.4rem"}}>Curriculum Management</h2>
          <p className="topbar-date">Design academic programs, degree pathways, and {isSchool ? "class schedules" : isCollege ? "group schedules" : "semester schedules"}</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{display:"flex",alignItems:"center",gap:"2px",padding:"0.25rem",background:"var(--input-bg)",borderRadius:"8px",width:"fit-content"}}>
        {(["list","builder","versions"] as MainTab[]).map(tab => {
          const labels: Record<MainTab,string> = { list:"Curriculum List", builder:"Visual Builder", versions:"Version History" };
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{...tabBtnBase, background:activeTab===tab?"var(--card-bg)":"transparent", color:activeTab===tab?"var(--text-dark)":"var(--text-dark-sub)", boxShadow:activeTab===tab?"0 1px 3px rgba(0,0,0,0.1)":"none"}}>
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* TAB 1: LIST */}
      {activeTab === "list" && (
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          <div style={{display:"flex",justifyContent:"flex-end",alignItems:"center",gap:"1.5rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
              <span style={{fontSize:"0.85rem",fontWeight:600,color:"var(--text-dark-sub)"}}>Sort By:</span>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="field-input" style={{width:"auto",minWidth:"160px"}}>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </select>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
              <span style={{fontSize:"0.85rem",fontWeight:600,color:"var(--text-dark-sub)"}}>Filter Status:</span>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="field-input" style={{width:"auto",minWidth:"120px"}}>
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <DataTable
            columns={curriculumColumns} data={filteredCurriculums} loading={curriculumsData.loading}
            searchQuery={curriculumsData.searchQuery} onSearchChange={curriculumsData.setSearchQuery}
            searchPlaceholder="Search curriculum code, title..."
            page={curriculumsData.page} totalPages={curriculumsData.totalPages}
            totalCount={curriculumsData.totalCount} onPageChange={curriculumsData.setPage}
            itemsPerPage={curriculumsData.itemsPerPage} onItemsPerPageChange={curriculumsData.setItemsPerPage}
            actionButton={
              <RoleGuard allowedRoles={["admin","faculty"]}>
                <button onClick={() => { setEditCurriculum(null); setCurriculumFormData({ status:"draft", total_semesters: isCollege || isSchool ? 2 : 8, program_id:programs[0]?.id }); setCurriculumModalOpen(true); }} className="submit-btn" style={{width:"auto",padding:"0.5rem 1rem",fontSize:"0.85rem",margin:0}}>
                  + Create Curriculum
                </button>
              </RoleGuard>
            }
          />
        </div>
      )}

      {/* TAB 2: VISUAL BUILDER */}
      {activeTab === "builder" && (
        <div style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
          {/* Controls */}
          <div className="panel-card" style={{padding:"1rem 1.25rem",display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:"0.75rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
              <label className="field-label" style={{marginBottom:0}}>Select Curriculum:</label>
              <select value={selectedCurriculumId || ""} onChange={e => setSelectedCurriculumId(Number(e.target.value))} className="field-input" style={{width:"auto",minWidth:"260px"}}>
                {curriculumsData.data.map(c => (
                  <option key={c.id} value={c.id}>{c.code || `CURR-${c.id}`} — {c.title || "Untitled"}</option>
                ))}
              </select>
            </div>
            <RoleGuard allowedRoles={["admin","faculty"]}>
              <button onClick={() => { setAssignLaneKey(builderLanes[0]?.key || "1"); setAssignModalOpen(true); }} className="submit-btn" style={{width:"auto",padding:"0.5rem 1rem",fontSize:"0.85rem",margin:0}}>
                + Assign {courseLabel}
              </button>
            </RoleGuard>
          </div>

          {/* Lane grid — adapts to institution type */}
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:"1rem"}}>
            {builderLanes.map(lane => {
              const courses = laneCourses[lane.key] || [];
              const laneTotal = isUnivOrInst
                ? courses.reduce((s, c) => s + (c.credit_hours || 0), 0)
                : courses.reduce((s, c) => s + (c.marks || c.credit_hours || 0), 0);

              return (
                <div key={lane.key} className="panel-card" style={{padding:"1rem",display:"flex",flexDirection:"column"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingBottom:"0.75rem",borderBottom:"1px solid var(--divider-color)",marginBottom:"0.75rem"}}>
                    <span style={{fontWeight:700,fontSize:"0.875rem",color:"var(--text-dark)"}}>{lane.label}</span>
                    <span style={{fontSize:"0.7rem",fontWeight:700,padding:"0.15rem 0.5rem",borderRadius:"6px",background:"rgba(29,111,191,0.1)",color:"var(--accent)"}}>
                      {laneTotal} {isUnivOrInst ? "Cr" : "Marks"}
                    </span>
                  </div>

                  {courses.length === 0 ? (
                    <div style={{padding:"1.5rem 0",textAlign:"center",border:"2px dashed var(--card-border)",borderRadius:"8px"}}>
                      <p style={{fontSize:"0.75rem",color:"var(--text-dark-sub)"}}>No {courseLabel.toLowerCase()}s assigned</p>
                    </div>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                      {courses.map(course => (
                        <div key={course.id} style={{padding:"0.6rem 0.75rem",borderRadius:"8px",background:"var(--input-bg)",border:"1px solid var(--card-border)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <div style={{minWidth:0,paddingRight:"0.5rem"}}>
                            <div style={{display:"flex",alignItems:"center",gap:"0.375rem"}}>
                              <span style={{fontFamily:"monospace",fontWeight:700,fontSize:"0.72rem",color:"var(--accent)"}}>{course.code || "—"}</span>
                              <span style={{fontSize:"0.62rem",color:"var(--text-dark-sub)"}}>
                                ({isUnivOrInst ? `${course.credit_hours ?? 0} Cr` : `${course.marks ?? course.credit_hours ?? 0} Marks`})
                              </span>
                            </div>
                            <p style={{fontSize:"0.75rem",color:"var(--text-dark)",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{course.title || course.name}</p>
                          </div>
                          <RoleGuard allowedRoles={["admin","faculty"]}>
                            <button onClick={() => handleRemoveCourse(lane.key, course.id)} style={{padding:"0.2rem",background:"transparent",border:"none",color:"var(--text-dark-sub)",cursor:"pointer"}}>
                              <svg style={{width:"14px",height:"14px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          </RoleGuard>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{marginTop:"1rem",paddingTop:"0.75rem",borderTop:"1px solid var(--divider-color)",display:"flex",justifyContent:"flex-end"}}>
                    <button onClick={() => { setAssignLaneKey(lane.key); setAssignModalOpen(true); }} style={{fontSize:"0.75rem",fontWeight:700,color:"var(--accent)",background:"transparent",border:"none",cursor:"pointer"}}>
                      + Add {courseLabel}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Credit summary — university/institute only */}
          {isUnivOrInst && (
            <div style={{padding:"1.25rem 1.5rem",borderRadius:"var(--radius-card)",background:"var(--sidebar-bg)",color:"var(--text-white)",display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:"1rem"}}>
              <div>
                <h3 style={{fontWeight:700,fontSize:"1rem"}}>Curriculum Credit Hours Summary</h3>
                <p style={{fontSize:"0.72rem",color:"var(--text-muted)",marginTop:"0.2rem"}}>Aggregated for selected curriculum</p>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"1.5rem"}}>
                <div><span style={{fontSize:"0.7rem",color:"var(--text-muted)",display:"block",textTransform:"uppercase"}}>Total Credits</span><span style={{fontSize:"1.3rem",fontWeight:800,color:"var(--accent-bright)"}}>{totalAssignedCredits}</span></div>
                <div style={{height:"32px",width:"1px",background:"rgba(255,255,255,0.15)"}}/>
                <div><span style={{fontSize:"0.7rem",color:"var(--text-muted)",display:"block",textTransform:"uppercase"}}>Lecture Hours</span><span style={{fontSize:"1.3rem",fontWeight:800,color:"#34d399"}}>{totalLectureHours}</span></div>
                <div style={{height:"32px",width:"1px",background:"rgba(255,255,255,0.15)"}}/>
                <div><span style={{fontSize:"0.7rem",color:"var(--text-muted)",display:"block",textTransform:"uppercase"}}>Lab Hours</span><span style={{fontSize:"1.3rem",fontWeight:800,color:"#fbbf24"}}>{totalLabHours}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: VERSION HISTORY */}
      {activeTab === "versions" && (
        <DataTable
          columns={versionColumns} data={versionsData.data} loading={versionsData.loading}
          searchQuery={versionsData.searchQuery} onSearchChange={versionsData.setSearchQuery}
          searchPlaceholder="Search versions..."
          page={versionsData.page} totalPages={versionsData.totalPages}
          totalCount={versionsData.totalCount} onPageChange={versionsData.setPage}
          itemsPerPage={versionsData.itemsPerPage} onItemsPerPageChange={versionsData.setItemsPerPage}
          actionButton={
            <RoleGuard allowedRoles={["admin","faculty"]}>
              <button onClick={() => setVersionModalOpen(true)} className="submit-btn" style={{width:"auto",padding:"0.5rem 1rem",fontSize:"0.85rem",margin:0}}>
                + Create New Version
              </button>
            </RoleGuard>
          }
        />
      )}

      {/* MODAL: Assign course to lane */}
      <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title={`Assign ${courseLabel}`} maxWidth="md"
        footer={<><button onClick={() => setAssignModalOpen(false)} style={cancelBtnStyle}>Cancel</button><button onClick={handleAssignCourse} className="submit-btn" style={{width:"auto",margin:0,padding:"0.5rem 1rem",fontSize:"0.85rem"}}>Assign</button></>}>
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          <div>
            <label className="field-label">Target {semLabel} *</label>
            <select value={assignLaneKey} onChange={e => setAssignLaneKey(e.target.value)} className="field-input">
              {builderLanes.map(l => <option key={l.key} value={l.key}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Select {courseLabel} *</label>
            <select value={assignCourseId} onChange={e => setAssignCourseId(e.target.value ? Number(e.target.value) : "")} className="field-input">
              <option value="">Select…</option>
              {allCourses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.code || "—"} — {c.title || c.name} {isUnivOrInst ? `(${c.credit_hours ?? 0} Cr)` : `(${c.marks ?? c.credit_hours ?? 0} Marks)`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* MODAL: Create / Edit Curriculum */}
      <Modal isOpen={curriculumModalOpen} onClose={() => setCurriculumModalOpen(false)} title={editCurriculum ? "Edit Curriculum" : "Create Curriculum"} maxWidth="lg"
        footer={<><button onClick={() => setCurriculumModalOpen(false)} style={cancelBtnStyle}>Cancel</button><button onClick={handleSaveCurriculum} disabled={saving} className="submit-btn" style={{width:"auto",margin:0,padding:"0.5rem 1rem",fontSize:"0.85rem"}}>{saving ? "Saving…" : "Save"}</button></>}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"1rem"}}>
          <div>
            <label className="field-label">Code *</label>
            <input className="field-input" value={curriculumFormData.code || ""} onChange={e => setCurriculumFormData(p => ({...p, code:e.target.value}))} placeholder="e.g. CURR-BSCS-2026" />
          </div>
          <div>
            <label className="field-label">Title *</label>
            <input className="field-input" value={curriculumFormData.title || ""} onChange={e => setCurriculumFormData(p => ({...p, title:e.target.value}))} placeholder="e.g. BSCS Curriculum 2026" />
          </div>
          <div>
              <label className="field-label">Department</label>
              <select className="field-input" value={curriculumFormData.department_id || ""} onChange={e => setCurriculumFormData(p => ({...p, department_id:Number(e.target.value)}))}>
                <option value="">Select Department…</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          
          <div>
            <label className="field-label">{isSchool ? "Grade/Level *" : "Program *"}</label>
            <select className="field-input" value={curriculumFormData.program_id || ""} onChange={e => { const prog = programs.find(p => p.id === Number(e.target.value)); setCurriculumFormData(p => ({...p, program_id:Number(e.target.value), program_name: prog?.name || prog?.title || ""})); }}>
              <option value="">Select…</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name || p.title}</option>)}
            </select>
          </div>
          {isUnivOrInst && (
            <>
              <div>
                <label className="field-label">Major</label>
                <select className="field-input" value={curriculumFormData.major_id || ""} onChange={e => setCurriculumFormData(p => ({...p, major_id:Number(e.target.value)}))}>
                  <option value="">None</option>
                  {majors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Minor</label>
                <select className="field-input" value={curriculumFormData.minor_id || ""} onChange={e => setCurriculumFormData(p => ({...p, minor_id:Number(e.target.value)}))}>
                  <option value="">None</option>
                  {minors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="field-label">Academic Year</label>
            <input className="field-input" value={curriculumFormData.academic_year || "2026-2027"} onChange={e => setCurriculumFormData(p => ({...p, academic_year:e.target.value}))} />
          </div>
          <div>
            <label className="field-label">{isSchool ? "Term" : isCollege ? "Year" : "Assigned Semester"}</label>
          {isCollege ? (
            <select className="field-input" value={curriculumFormData.semester || ""} onChange={e => setCurriculumFormData(p => ({...p, semester:e.target.value}))}>
              <option value="">Select Year...</option>
              <option value="First Year">First Year</option>
              <option value="Second Year">Second Year</option>
            </select>
          ) : (
            <input className="field-input" value={curriculumFormData.semester || ""} onChange={e => setCurriculumFormData(p => ({...p, semester:e.target.value}))} placeholder={isSchool ? "e.g. Term 1" : "e.g. Fall 2026"} />
          )}
          </div>
          <div>
            <label className="field-label">{isSchool ? "Total Terms" : isCollege ? "Total Years" : "Total Semesters"}</label>
          <input type="number" className="field-input"
            value={isCollege ? 2 : curriculumFormData.total_semesters || (isSchool ? 2 : 8)}
            onChange={e => !isCollege && setCurriculumFormData(p => ({...p, total_semesters:Number(e.target.value)}))}
            readOnly={isCollege}
            style={isCollege ? {background:"var(--input-disabled-bg)",cursor:"not-allowed"} : {}}
          />
          </div>
          {!isCollege && (
            <div>
              <label className="field-label">{isSchool ? "Total Marks" : "Total Credits"}</label>
              <input type="number" className="field-input" value={curriculumFormData.total_credits || 0} onChange={e => setCurriculumFormData(p => ({...p, total_credits:Number(e.target.value)}))} min={0} />
            </div>
          )}
          <div>
            <label className="field-label">Version</label>
            <input className="field-input" value={curriculumFormData.current_version || "1.0"} onChange={e => setCurriculumFormData(p => ({...p, current_version:e.target.value}))} placeholder="e.g. 1.0" />
          </div>
          <div>
            <label className="field-label">Status</label>
            <select className="field-input" value={curriculumFormData.status || "draft"} onChange={e => setCurriculumFormData(p => ({...p, status:e.target.value as any}))}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* MODAL: Create Version */}
      <Modal isOpen={versionModalOpen} onClose={() => setVersionModalOpen(false)} title="Create New Version" maxWidth="md"
        footer={<><button onClick={() => setVersionModalOpen(false)} style={cancelBtnStyle}>Cancel</button><button onClick={handleSaveVersion} disabled={saving} className="submit-btn" style={{width:"auto",margin:0,padding:"0.5rem 1rem",fontSize:"0.85rem"}}>Publish</button></>}>
        <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
          <div><label className="field-label">Version Number *</label><input className="field-input" value={versionFormData.version_number || ""} onChange={e => setVersionFormData(p => ({...p, version_number:e.target.value}))} placeholder="e.g. 2.0" /></div>
          <div><label className="field-label">Change Log *</label><textarea className="field-input" rows={3} style={{resize:"none"}} value={versionFormData.change_log || ""} onChange={e => setVersionFormData(p => ({...p, change_log:e.target.value}))} placeholder="Describe changes…" /></div>
          <div><label className="field-label">Effective Date</label><input type="date" className="field-input" value={versionFormData.effective_date || ""} onChange={e => setVersionFormData(p => ({...p, effective_date:e.target.value}))} /></div>
        </div>
      </Modal>

      {/* MODAL: View Curriculum */}
      <Modal isOpen={viewCurriculumOpen} onClose={() => setViewCurriculumOpen(false)} title="Curriculum Details" maxWidth="lg" footer={<button onClick={() => setViewCurriculumOpen(false)} style={cancelBtnStyle}>Close</button>}>
        {viewCurriculumData && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:"1rem",background:"var(--input-bg)",padding:"1rem",borderRadius:"8px"}}>
            <div><span style={{fontSize:"0.75rem",color:"var(--text-dark-sub)",fontWeight:700}}>Title:</span><p style={{fontWeight:600,color:"var(--text-dark)",margin:0}}>{viewCurriculumData.title || "—"}</p></div>
            <div><span style={{fontSize:"0.75rem",color:"var(--text-dark-sub)",fontWeight:700}}>Code:</span><p style={{fontWeight:600,color:"var(--accent)",margin:0}}>{viewCurriculumData.code || `CURR-${viewCurriculumData.id}`}</p></div>
            <div><span style={{fontSize:"0.75rem",color:"var(--text-dark-sub)",fontWeight:700}}>Department:</span><p style={{color:"var(--text-dark)",margin:0}}>{viewCurriculumData.department_name || "—"}</p></div>
            <div><span style={{fontSize:"0.75rem",color:"var(--text-dark-sub)",fontWeight:700}}>Program:</span><p style={{color:"var(--text-dark)",margin:0}}>{viewCurriculumData.program_name || "—"}</p></div>
            <div><span style={{fontSize:"0.75rem",color:"var(--text-dark-sub)",fontWeight:700}}>Semester:</span><p style={{color:"var(--text-dark)",margin:0}}>{viewCurriculumData.semester || "N/A"}</p></div>
            <div><span style={{fontSize:"0.75rem",color:"var(--text-dark-sub)",fontWeight:700}}>{currCreditsHeader}:</span><p style={{color:"var(--text-dark)",margin:0}}>{viewCurriculumData.total_credits ?? "—"}</p></div>
            <div><span style={{fontSize:"0.75rem",color:"var(--text-dark-sub)",fontWeight:700}}>Version:</span><p style={{color:"var(--text-dark)",margin:0}}>v{viewCurriculumData.current_version || "1.0"}</p></div>
            <div><span style={{fontSize:"0.75rem",color:"var(--text-dark-sub)",fontWeight:700}}>Status:</span><p style={{margin:0}}><CurriculumStatusBadge status={viewCurriculumData.status} /></p></div>
          </div>
        )}
      </Modal>

      {/* MODAL: Edit Version Status */}
      <Modal isOpen={editVersionStatusModal} onClose={() => setEditVersionStatusModal(false)} title="Edit Version Status" maxWidth="sm"
        footer={<><button onClick={() => setEditVersionStatusModal(false)} style={cancelBtnStyle}>Cancel</button><button onClick={handleUpdateVersionStatus} disabled={saving} className="submit-btn" style={{width:"auto",margin:0,padding:"0.5rem 1rem",fontSize:"0.85rem"}}>Update</button></>}>
        <div><label className="field-label">Status *</label>
          <select value={versionStatusFormData} onChange={e => setVersionStatusFormData(e.target.value)} className="field-input">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </Modal>

      <ConfirmDialog isOpen={deleteModalOpen} title="Delete Curriculum" message="Are you sure you want to permanently delete this curriculum?" onConfirm={handleDeleteCurriculum} onClose={() => { setDeleteModalOpen(false); setCurriculumToDelete(null); }} confirmText={saving ? "Deleting…" : "Delete"} type="danger" loading={saving} />
    </div>
  );
};

export default CurriculumManagementPage;

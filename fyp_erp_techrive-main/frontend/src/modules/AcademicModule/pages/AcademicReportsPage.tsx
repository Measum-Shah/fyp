import React, { useState, useEffect, useCallback } from "react";
import { DataTable, type Column } from "../components/common/DataTable";
import { academicService } from "../services/academicService";
import { useRoleAccess } from "../hooks/useRoleAccess";
import { toast } from "./AcademicLayout";

type ReportTab = "courses" | "curriculums" | "departments" | "prerequisites" | "corequisites" | "lms" | "assignments";

// Safe date formatter — never shows "Invalid Date"
function fmtDate(val: any): string {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

const AcademicReportsPage: React.FC = () => {
  const { institutionType } = useRoleAccess();
  const isUnivOrInst = institutionType === "university" || institutionType === "institute";
  const isSchool     = institutionType === "school";
  const isCollege    = institutionType === "college";

  const [reportTab, setReportTab] = useState<ReportTab>("courses");
  const [data,      setData]      = useState<any[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [search,    setSearch]    = useState("");
  // Courses cache for prerequisite/LMS name lookup
  const [courseMap, setCourseMap] = useState<Record<number, string>>({});

  // Load course map once for name lookups
  useEffect(() => {
    academicService.getCourses(undefined, institutionType)
      .then(courses => {
        const m: Record<number, string> = {};
        courses.forEach(c => { if (c.id) m[c.id] = c.code || c.subject_code || `Course-${c.id}`; });
        setCourseMap(m);
      })
      .catch(() => {});
  }, [institutionType]);

  const loadReportData = useCallback(async (tab: ReportTab) => {
    setLoading(true);
    setData([]);
    try {
      if      (tab === "courses")       setData(await academicService.getCourses(undefined, institutionType));
      else if (tab === "curriculums")   setData(await academicService.getCurriculums(institutionType));
      else if (tab === "departments")   setData(await academicService.getDepartments(institutionType));
      else if (tab === "prerequisites") setData(await academicService.getAllPrerequisites(institutionType));
      else if (tab === "corequisites")  setData(await academicService.getAllCorequisites(institutionType));
      else if (tab === "lms")           setData(await academicService.getMaterials(institutionType));
      else if (tab === "assignments")   setData(await academicService.getAssignments(institutionType));
    } catch (err: any) {
      toast.error("Report Error", err.message || "Failed to fetch report data.");
    }
    setLoading(false);
  }, [institutionType]);

  useEffect(() => { loadReportData(reportTab); }, [reportTab, loadReportData]);

  // ── Exports ─────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(obj =>
      Object.values(obj).map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURI([headers, ...rows].join("\n"));
    a.download = `academic_${reportTab}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast.success("CSV Downloaded");
  };
  const exportJSON = () => {
    if (!data.length) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `academic_${reportTab}_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("JSON Downloaded");
  };

  // ── Column definitions ───────────────────────────────────────────────────────
  const getColumns = (): Column<any>[] => {

    if (reportTab === "courses") {
      const base: Column<any>[] = [
        { key:"code",         header:"Code",    render:(r) => <span style={{fontFamily:"monospace",fontWeight:700,color:"var(--accent)"}}>{r.code || r.subject_code || "—"}</span> },
        { key:"title",        header:"Title",   render:(r) => r.title || r.name || "—" },
        { key:"program_name", header:"Program", render:(r) => r.program_name || "—" },
        { key:"curriculum_version", header:"Version",  align:"center", render:(r) => r.curriculum_version || "—" },
        { key:"category",     header:"Category",align:"center", render:(r) => r.category || "—" },
        { key:"status",       header:"Status",  align:"center", render:(r) => r.status   || "—" },
      ];
      if (isUnivOrInst) {
        base.splice(4, 0,
          { key:"semester_suggested", header:"Sem", align:"center", render:(r) => r.semester_suggested ? `Sem ${r.semester_suggested}` : "—" },
          { key:"credit_hours",       header:"Credits", align:"center", render:(r) => r.credit_hours ?? "—" }
        );
      } else if (isCollege) {
        base.splice(3, 0,
          { key:"college_year",  header:"Year",  render:(r) => r.college_year  || "—" },
          { key:"college_group", header:"Group", render:(r) => r.college_group || "—" }
        );
        base.push({ key:"marks", header:"Marks", align:"center", render:(r) => r.marks ?? "—" });
      } else if (isSchool) {
        base.splice(3, 0, { key:"class_id", header:"Class", align:"center", render:(r) => r.class_id ? `Class ${r.class_id}` : "—" });
        base.push({ key:"marks", header:"Marks", align:"center", render:(r) => r.marks ?? "—" });
      }
      return base;
    }

    if (reportTab === "curriculums") {
      const cols: Column<any>[] = [
        { key:"code",            header:"Code",        render:(r) => <span style={{fontFamily:"monospace",fontWeight:700,color:"var(--accent)"}}>{r.code || `CURR-${r.id}`}</span> },
        { key:"title",           header:"Title",       render:(r) => r.title || "—" },
        { key:"department_name", header:"Department",  render:(r) => r.department_name || "—" },
        { key:"program_name",    header:"Program",     render:(r) => r.program_name    || "—" },
        { key:"academic_year",   header:"Academic Year", align:"center", render:(r) => r.academic_year || "—" },
        { key:"current_version", header:"Version",    align:"center", render:(r) => `v${r.current_version || "1.0"}` },
        { key:"status",          header:"Status",     align:"center", render:(r) => r.status || "—" },
      ];
      if (isCollege) {
        cols.splice(5, 0, { key:"semester", header:"Year", align:"center", render:(r) => r.semester || "—" });
        cols.splice(6, 0, { key:"total_semesters", header:"Total Years", align:"center", render:(r) => r.total_semesters ?? "—" });
      } else if (isUnivOrInst) {
        cols.splice(5, 0,
          { key:"semester",        header:"Semester",         align:"center", render:(r) => r.semester || "—" },
          { key:"total_semesters", header:"Total Semesters",  align:"center", render:(r) => r.total_semesters ?? "—" },
          { key:"total_credits",   header:"Total Credits",    align:"center", render:(r) => r.total_credits   ?? "—" }
        );
      } else if (isSchool) {
        cols.splice(5, 0,
          { key:"semester",        header:"Term",       align:"center", render:(r) => r.semester || "—" },
          { key:"total_semesters", header:"Total Terms",align:"center", render:(r) => r.total_semesters ?? "—" }
        );
      }
      return cols;
    }

    if (reportTab === "departments") {
      // Only columns that actually exist in departments table: id, name, description, institution_type
      return [
        { key:"id",               header:"ID",          align:"center", render:(r) => <span style={{fontFamily:"monospace",fontWeight:700,color:"var(--accent)"}}>{r.id}</span> },
        { key:"name",             header:"Department Name", render:(r) => r.name || "—" },
        { key:"description",      header:"Description", render:(r) => r.description      || "—" },
        { key:"institution_type", header:"Institution", render:(r) => r.institution_type  || "—" },
      ];
    }

    if (reportTab === "prerequisites") {
      return [
        { key:"course_code",  header:"Course",       render:(r) => (
          <span style={{fontFamily:"monospace",fontWeight:700,color:"var(--accent)"}}>{r.course_code || (r.course_id ? `ID-${r.course_id}` : "—")}</span>
        )},
        { key:"course_title", header:"Course Title", render:(r) => r.course_title || "—" },
        { key:"precourse_code",  header:"Prerequisite", render:(r) => (
          <span style={{fontFamily:"monospace",fontWeight:700,color:"#4f46e5"}}>{r.precourse_code || r.prerequisite_code || (r.precourse_id ? `ID-${r.precourse_id}` : "—")}</span>
        )},
        { key:"precourse_title", header:"Prerequisite Title", render:(r) => r.precourse_title || r.prerequisite_title || "—" },
        { key:"co_requisite_type", header:"Type", align:"center", render:(r) => r.co_requisite_type || "prerequisite" },
        { key:"created_at",  header:"Added On", render:(r) => fmtDate(r.created_at) },
      ];
    }

    if (reportTab === "corequisites") {
      return [
        { key:"course_code",  header:"Course",      render:(r) => (
          <span style={{fontFamily:"monospace",fontWeight:700,color:"var(--accent)"}}>{r.course_code || (r.course_id ? `ID-${r.course_id}` : "—")}</span>
        )},
        { key:"course_title", header:"Course Title",render:(r) => r.course_title || "—" },
        { key:"precourse_code",  header:"Corequisite", render:(r) => (
          <span style={{fontFamily:"monospace",fontWeight:700,color:"#4f46e5"}}>{r.precourse_code || (r.precourse_id ? `ID-${r.precourse_id}` : "—")}</span>
        )},
        { key:"precourse_title", header:"Corequisite Title", render:(r) => r.precourse_title || "—" },
        { key:"created_at",  header:"Added On",    render:(r) => fmtDate(r.created_at) },
      ];
    }

    if (reportTab === "lms") {
      return [
        { key:"title",         header:"Material Title", render:(r) => r.title || "—" },
        { key:"material_type", header:"Type",     align:"center", render:(r) => r.material_type || r.type || "—" },
        { key:"course_id",     header:"Course",   render:(r) => {
          const code = courseMap[r.course_id];
          return code || (r.course_id ? `ID-${r.course_id}` : "—");
        }},
        { key:"uploaded_by_name", header:"Uploader", render:(r) => r.uploaded_by_name || r.uploader_name || "—" },
        { key:"created_at",    header:"Uploaded", render:(r) => fmtDate(r.created_at) },
      ];
    }

    // assignments
    return [
      { key:"title",     header:"Assignment Title", render:(r) => r.title || "—" },
      { key:"course_id", header:"Course", render:(r) => {
        const code = courseMap[r.course_id];
        return code || (r.course_id ? `ID-${r.course_id}` : "—");
      }},
      { key:"deadline",  header:"Due Date",   render:(r) => fmtDate(r.deadline || r.due_date) },
      { key:"max_score", header:"Max Points", align:"center", render:(r) => r.max_score ?? "—" },
      { key:"status",    header:"Status",     align:"center", render:(r) => r.status    || "—" },
    ];
  };

  const filteredData = data.filter(item =>
    Object.values(item).some(v => String(v ?? "").toLowerCase().includes(search.toLowerCase()))
  );

  const tabBtnStyle = (active: boolean): React.CSSProperties => ({
    padding:"0.5rem 1rem", fontSize:"0.85rem", fontWeight: active ? 700 : 600,
    borderRadius:"6px", border:"none", cursor:"pointer",
    background: active ? "var(--card-bg)" : "transparent",
    color: active ? "var(--text-dark)" : "var(--text-dark-sub)",
    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition:"all 0.2s",
  });

  return (
    <div style={{ padding:"1.5rem 2rem", display:"flex", flexDirection:"column", gap:"1.25rem" }}>
      {/* Header */}
      <div className="panel-card-header" style={{ alignItems:"center", display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:"1rem" }}>
        <div>
          <h2 className="topbar-title" style={{ fontSize:"1.4rem" }}>Academic Reports & Analytics</h2>
          <p className="topbar-date">Generate, view, print, and export academic data reports in CSV or JSON formats</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
          <button onClick={exportCSV} className="submit-btn" style={{ width:"auto",margin:0,padding:"0.5rem 1rem",fontSize:"0.78rem",background:"var(--success,#059669)",display:"flex",alignItems:"center",gap:"0.35rem" }}>
            <svg style={{width:"16px",height:"16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Export CSV
          </button>
          <button onClick={exportJSON} className="submit-btn" style={{ width:"auto",margin:0,padding:"0.5rem 1rem",fontSize:"0.78rem",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",display:"flex",alignItems:"center",gap:"0.35rem" }}>
            <svg style={{width:"16px",height:"16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
            Export JSON
          </button>
          <button onClick={() => window.print()} style={{ padding:"0.5rem 1rem",fontSize:"0.78rem",fontWeight:600,borderRadius:"8px",border:"1px solid var(--input-border)",background:"var(--input-bg)",color:"var(--text-dark)",cursor:"pointer",display:"flex",alignItems:"center",gap:"0.35rem" }}>
            <svg style={{width:"16px",height:"16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
            Print
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex",flexWrap:"wrap",gap:"2px",background:"var(--input-bg)",padding:"4px",borderRadius:"8px",width:"fit-content" }}>
        {([
          { key:"courses",       label:"Course Catalog" },
          { key:"curriculums",   label:"Curriculums" },
          { key:"departments",   label:"Departments" },
          { key:"prerequisites", label:"Prerequisites" },
          { key:"corequisites",  label:"Corequisites" },
          { key:"lms",           label:"LMS Materials" },
          { key:"assignments",   label:"Assignments" },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setReportTab(t.key)} style={tabBtnStyle(reportTab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="panel-card">
        <DataTable
          columns={getColumns()} data={filteredData} loading={loading}
          searchQuery={search} onSearchChange={setSearch}
          searchPlaceholder={`Search ${reportTab} report...`}
          page={1} totalPages={1} totalCount={filteredData.length}
          onPageChange={() => {}} itemsPerPage={5} onItemsPerPageChange={() => {}}
          emptyMessage={`No ${reportTab} data found.`}
        />
      </div>
    </div>
  );
};

export default AcademicReportsPage;
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
import type { Department, Program, Major, Minor } from "../types";

type Tab = "departments" | "programs" | "majors" | "minors";

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700,
    background: status === "active" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
    color: status === "active" ? "var(--success, #059669)" : "var(--error, #dc2626)",
  }}>
    {status === "active" ? "● Active" : "● Inactive"}
  </span>
);

const StructureManagementPage: React.FC = () => {
  const { institutionType, branchId } = useRoleAccess();
  const [tab, setTab] = useState<Tab>("departments");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [viewItem, setViewItem] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // ── University → Campus filter ─────────────────────────────────────────────
  const [universities, setUniversities] = useState<{ id: number; name: string }[]>([]);
  const [campuses, setCampuses] = useState<{ id: number; name: string; branch_code: string }[]>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<number | null>(null);
  const [selectedCampusId, setSelectedCampusId] = useState<number | null>(null);

  // Load universities on mount
  useEffect(() => {
    academicService.getUniversities().then(setUniversities).catch(() => {});
  }, []);

  // ── Modal Form specific filter ─────────────────────────────────────────────
  const [modalUniversities, setModalUniversities] = useState<{ id: number; name: string }[]>([]);
  const [modalCampuses, setModalCampuses] = useState<{ id: number; name: string; branch_code: string }[]>([]);

  useEffect(() => {
    academicService.getUniversities().then(setModalUniversities).catch(() => {});
  }, []);

  useEffect(() => {
    if (formData.company_id) {
      academicService.getCampusesByUniversity(formData.company_id).then(setModalCampuses).catch(() => {});
    } else {
      setModalCampuses([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.company_id]);

  // Load campuses when university selected
  useEffect(() => {
    if (selectedUniversityId) {
      academicService.getCampusesByUniversity(selectedUniversityId).then(setCampuses).catch(() => {});
    } else {
      setCampuses([]);
    }
    setSelectedCampusId(null);
  }, [selectedUniversityId]);

  // Use selectedCampusId for dept filtering, fallback to global branchId
  const activeBranchId = selectedCampusId ?? branchId;

  const deptFetcher  = useCallback(() => academicService.getDepartments(institutionType, activeBranchId), [institutionType, activeBranchId]);
  const progFetcher  = useCallback(() => academicService.getPrograms(institutionType),  [institutionType]);
  const majorFetcher = useCallback(() => academicService.getMajors(institutionType),    [institutionType]);
  const minorFetcher = useCallback(() => academicService.getMinors(institutionType),    [institutionType]);

  const deptData  = useAcademicData<Department>(deptFetcher,  ["code", "name"]);
  const progData  = useAcademicData<Program>(progFetcher,     ["code", "title"]);
  const majorData = useAcademicData<Major>(majorFetcher,      ["code", "name"]);
  const minorData = useAcademicData<Minor>(minorFetcher,      ["code", "name"]);

  const current = tab === "departments" ? deptData : tab === "programs" ? progData : tab === "majors" ? majorData : minorData;

  const openCreate = () => {
    setEditItem(null);
    setFormData({ branch_id: selectedCampusId ?? undefined });
    setModalOpen(true);
  };
  const openEdit   = (item: any) => { setEditItem(item); setFormData({ ...item }); setModalOpen(true); };
  const openView   = (item: any) => { setViewItem(item); setViewModal(true); };
  const openDelete = (id: number) => { setDeleteId(id); setDeleteDialog(true); };
  const handleSave = async () => {
    setSaving(true);
    try {
      if (tab === "departments") {
        if (editItem) {
          await academicService.updateDepartment(editItem.id, formData);
          toast.success("Department Updated", `${formData.name} updated successfully.`);
        } else {
          await academicService.createDepartment(formData as any);
          toast.success("Department Created", `${formData.name} added successfully.`);
        }
        deptData.refresh();
      } else if (tab === "programs") {
        if (editItem) {
          await academicService.updateProgram(editItem.id, formData);
          toast.success("Program Updated");
        } else {
          await academicService.createProgram(formData as any);
          toast.success("Program Created");
        }
        progData.refresh();
      } else if (tab === "majors") {
        if (editItem) {
          await academicService.updateMajor(editItem.id, formData);
          toast.success("Major Updated");
        } else {
          await academicService.createMajor(formData as any);
          toast.success("Major Created");
        }
        majorData.refresh();
      } else if (tab === "minors") {
        if (editItem) {
          await academicService.updateMinor(editItem.id, formData);
          toast.success("Minor Updated");
        } else {
          await academicService.createMinor(formData as any);
          toast.success("Minor Created");
        }
        minorData.refresh();
      }
      setModalOpen(false);
    } catch (err: any) {
      toast.error("Save Failed", err.message);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      if (tab === "departments") {
        await academicService.deleteDepartment(deleteId);
        deptData.removeItem(deleteId);
      } else if (tab === "programs") {
        await academicService.deleteProgram(deleteId);
        progData.removeItem(deleteId);
      } else if (tab === "majors") {
        await academicService.deleteMajor(deleteId);
        majorData.removeItem(deleteId);
      } else if (tab === "minors") {
        await academicService.deleteMinor(deleteId);
        minorData.removeItem(deleteId);
      }
      toast.success("Deleted", "Record removed successfully.");
    } catch (err: any) {
      toast.error("Delete Failed", err.message);
    }
    setDeleteDialog(false);
    setDeleteId(null);
  };

  const updateField = (field: string, value: any) => setFormData((prev) => ({ ...prev, [field]: value }));

  const tabs: { key: Tab; label: string }[] = [
    { key: "departments", label: "Departments" },
    { key: "programs",    label: "Programs" },
    { key: "majors",      label: "Majors" },
    { key: "minors",      label: "Minors" },
  ];

  const iconBtnStyle: React.CSSProperties = {
    padding: "0.35rem", borderRadius: "6px", background: "transparent", border: "none",
    cursor: "pointer", color: "var(--text-dark-sub)", display: "flex", alignItems: "center",
    justifyContent: "center", transition: "all 0.15s",
  };

  const actionCol = (row: any) => (
    <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "center" }}>
      <button onClick={() => openView(row)} style={{ ...iconBtnStyle, color: "var(--accent)" }} title="View"
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
        <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
      </button>
      <RoleGuard allowedRoles={["admin", "faculty"]}>
        <button onClick={() => openEdit(row)} style={{ ...iconBtnStyle, color: "#059669" }} title="Edit"
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
          <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </button>
        <button onClick={() => openDelete(row.id)} style={{ ...iconBtnStyle, color: "var(--error, #dc2626)" }} title="Delete"
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
          <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </RoleGuard>
    </div>
  );

  const deptCols: Column<Department>[] = [
    { key: "index", header: "#",   render: (_, index) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent)" }}>{index}</span> },
    { key: "name", header: "Name" },
    { key: "description",      header: "Description", render: (r) => (r as any).description || "" },
    { key: "institution_type", header: "Institution",  render: (r) => (r as any).institution_type || "" },
    { key: "actions", header: "Actions", render: actionCol, align: "center", width: "120px" },
  ];

  const progCols: Column<Program>[] = [
    { key: "index", header: "#",   render: (_, index) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent)" }}>{index}</span> },
    { key: "code", header: "Code", render: (r) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent)" }}>{(r as any).code || ""}</span> },
    { key: "name", header: "Name", render: (r) => (r as any).name || (r as any).title || "" },
    { key: "years", header: "Duration (Yrs)", render: (r) => (r as any).years || (r as any).duration_years || "", align: "center" },
    { key: "status", header: "Status", render: (r) => {
      const s = (r as any).status;
      const isActive = s === 1 || s === "active";
      return <span style={{ display:"inline-flex", padding:"0.2rem 0.6rem", borderRadius:"6px", fontSize:"0.7rem", fontWeight:700, background: isActive ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: isActive ? "var(--success,#059669)" : "var(--error,#dc2626)" }}>{isActive ? "Active" : "Inactive"}</span>;
    }, align: "center" },
    { key: "actions", header: "Actions", render: actionCol, align: "center", width: "120px" },
  ];

  const majorCols: Column<Major>[] = [
    { key: "index", header: "#",   render: (_, index) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent)" }}>{index}</span> },
    { key: "name", header: "Name" },
    { key: "description",      header: "Description", render: (r) => (r as any).description || "" },
    { key: "department_name",  header: "Department",  render: (r) => r.department_name      || "" },
    { key: "institution_type", header: "Institution", render: (r) => (r as any).institution_type || "" },
    { key: "actions", header: "Actions", render: actionCol, align: "center", width: "120px" },
  ];

  const minorCols: Column<Minor>[] = [
    { key: "index", header: "#",   render: (_, index) => <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--accent)" }}>{index}</span> },
    { key: "name", header: "Name" },
    { key: "description",      header: "Description", render: (r) => (r as any).description || "" },
    { key: "department_name",  header: "Department",  render: (r) => r.department_name      || "" },
    { key: "institution_type", header: "Institution", render: (r) => (r as any).institution_type || "" },
    { key: "actions", header: "Actions", render: actionCol, align: "center", width: "120px" },
  ];

  const columns = tab === "departments" ? deptCols : tab === "programs" ? progCols : tab === "majors" ? majorCols : minorCols;

  const renderForm = () => {
    if (tab === "departments") return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
        <div>
          <label className="field-label">Department Name *</label>
          <input type="text" value={formData.name || ""} onChange={(e) => updateField("name", e.target.value)} required placeholder="e.g. Computer Science" className="field-input" />
        </div>
        <div>
          <label className="field-label">Institution Type *</label>
          <select value={formData.institution_type || institutionType} onChange={(e) => updateField("institution_type", e.target.value)} className="field-input">
            <option value="university">University</option>
            <option value="college">College</option>
            <option value="school">School</option>
            <option value="institute">Institute</option>
          </select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="field-label">Description</label>
          <input type="text" value={formData.description || ""} onChange={(e) => updateField("description", e.target.value)} placeholder="Short description..." className="field-input" />
        </div>
        {/* University selection for department */}
        <div>
          <label className="field-label">University</label>
          <select value={formData.company_id || ""} onChange={(e) => {
            updateField("company_id", Number(e.target.value) || undefined);
            updateField("branch_id", undefined); // Reset campus when university changes
          }} className="field-input">
            <option value="">Select University...</option>
            {modalUniversities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        {/* Campus selection */}
        <div>
          <label className="field-label">Campus (Branch)</label>
          <select value={formData.branch_id || ""} onChange={(e) => updateField("branch_id", Number(e.target.value) || undefined)} className="field-input" disabled={!formData.company_id}>
            <option value="">Select Campus...</option>
            {modalCampuses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.branch_code})</option>)}
          </select>
        </div>
      </div>
    );
    if (tab === "programs") return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
        <div>
          <label className="field-label">University (Optional)</label>
          <select value={formData.company_id || ""} onChange={(e) => updateField("company_id", Number(e.target.value) || undefined)} className="field-input">
            <option value="">Select University...</option>
            {modalUniversities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Campus (Optional)</label>
          <select value={formData.branch_id || ""} onChange={(e) => updateField("branch_id", Number(e.target.value) || undefined)} className="field-input" disabled={!formData.company_id}>
            <option value="">Select Campus...</option>
            {modalCampuses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.branch_code})</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Program Code</label>
          <input type="text" value={formData.code || ""} onChange={(e) => updateField("code", e.target.value)} placeholder="e.g. BSCS" className="field-input" />
        </div>
        <div>
          <label className="field-label">Program Name *</label>
          <input type="text" value={formData.name || ""} onChange={(e) => updateField("name", e.target.value)} required placeholder="e.g. BS Computer Science" className="field-input" />
        </div>
        <div>
          <label className="field-label">Duration (Years) *</label>
          <input type="number" value={formData.years || ""} onChange={(e) => updateField("years", Number(e.target.value))} required placeholder="4" className="field-input" min={1} />
        </div>
        <div>
          <label className="field-label">Institution Type *</label>
          <select value={formData.institution_type || institutionType} onChange={(e) => updateField("institution_type", e.target.value)} className="field-input">
            <option value="university">University</option>
            <option value="college">College</option>
            <option value="school">School</option>
            <option value="institute">Institute</option>
          </select>
        </div>
        <div>
          <label className="field-label">Status *</label>
          <select value={formData.status ?? 1} onChange={(e) => updateField("status", Number(e.target.value))} className="field-input">
            <option value={1}>Active</option>
            <option value={0}>Inactive</option>
          </select>
        </div>
        <div>
          <label className="field-label">Description</label>
          <input type="text" value={formData.description || ""} onChange={(e) => updateField("description", e.target.value)} placeholder="Brief description..." className="field-input" />
        </div>
      </div>
    );
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" }}>
        <div>
          <label className="field-label">Name *</label>
          <input type="text" value={formData.name || ""} onChange={(e) => updateField("name", e.target.value)} required className="field-input" />
        </div>
        <div>
          <label className="field-label">Institution Type *</label>
          <select value={formData.institution_type || institutionType} onChange={(e) => updateField("institution_type", e.target.value)} className="field-input">
            <option value="university">University</option>
            <option value="college">College</option>
            <option value="school">School</option>
            <option value="institute">Institute</option>
          </select>
        </div>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="field-label">Description</label>
          <input type="text" value={formData.description || ""} onChange={(e) => updateField("description", e.target.value)} className="field-input" />
        </div>
        <div>
          <label className="field-label">Department</label>
          <select value={formData.department_id || ""} onChange={(e) => {
            const dId = Number(e.target.value);
            const dept = deptData.data.find(d => d.id === dId);
            setFormData(prev => ({ ...prev, department_id: dId, department_name: dept ? dept.name : "" }));
          }} className="field-input">
            <option value="">Select Department...</option>
            {deptData.data.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>
    );
  };

  const cancelBtnStyle: React.CSSProperties = {
    padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: 600, borderRadius: "8px",
    border: "1px solid var(--input-border)", background: "var(--input-bg)", color: "var(--text-dark)", cursor: "pointer",
  };

  return (
    <div style={{ padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Page Header */}
      <div className="panel-card-header">
        <div>
          <h2 className="topbar-title" style={{ fontSize: "1.4rem" }}>Academic Structure</h2>
          <p className="topbar-date">Manage departments, programs, majors, and minors</p>
        </div>
      </div>

      {/* ── Step 1: University  →  Step 2: Campus ─────────────────────────── */}
      <div className="panel-card" style={{ padding: "1rem 1.25rem", display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "1.25rem" }}>

        {/* University dropdown */}
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

        {/* Arrow */}
        <span style={{ fontSize: "1.4rem", color: "var(--text-muted)", paddingBottom: "0.15rem" }}>›</span>

        {/* Campus dropdown — disabled until university selected */}
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

        {/* Active filter badge */}
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

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: "2px", background: "var(--input-bg)", padding: "0.25rem", borderRadius: "8px", width: "fit-content" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: "0.5rem 1rem", fontSize: "0.85rem", fontWeight: tab === t.key ? 700 : 600, borderRadius: "6px", border: "none", cursor: "pointer", background: tab === t.key ? "var(--card-bg)" : "transparent", color: tab === t.key ? "var(--text-dark)" : "var(--text-dark-sub)", boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="panel-card">
        <DataTable
          columns={columns as Column<any>[]}
          data={current.data}
          loading={current.loading}
          searchQuery={current.searchQuery}
          onSearchChange={current.setSearchQuery}
          searchPlaceholder={`Search ${tab}...`}
          page={current.page}
          totalPages={current.totalPages}
          totalCount={current.totalCount}
          onPageChange={current.setPage}
          itemsPerPage={current.itemsPerPage}
          onItemsPerPageChange={current.setItemsPerPage}
          emptyMessage={`No ${tab} found.`}
          actionButton={
            <RoleGuard allowedRoles={["admin", "faculty"]}>
              <button onClick={openCreate} className="submit-btn" style={{ width: "auto", padding: "0.5rem 1rem", fontSize: "0.85rem", margin: 0 }}>
                + Add New
              </button>
            </RoleGuard>
          }
        />
      </div>

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}
        title={editItem ? `Edit ${tab.slice(0, -1)}` : `Create ${tab.slice(0, -1)}`}
        subtitle={editItem ? `Editing ID #${editItem.id}` : `Add a new ${tab.slice(0, -1)} record`}
        maxWidth="2xl"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} style={cancelBtnStyle}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className="submit-btn" style={{ width: "auto", margin: 0, padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
              {editItem ? "Update" : "Create"}
            </button>
          </>
        }>
        {renderForm()}
      </Modal>

      {/* View Modal */}
      <Modal isOpen={viewModal} onClose={() => setViewModal(false)} title="Details" subtitle={`${tab.slice(0, -1)} record`} maxWidth="lg">
        {viewItem && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {Object.entries(viewItem)
              .filter(([_, value]) => value !== null && value !== undefined && value !== "")
              .map(([key, value]) => (
              <div key={key} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.5rem 0", borderBottom: "1px solid var(--divider-color)" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-dark-sub)", textTransform: "uppercase", width: "140px", flexShrink: 0 }}>{key.replace(/_/g, " ")}</span>
                <span style={{ fontSize: "0.875rem", color: "var(--text-dark)", fontWeight: 500 }}>{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog isOpen={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={handleDelete}
        title={`Delete ${tab.slice(0, -1)}`}
        message={`Are you sure you want to delete this ${tab.slice(0, -1)}? This action cannot be undone.`}
        confirmText="Delete" type="danger" />
    </div>
  );
};

export default StructureManagementPage;

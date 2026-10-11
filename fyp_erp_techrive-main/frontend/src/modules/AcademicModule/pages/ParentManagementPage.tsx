import React, { useState, useEffect } from "react";
import { RoleGuard } from "../components/common/RoleGuard";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { DataTable, type Column } from "../components/common/DataTable";
import { toast } from "./AcademicLayout";
import API from "../../../api/api";

interface ParentRecord {
  id: number;
  students_id: number | null;
  user_id: number | null;
  father_first_name: string | null;
  father_last_name: string | null;
  father_email: string | null;
  father_mobile_1: string | null;
  mother_first_name: string | null;
  mother_last_name: string | null;
  student_name: string | null;
  reg_no: string | null;
  has_login: boolean;
}

const ParentManagementPage: React.FC = () => {
  const [parents, setParents]         = useState<ParentRecord[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search,  setSearch]          = useState("");
  const [modalOpen, setModalOpen]     = useState(false);
  const [editModal, setEditModal]      = useState(false);
  const [credModal, setCredModal]     = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedParent, setSelectedParent] = useState<ParentRecord | null>(null);
  const [saving, setSaving]           = useState(false);
  const [page, setPage]               = useState(1);
  const itemsPerPage = 10;

  // Form state for new parent
  const [formData, setFormData] = useState({
    father_first_name: "", father_last_name: "",
    father_email: "", father_mobile_1: "",
    mother_first_name: "", mother_last_name: "",
    mother_email: "", mother_mobile_1: "",
    students_id: "" as any,
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    father_first_name: "", father_last_name: "",
    father_email: "", father_mobile_1: "",
    mother_first_name: "", mother_last_name: "",
    mother_email: "", mother_mobile_1: "",
    students_id: "" as any,
  });

  // Credential form
  const [credForm, setCredForm] = useState({ email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);

  // Students list for dropdown
  const [students, setStudents] = useState<{ id: number; name: string; reg_no: string }[]>([]);

  useEffect(() => {
    loadParents();
    loadStudents();
  }, []);

  const loadParents = async () => {
    setLoading(true);
    try {
      const res = await API.get("/parent/admin/parents");
      if (res.data?.success) setParents(res.data.data);
    } catch {
      // fallback empty
    }
    setLoading(false);
  };

  const loadStudents = async () => {
    try {
      const res = await API.get("/academic/enrollment/students");
      if (res.data?.success) setStudents(res.data.data);
    } catch {}
  };

  const filtered = parents.filter(p =>
    [p.father_first_name, p.father_last_name, p.father_email, p.student_name, p.reg_no]
      .some(v => String(v || "").toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated  = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // ── Create new parent record ────────────────────────────────────────────
  const handleCreateParent = async () => {
    if (!formData.father_first_name) { toast.error("Validation", "Father first name is required."); return; }
    setSaving(true);
    try {
      const res = await API.post("/parent/admin/parents", formData);
      if (res.data?.success) {
        setParents(prev => [res.data.data, ...prev]);
        toast.success("Parent Created", "Parent record added successfully.");
        setModalOpen(false);
        setFormData({ father_first_name:"", father_last_name:"", father_email:"", father_mobile_1:"", mother_first_name:"", mother_last_name:"", mother_email:"", mother_mobile_1:"", students_id:"" });
      }
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to create parent.");
    }
    setSaving(false);
  };

  // ── Create login credentials ────────────────────────────────────────────
  const handleCreateCredentials = async () => {
    if (!credForm.email)    { toast.error("Validation", "Email is required."); return; }
    if (!credForm.password) { toast.error("Validation", "Password is required."); return; }
    if (credForm.password !== credForm.confirm) { toast.error("Validation", "Passwords do not match."); return; }
    if (!selectedParent)    return;
    setSaving(true);
    try {
      const res = await API.post("/parent/admin/create-credentials", {
        parent_detail_id: selectedParent.id,
        email:    credForm.email,
        password: credForm.password,
      });
      if (res.data?.success) {
        setParents(prev => prev.map(p => p.id === selectedParent.id ? { ...p, user_id: res.data.data.user_id, has_login: true, father_email: credForm.email } : p));
        toast.success("Login Created", `Credentials created — Email: ${credForm.email}`);
        setCredModal(false);
        setCredForm({ email:"", password:"", confirm:"" });
      }
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to create credentials.");
    }
    setSaving(false);
  };

  // ── Update/Edit parent record ───────────────────────────────────────────
  const handleEditOpen = (r: ParentRecord) => {
    setSelectedParent(r);
    setEditForm({
      father_first_name: r.father_first_name || "",
      father_last_name:  r.father_last_name  || "",
      father_email:      r.father_email      || "",
      father_mobile_1:   r.father_mobile_1   || "",
      mother_first_name: r.mother_first_name || "",
      mother_last_name:  r.mother_last_name  || "",
      mother_email:      (r as any).mother_email    || "",
      mother_mobile_1:   (r as any).mother_mobile_1 || "",
      students_id:       r.students_id ?? "",
    });
    setEditModal(true);
  };

  const handleUpdateParent = async () => {
    if (!selectedParent) return;
    if (!editForm.father_first_name) { toast.error("Validation", "Father first name is required."); return; }
    setSaving(true);
    try {
      const res = await API.patch(`/parent/admin/parents/${selectedParent.id}`, editForm);
      if (res.data?.success) {
        setParents(prev => prev.map(p => p.id === selectedParent.id ? res.data.data : p));
        toast.success("Updated", "Parent record updated successfully.");
        setEditModal(false);
      }
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to update parent.");
    }
    setSaving(false);
  };

  // ── Delete parent record ────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedParent) return;
    setSaving(true);
    try {
      await API.delete(`/parent/admin/parents/${selectedParent.id}`);
      setParents(prev => prev.filter(p => p.id !== selectedParent.id));
      toast.success("Deleted", "Parent record removed.");
      setDeleteDialog(false);
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to delete.");
    }
    setSaving(false);
  };

  const iconBtn: React.CSSProperties = { padding:"0.35rem", borderRadius:"6px", background:"transparent", border:"none", cursor:"pointer", color:"var(--text-dark-sub)", display:"flex", alignItems:"center", justifyContent:"center" };
  const cancelBtn: React.CSSProperties = { padding:"0.5rem 1rem", fontSize:"0.85rem", fontWeight:600, borderRadius:"8px", border:"1px solid var(--input-border)", background:"var(--input-bg)", color:"var(--text-dark)", cursor:"pointer" };

  const columns: Column<ParentRecord>[] = [
    { key:"index", header:"#", render:(_, index) => <span style={{ fontFamily:"monospace", fontWeight:700, color:"var(--accent)" }}>{index}</span> },
    { key:"father_first_name", header:"Father Name", render:(r) => `${r.father_first_name || ""} ${r.father_last_name || ""}`.trim() || "" },
    { key:"father_email",      header:"Father Email",  render:(r) => r.father_email  || "" },
    { key:"father_mobile_1",   header:"Phone",         render:(r) => r.father_mobile_1 || "" },
    { key:"student_name",      header:"Student",       render:(r) => r.student_name ? `${r.student_name} (${r.reg_no || ""})` : "" },
    { key:"has_login", header:"Portal Access", align:"center", render:(r) => (
      <span style={{ fontSize:"0.7rem", fontWeight:700, padding:"0.2rem 0.6rem", borderRadius:"6px",
        background: r.has_login ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
        color: r.has_login ? "var(--success,#059669)" : "var(--error,#dc2626)" }}>
        {r.has_login ? "✓ Active" : "✗ No Login"}
      </span>
    )},
    { key:"actions", header:"Actions", align:"center", width:"120px", render:(r) => (
      <div style={{ display:"flex", gap:"0.25rem", justifyContent:"center" }}>
        {/* View — eye icon */}
        <button onClick={() => handleEditOpen(r)} style={{ ...iconBtn, color:"var(--accent)" }} title="View / Edit"
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
          <svg style={{width:"16px",height:"16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
        </button>
        <RoleGuard allowedRoles={["admin"]}>
          {/* Edit — pencil icon */}
          <button onClick={() => handleEditOpen(r)} style={{ ...iconBtn, color:"#059669" }} title="Edit / Link Student"
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            <svg style={{width:"16px",height:"16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
          </button>
          {/* Give Login — key icon (only if no login yet) */}
          {!r.has_login && (
            <button onClick={() => { setSelectedParent(r); setCredForm({ email: r.father_email || "", password:"", confirm:"" }); setCredModal(true); }}
              style={{ ...iconBtn, color:"var(--accent)" }} title="Give Login Access"
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
              <svg style={{width:"16px",height:"16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
              </svg>
            </button>
          )}
          {/* Delete — trash icon */}
          <button onClick={() => { setSelectedParent(r); setDeleteDialog(true); }} style={{ ...iconBtn, color:"var(--error, #dc2626)" }} title="Delete"
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            <svg style={{width:"16px",height:"16px"}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </RoleGuard>
      </div>
    )},
  ];


  return (
    <div style={{ padding:"1.5rem 2rem", display:"flex", flexDirection:"column", gap:"1.25rem" }}>
      {/* Header */}
      <div className="panel-card-header">
        <div>
          <h2 className="topbar-title" style={{ fontSize:"1.4rem" }}>Parent Management</h2>
          <p className="topbar-date">Add parents, link them to students and provide portal access</p>
        </div>
        <RoleGuard allowedRoles={["admin"]}>
          <button onClick={() => setModalOpen(true)} className="submit-btn"
            style={{ width:"auto", padding:"0.5rem 1rem", fontSize:"0.85rem", margin:0 }}>
            + Add Parent
          </button>
        </RoleGuard>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:"1rem" }}>
        {[
          { label:"Total Parents",   value: parents.length,                                   color:"var(--accent)" },
          { label:"With Login",      value: parents.filter(p => p.has_login).length,          color:"var(--success,#059669)" },
          { label:"Without Login",   value: parents.filter(p => !p.has_login).length,         color:"var(--error,#dc2626)" },
          { label:"Linked Students", value: parents.filter(p => p.students_id).length,        color:"#7c3aed" },
        ].map(s => (
          <div key={s.label} className="panel-card" style={{ padding:"1rem 1.25rem" }}>
            <div style={{ fontSize:"0.7rem", fontWeight:700, color:"var(--text-dark-sub)", textTransform:"uppercase" }}>{s.label}</div>
            <div style={{ fontSize:"1.75rem", fontWeight:800, color:s.color, marginTop:"0.25rem" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="panel-card">
        <DataTable
          columns={columns} data={paginated} loading={loading}
          searchQuery={search} onSearchChange={v => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search by father name, email, student..."
          page={page} totalPages={totalPages} totalCount={filtered.length}
          onPageChange={setPage} itemsPerPage={itemsPerPage} onItemsPerPageChange={() => {}}
          emptyMessage="No parent records found. Click '+ Add Parent' to create one."
        />
      </div>

      {/* ── Create Parent Modal ────────────────────────────────────────────── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add New Parent" maxWidth="2xl"
        footer={<><button onClick={() => setModalOpen(false)} style={cancelBtn}>Cancel</button>
          <button onClick={handleCreateParent} disabled={saving} className="submit-btn"
            style={{ width:"auto", margin:0, padding:"0.5rem 1rem", fontSize:"0.85rem" }}>
            {saving ? "Saving..." : "Create Parent"}
          </button></>}>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
          {/* Link to student */}
          <div>
            <label className="field-label">Link to Student (Optional)</label>
            <select value={formData.students_id} onChange={e => setFormData(p => ({ ...p, students_id: e.target.value }))} className="field-input">
              <option value="">Select Student...</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.reg_no}</option>)}
            </select>
          </div>
          {/* Father info */}
          <div>
            <div style={{ fontSize:"0.78rem", fontWeight:700, color:"var(--text-dark-sub)", textTransform:"uppercase", marginBottom:"0.75rem", borderBottom:"1px solid var(--divider-color)", paddingBottom:"0.375rem" }}>Father Information</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"0.75rem" }}>
              <div><label className="field-label">First Name *</label><input className="field-input" value={formData.father_first_name} onChange={e => setFormData(p => ({...p, father_first_name: e.target.value}))} placeholder="e.g. Muhammad" /></div>
              <div><label className="field-label">Last Name</label><input className="field-input" value={formData.father_last_name} onChange={e => setFormData(p => ({...p, father_last_name: e.target.value}))} placeholder="e.g. Ahmed" /></div>
              <div><label className="field-label">Email</label><input type="email" className="field-input" value={formData.father_email} onChange={e => setFormData(p => ({...p, father_email: e.target.value}))} placeholder="father@email.com" /></div>
              <div><label className="field-label">Phone</label><input className="field-input" value={formData.father_mobile_1} onChange={e => setFormData(p => ({...p, father_mobile_1: e.target.value}))} placeholder="+92-300-0000000" /></div>
            </div>
          </div>
          {/* Mother info */}
          <div>
            <div style={{ fontSize:"0.78rem", fontWeight:700, color:"var(--text-dark-sub)", textTransform:"uppercase", marginBottom:"0.75rem", borderBottom:"1px solid var(--divider-color)", paddingBottom:"0.375rem" }}>Mother Information</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"0.75rem" }}>
              <div><label className="field-label">First Name</label><input className="field-input" value={formData.mother_first_name} onChange={e => setFormData(p => ({...p, mother_first_name: e.target.value}))} placeholder="e.g. Fatima" /></div>
              <div><label className="field-label">Last Name</label><input className="field-input" value={formData.mother_last_name} onChange={e => setFormData(p => ({...p, mother_last_name: e.target.value}))} placeholder="e.g. Ahmed" /></div>
              <div><label className="field-label">Email</label><input type="email" className="field-input" value={formData.mother_email} onChange={e => setFormData(p => ({...p, mother_email: e.target.value}))} placeholder="mother@email.com" /></div>
              <div><label className="field-label">Phone</label><input className="field-input" value={formData.mother_mobile_1} onChange={e => setFormData(p => ({...p, mother_mobile_1: e.target.value}))} placeholder="+92-300-0000000" /></div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Edit Parent Modal ───────────────────────────────────────────────── */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Parent Record"
        subtitle={selectedParent ? `Editing: ${selectedParent.father_first_name || ""} ${selectedParent.father_last_name || ""}` : ""}
        maxWidth="2xl"
        footer={<><button onClick={() => setEditModal(false)} style={cancelBtn}>Cancel</button>
          <button onClick={handleUpdateParent} disabled={saving} className="submit-btn"
            style={{ width:"auto", margin:0, padding:"0.5rem 1rem", fontSize:"0.85rem" }}>
            {saving ? "Saving..." : "Save Changes"}
          </button></> }>
        <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>
          {/* Link to student */}
          <div style={{ padding:"0.75rem 1rem", background:"rgba(124,58,237,0.07)", borderRadius:"8px", border:"1px dashed #7c3aed" }}>
            <label className="field-label" style={{ color:"#7c3aed" }}>🔗 Link to Student</label>
            <select value={editForm.students_id} onChange={e => setEditForm(p => ({ ...p, students_id: e.target.value }))} className="field-input">
              <option value="">— No Student Linked —</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} — {s.reg_no}</option>)}
            </select>
            {selectedParent?.student_name && (
              <p style={{ fontSize:"0.75rem", color:"#7c3aed", marginTop:"0.35rem" }}>Currently linked: <strong>{selectedParent.student_name}</strong></p>
            )}
          </div>
          {/* Father info */}
          <div>
            <div style={{ fontSize:"0.78rem", fontWeight:700, color:"var(--text-dark-sub)", textTransform:"uppercase", marginBottom:"0.75rem", borderBottom:"1px solid var(--divider-color)", paddingBottom:"0.375rem" }}>Father Information</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"0.75rem" }}>
              <div><label className="field-label">First Name *</label><input className="field-input" value={editForm.father_first_name} onChange={e => setEditForm(p => ({...p, father_first_name: e.target.value}))} /></div>
              <div><label className="field-label">Last Name</label><input className="field-input" value={editForm.father_last_name} onChange={e => setEditForm(p => ({...p, father_last_name: e.target.value}))} /></div>
              <div><label className="field-label">Email</label><input type="email" className="field-input" value={editForm.father_email} onChange={e => setEditForm(p => ({...p, father_email: e.target.value}))} /></div>
              <div><label className="field-label">Phone</label><input className="field-input" value={editForm.father_mobile_1} onChange={e => setEditForm(p => ({...p, father_mobile_1: e.target.value}))} /></div>
            </div>
          </div>
          {/* Mother info */}
          <div>
            <div style={{ fontSize:"0.78rem", fontWeight:700, color:"var(--text-dark-sub)", textTransform:"uppercase", marginBottom:"0.75rem", borderBottom:"1px solid var(--divider-color)", paddingBottom:"0.375rem" }}>Mother Information</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"0.75rem" }}>
              <div><label className="field-label">First Name</label><input className="field-input" value={editForm.mother_first_name} onChange={e => setEditForm(p => ({...p, mother_first_name: e.target.value}))} /></div>
              <div><label className="field-label">Last Name</label><input className="field-input" value={editForm.mother_last_name} onChange={e => setEditForm(p => ({...p, mother_last_name: e.target.value}))} /></div>
              <div><label className="field-label">Email</label><input type="email" className="field-input" value={editForm.mother_email} onChange={e => setEditForm(p => ({...p, mother_email: e.target.value}))} placeholder="mother@email.com" /></div>
              <div><label className="field-label">Phone</label><input className="field-input" value={editForm.mother_mobile_1} onChange={e => setEditForm(p => ({...p, mother_mobile_1: e.target.value}))} placeholder="+92-300-0000000" /></div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Give Login Credentials Modal ──────────────────────────────────── */}
      <Modal isOpen={credModal} onClose={() => setCredModal(false)}
        title="Create Parent Login"
        subtitle={selectedParent ? `For: ${selectedParent.father_first_name || ""} ${selectedParent.father_last_name || ""}` : ""}
        maxWidth="md"
        footer={<><button onClick={() => setCredModal(false)} style={cancelBtn}>Cancel</button>
          <button onClick={handleCreateCredentials} disabled={saving} className="submit-btn"
            style={{ width:"auto", margin:0, padding:"0.5rem 1rem", fontSize:"0.85rem" }}>
            {saving ? "Creating..." : "Create Login"}
          </button></>}>
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
          <div style={{ padding:"0.75rem 1rem", background:"rgba(29,111,191,0.08)", borderRadius:"8px", fontSize:"0.8rem", color:"var(--accent)", fontWeight:500 }}>
            ℹ Parent will use these credentials to log in at <strong>/parent/login</strong>
          </div>
          <div>
            <label className="field-label">Email Address *</label>
            <input type="email" className="field-input" value={credForm.email}
              onChange={e => setCredForm(p => ({...p, email: e.target.value}))}
              placeholder="parent@email.com" />
          </div>
          <div>
            <label className="field-label">Password *</label>
            <div style={{ position:"relative" }}>
              <input type={showPassword ? "text" : "password"} className="field-input"
                value={credForm.password}
                onChange={e => setCredForm(p => ({...p, password: e.target.value}))}
                placeholder="Min 8 characters" style={{ paddingRight:"2.5rem" }} />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                style={{ position:"absolute", right:"0.75rem", top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text-dark-sub)", fontSize:"0.8rem" }}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div>
            <label className="field-label">Confirm Password *</label>
            <input type="password" className="field-input" value={credForm.confirm}
              onChange={e => setCredForm(p => ({...p, confirm: e.target.value}))}
              placeholder="Re-enter password" />
            {credForm.confirm && credForm.password !== credForm.confirm && (
              <p style={{ fontSize:"0.75rem", color:"var(--error,#dc2626)", marginTop:"0.25rem" }}>Passwords do not match</p>
            )}
          </div>
          {credForm.email && credForm.password && credForm.password === credForm.confirm && (
            <div style={{ padding:"0.75rem 1rem", background:"rgba(16,185,129,0.08)", borderRadius:"8px", fontSize:"0.8rem" }}>
              <div style={{ fontWeight:700, color:"var(--success,#059669)", marginBottom:"0.375rem" }}>✓ Credentials Summary</div>
              <div style={{ color:"var(--text-dark)" }}>Email: <strong>{credForm.email}</strong></div>
              <div style={{ color:"var(--text-dark)" }}>Password: <strong>{showPassword ? credForm.password : "••••••••"}</strong></div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── Delete Confirm ─────────────────────────────────────────────────── */}
      <ConfirmDialog isOpen={deleteDialog} onClose={() => setDeleteDialog(false)} onConfirm={handleDelete}
        title="Delete Parent Record"
        message={`Are you sure you want to delete ${selectedParent?.father_first_name || "this parent"}'s record? This will also remove their login access.`}
        confirmText={saving ? "Deleting..." : "Delete"} type="danger" />
    </div>
  );
};

export default ParentManagementPage;
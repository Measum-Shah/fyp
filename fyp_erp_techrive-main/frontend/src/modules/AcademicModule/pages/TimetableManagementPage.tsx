import React, { useEffect, useState } from "react";
import axios from "axios";
import API from "../../../api/api";
import { DataTable, type Column } from "../components/common/DataTable";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { toast } from "./AcademicLayout";

type TimetableEntry = {
  id: number;
  day: string;
  time_table_id: number;
  time_table_slot_id: number | null;
  active_session_section_id: number;
  subject_id: number;
  teacher_id: number;
  room_id: number | null;
  session_id: number | null;
  branch_id: number | null;
};

type TimetableForm = Omit<TimetableEntry, "id"> & { active_session_id: number | null };
type LookupOption = { id: number; name?: string | null; title?: string | null; subject_code?: string | null; slot_from?: string | null; slot_to?: string | null; active_session_id?: number | null };
type TimetableLookups = {
  courses: LookupOption[];
  staff: LookupOption[];
  rooms: LookupOption[];
  time_slots: LookupOption[];
  timetables: LookupOption[];
  sessions: LookupOption[];
  active_sessions: LookupOption[];
  active_session_sections: LookupOption[];
};

const emptyForm: TimetableForm = {
  day: "Monday",
  time_table_id: 0,
  time_table_slot_id: 0,
  active_session_section_id: 0,
  subject_id: 0,
  teacher_id: 0,
  room_id: null,
  session_id: null,
  branch_id: null,
  active_session_id: null,
};

const primaryButtonStyle: React.CSSProperties = { background: "var(--accent)", color: "#fff", border: "none", borderRadius: "6px", padding: "0.65rem 1rem", fontWeight: 700, cursor: "pointer" };
const secondaryButtonStyle: React.CSSProperties = { background: "var(--input-bg)", color: "var(--text-dark)", border: "1px solid var(--card-border)", borderRadius: "6px", padding: "0.45rem 0.7rem", fontWeight: 600, cursor: "pointer" };
const dangerButtonStyle: React.CSSProperties = { ...secondaryButtonStyle, color: "var(--error)", borderColor: "var(--error-border)" };

const getErrorMessage = (error: unknown, fallback: string) =>
  axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || fallback : fallback;

const TimetableManagementPage: React.FC = () => {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TimetableEntry | null>(null);
  const [form, setForm] = useState<TimetableForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [lookups, setLookups] = useState<TimetableLookups | null>(null);
  const [sessionTeachers, setSessionTeachers] = useState<LookupOption[]>([]);
  const [sessionCourses, setSessionCourses] = useState<LookupOption[]>([]);
  const [creatingSlot, setCreatingSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({ name: "", slot_from: "", slot_to: "" });
  const [creatingTimeTable, setCreatingTimeTable] = useState(false);
  const [newTimeTableTitle, setNewTimeTableTitle] = useState("");

  useEffect(() => {
    if (!form.active_session_id) {
      setSessionTeachers([]);
      setSessionCourses([]);
      return;
    }
    API.get(`/academic/timetable/teachers-by-session/${form.active_session_id}`)
      .then(res => setSessionTeachers(res.data.data || []))
      .catch(err => console.error(err));

    API.get(`/academic/timetable/courses-by-session/${form.active_session_id}`)
      .then(res => setSessionCourses(res.data.data || []))
      .catch(err => console.error(err));
  }, [form.active_session_id]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const response = await API.get("/academic/timetable");
      setEntries(response.data.data || []);
    } catch (error: unknown) {
      toast.error("Timetable Load Failed", getErrorMessage(error, "Unable to load timetable."));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadEntries(); }, []);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const response = await API.get("/academic/timetable/lookups");
        const data = response.data.data as TimetableLookups;
        if (data.active_sessions?.length) {
          setLookups(data);
          return;
        }
        const fallback = await API.get("/academic/student-enrollment/lookups");
        setLookups({ ...data, active_sessions: fallback.data.data?.active_sessions || [], active_session_sections: fallback.data.data?.active_session_sections || [] });
      } catch (error: unknown) {
        toast.error("Lookup Load Failed", getErrorMessage(error, "Unable to load timetable options."));
      }
    };
    void loadLookups();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (entry: TimetableEntry) => {
    setEditing(entry);
    const activeSessionId = lookups?.active_session_sections.find((section) => section.id === entry.active_session_section_id)?.active_session_id || null;
    setForm({ ...entry, active_session_id: activeSessionId });
    setModalOpen(true);
  };

  const updateField = (field: keyof TimetableForm, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: field === "day" ? value : (value === "" ? null : Number(value)),
      ...(field === "active_session_id" ? { active_session_section_id: 0 } : {}),
    }));
  };

  const handleCreateSlot = async () => {
    if (!newSlot.name || !newSlot.slot_from || !newSlot.slot_to) {
      toast.error("Invalid Slot", "Please fill in name, start time, and end time.");
      return;
    }
    try {
      const response = await API.post("/academic/timetable/slots", newSlot);
      const created = response.data.data;
      setLookups((prev) => prev ? { ...prev, time_slots: [...prev.time_slots, created] } : null);
      updateField("time_table_slot_id", String(created.id));
      setCreatingSlot(false);
      setNewSlot({ name: "", slot_from: "", slot_to: "" });
      toast.success("Slot Created", `Time slot '${created.name}' has been added.`);
    } catch (error: unknown) {
      toast.error("Create Slot Failed", getErrorMessage(error, "Unable to create time slot."));
    }
  };

  const handleCreateTimeTable = async () => {
    if (!newTimeTableTitle) {
      toast.error("Invalid Timetable", "Please enter a title.");
      return;
    }
    try {
      const response = await API.post("/academic/timetable/timetables", { title: newTimeTableTitle });
      const created = response.data.data;
      setLookups((prev) => prev ? { ...prev, timetables: [created, ...prev.timetables] } : null);
      updateField("time_table_id", String(created.id));
      setCreatingTimeTable(false);
      setNewTimeTableTitle("");
      toast.success("Timetable Created", `Timetable '${created.title}' has been added.`);
    } catch (error: unknown) {
      toast.error("Create Timetable Failed", getErrorMessage(error, "Unable to create timetable."));
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        time_table_id: Number(form.time_table_id),
        time_table_slot_id: Number(form.time_table_slot_id),
        active_session_section_id: Number(form.active_session_section_id),
        subject_id: Number(form.subject_id),
        teacher_id: Number(form.teacher_id),
      };
      const response = editing
        ? await API.put(`/academic/timetable/${editing.id}`, payload)
        : await API.post("/academic/timetable", payload);
      if (editing) {
        setEntries((current) => current.map((entry) => entry.id === editing.id ? response.data.data : entry));
        toast.success("Timetable Updated");
      } else {
        setEntries((current) => [...current, response.data.data]);
        toast.success("Timetable Entry Added");
      }
      setModalOpen(false);
    } catch (error: unknown) {
      toast.error("Save Failed", getErrorMessage(error, "Unable to save timetable entry."));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (deleteId === null) return;
    try {
      await API.delete(`/academic/timetable/${deleteId}`);
      setEntries((current) => current.filter((entry) => entry.id !== deleteId));
      toast.success("Timetable Entry Deleted");
    } catch (error: unknown) {
      toast.error("Delete Failed", getErrorMessage(error, "Unable to delete timetable entry."));
    } finally {
      setDeleteId(null);
    }
  };

  const lookupName = (list: LookupOption[] | undefined, id: number | null, fallback: string) => {
    const option = list?.find((item) => item.id === id);
    return option?.name || option?.title || fallback;
  };

  const columns: Column<TimetableEntry>[] = [
    { key: "day", header: "Day" },
    { key: "time_table_slot_id", header: "Slot", render: (entry) => lookupName(lookups?.time_slots, entry.time_table_slot_id, "-") },
    { key: "subject_id", header: "Subject", render: (entry) => lookupName(lookups?.courses, entry.subject_id, `Subject #${entry.subject_id}`) },
    { key: "teacher_id", header: "Teacher", render: (entry) => lookupName(lookups?.staff, entry.teacher_id, `Teacher #${entry.teacher_id}`) },
    { key: "active_session_section_id", header: "Section", render: (entry) => lookupName(lookups?.active_session_sections, entry.active_session_section_id, `Section #${entry.active_session_section_id}`) },
    { key: "room_id", header: "Room", render: (entry) => lookupName(lookups?.rooms, entry.room_id, "-") },
    {
      key: "actions",
      header: "Actions",
      align: "center",
      render: (entry) => (
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          <button onClick={() => openEdit(entry)} style={{ padding: "0.35rem", border: "none", background: "transparent", cursor: "pointer", color: "#059669", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.15s" }} title="Edit" onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={() => setDeleteId(entry.id)} style={{ padding: "0.35rem", border: "none", background: "transparent", cursor: "pointer", color: "var(--error, #dc2626)", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.15s" }} title="Delete" onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      ),
    },
  ];

  const fields: { key: keyof TimetableForm; label: string; required?: boolean; options?: LookupOption[]; optionLabel?: (option: LookupOption) => string }[] = [
    { key: "day", label: "Day", required: true, options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((name, id) => ({ id, name })) },
    { key: "time_table_id", label: "Timetable", required: true, options: lookups?.timetables, optionLabel: (option) => option.title || `Timetable #${option.id}` },
    { key: "time_table_slot_id", label: "Time Slot", required: true, options: lookups?.time_slots, optionLabel: (option) => option.name || `Slot #${option.id}` },
    { key: "active_session_id", label: "Active Session", required: true, options: lookups?.active_sessions, optionLabel: (option) => option.title || `Active Session #${option.id}` },
    { key: "active_session_section_id", label: "Active Section", required: true, options: lookups?.active_session_sections.filter((option) => !form.active_session_id || option.active_session_id === form.active_session_id), optionLabel: (option) => option.name || `Section #${option.id}` },
    { key: "subject_id", label: "Subject", required: true, options: form.active_session_id ? sessionCourses : lookups?.courses, optionLabel: (option) => `${option.subject_code ? `${option.subject_code} - ` : ""}${option.name || `Subject #${option.id}`}` },
    { key: "teacher_id", label: "Teacher", required: true, options: form.active_session_id ? sessionTeachers : lookups?.staff, optionLabel: (option) => option.name || `Teacher #${option.id}` },
    { key: "room_id", label: "Room", options: lookups?.rooms, optionLabel: (option) => option.name || `Room #${option.id}` },
    { key: "session_id", label: "Academic Session", options: lookups?.sessions, optionLabel: (option) => option.title || `Session #${option.id}` },
  ];

  return (
    <div style={{ padding: "1.5rem clamp(1rem, 3vw, 2rem) 2rem", display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "1600px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
      <div className="panel-card-header" style={{ alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: 0 }}>
        <div>
          <h1 className="topbar-title" style={{ fontSize: "1.4rem", color: "var(--text-dark)" }}>Timetable Management</h1>
          <p style={{ color: "var(--text-dark-sub)", marginTop: "0.3rem" }}>Create and maintain class schedules for your institution.</p>
        </div>
        <button style={primaryButtonStyle} onClick={openCreate}>Add Timetable Entry</button>
      </div>
      <div style={{ overflowX: "auto", borderRadius: "14px" }}>
        <DataTable columns={columns} data={entries} loading={loading} emptyMessage="No timetable entries found." />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit Timetable Entry" : "Add Timetable Entry"} maxWidth="2xl" footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <button style={secondaryButtonStyle} onClick={() => setModalOpen(false)}>Cancel</button>
          <button style={primaryButtonStyle} onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Entry"}</button>
        </div>
      }>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
          {fields.map((field) => {
            if (field.key === "time_table_id") {
              return (
                <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "0.25rem", gridColumn: creatingTimeTable ? "1 / -1" : undefined }}>
                  <label className="field-label">
                    {field.label}{field.required ? " *" : ""}
                  </label>
                  {!creatingTimeTable ? (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <select className="field-input" style={{ flex: 1, minWidth: 0 }} value={form.time_table_id || ""} required={field.required} onChange={(e) => updateField(field.key, e.target.value)}>
                        <option value="">Select {field.label}</option>
                        {(field.options || []).map((option) => (
                          <option key={option.id} value={option.id}>{field.optionLabel ? field.optionLabel(option) : option.name}</option>
                        ))}
                      </select>
                      <button type="button" style={{ ...secondaryButtonStyle, padding: 0, width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.2rem", lineHeight: 1 }} onClick={() => setCreatingTimeTable(true)} title="Add new timetable">+</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.75rem", background: "var(--input-bg)", borderRadius: "8px", border: "1px solid var(--card-border)" }}>
                      <input type="text" className="field-input" placeholder="Timetable Title (e.g., Fall 2026)" value={newTimeTableTitle} onChange={(e) => setNewTimeTableTitle(e.target.value)} />
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                        <button type="button" style={{ ...secondaryButtonStyle, padding: "0.35rem 0.6rem", fontSize: "0.75rem" }} onClick={() => setCreatingTimeTable(false)}>Cancel</button>
                        <button type="button" style={{ ...primaryButtonStyle, padding: "0.35rem 0.6rem", fontSize: "0.75rem" }} onClick={handleCreateTimeTable}>Save Timetable</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            if (field.key === "time_table_slot_id") {
              return (
                <div key={field.key} style={{ display: "flex", flexDirection: "column", gap: "0.25rem", gridColumn: creatingSlot ? "1 / -1" : undefined }}>
                  <label className="field-label">
                    {field.label}{field.required ? " *" : ""}
                  </label>
                  {!creatingSlot ? (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <select className="field-input" style={{ flex: 1, minWidth: 0 }} value={form.time_table_slot_id || ""} required={field.required} onChange={(e) => updateField(field.key, e.target.value)}>
                        <option value="">Select {field.label}</option>
                        {(field.options || []).map((option) => (
                          <option key={option.id} value={option.id}>{field.optionLabel ? field.optionLabel(option) : option.name}</option>
                        ))}
                      </select>
                      <button type="button" style={{ ...secondaryButtonStyle, padding: 0, width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "1.2rem", lineHeight: 1 }} onClick={() => setCreatingSlot(true)} title="Add custom time slot">+</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.75rem", background: "var(--input-bg)", borderRadius: "8px", border: "1px solid var(--card-border)" }}>
                      <input type="text" className="field-input" placeholder="Slot Name (e.g., 1st Period)" value={newSlot.name} onChange={(e) => setNewSlot({ ...newSlot, name: e.target.value })} />
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <input type="time" className="field-input" style={{ flex: "1 1 120px" }} value={newSlot.slot_from} onChange={(e) => setNewSlot({ ...newSlot, slot_from: e.target.value })} />
                        <span style={{ alignSelf: "center", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-dark-sub)" }}>to</span>
                        <input type="time" className="field-input" style={{ flex: "1 1 120px" }} value={newSlot.slot_to} onChange={(e) => setNewSlot({ ...newSlot, slot_to: e.target.value })} />
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                        <button type="button" style={{ ...secondaryButtonStyle, padding: "0.35rem 0.6rem", fontSize: "0.75rem" }} onClick={() => setCreatingSlot(false)}>Cancel</button>
                        <button type="button" style={{ ...primaryButtonStyle, padding: "0.35rem 0.6rem", fontSize: "0.75rem" }} onClick={handleCreateSlot}>Save Slot</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return (
              <label key={field.key} className="field-label">
                {field.label}{field.required ? " *" : ""}
                <select className="field-input" value={form[field.key] || ""} required={field.required} onChange={(event) => updateField(field.key, event.target.value)}>
                  <option value="">Select {field.label}</option>
                  {(field.options || []).map((option) => <option key={option.id} value={field.key === "day" ? option.name || "" : option.id}>{field.optionLabel ? field.optionLabel(option) : option.name}</option>)}
                </select>
              </label>
            );
          })}
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete timetable entry?"
        message="This schedule entry will be permanently removed."
        onConfirm={remove}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};

export default TimetableManagementPage;

import React, { useState, useEffect } from "react";
import API from "../../../api/api";
import { toast } from "./AcademicLayout";
import { DataTable, type Column } from "../components/common/DataTable";
import { Modal } from "../components/common/Modal";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { useRoleAccess } from "../hooks/useRoleAccess";

interface Room {
  id: number;
  name: string;
  department_id: number | null;
  department_name: string | null;
  status: string;
}

interface Department {
  id: number;
  name: string;
}

const RoomsManagementPage: React.FC = () => {
  const { isAdmin } = useRoleAccess();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    department_id: "",
    status: "Active",
  });
  
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await API.get("/academic/rooms");
      if (res.data.success) {
        setRooms(res.data.data);
      }
    } catch (error: any) {
      toast.error("Failed to load rooms", error.response?.data?.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const res = await API.get("/academic/rooms/lookups");
      if (res.data.success) {
        setDepartments(res.data.data.departments);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchLookups();
  }, []);

  const handleOpenModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        department_id: room.department_id ? String(room.department_id) : "",
        status: room.status,
      });
    } else {
      setEditingRoom(null);
      setFormData({
        name: "",
        department_id: "",
        status: "Active",
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Validation Error", "Room name is required");
      return;
    }
    try {
      const payload = {
        name: formData.name,
        department_id: formData.department_id || null,
        status: formData.status,
      };
      if (editingRoom) {
        await API.put(`/academic/rooms/${editingRoom.id}`, payload);
        toast.success("Success", "Room updated successfully");
      } else {
        await API.post("/academic/rooms", payload);
        toast.success("Success", "Room created successfully");
      }
      setModalOpen(false);
      fetchRooms();
    } catch (error: any) {
      toast.error("Error", error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await API.delete(`/academic/rooms/${deleteConfirm}`);
      toast.success("Success", "Room deleted successfully");
      setDeleteConfirm(null);
      fetchRooms();
    } catch (error: any) {
      toast.error("Error", error.response?.data?.message || "Delete failed");
      setDeleteConfirm(null);
    }
  };

  const columns: Column<Room>[] = [
    { key: "name", header: "Room / Venue Name" },
    { key: "department_name", header: "Department", render: (row) => row.department_name || "—" },
    { 
      key: "status", 
      header: "Status", 
      render: (row) => (
        <span style={{ 
          padding: "4px 8px", 
          borderRadius: "12px", 
          fontSize: "12px", 
          fontWeight: 600,
          background: row.status === "Active" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          color: row.status === "Active" ? "#10b981" : "#ef4444" 
        }}>
          {row.status}
        </span>
      )
    },
    ...(isAdmin ? [{
      key: "actions",
      header: "Actions",
      align: "center" as const,
      render: (row: Room) => (
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
          <button onClick={() => handleOpenModal(row)} style={{ padding: "0.35rem", border: "none", background: "transparent", cursor: "pointer", color: "#059669", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.15s" }} title="Edit" onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
          <button onClick={() => setDeleteConfirm(row.id)} style={{ padding: "0.35rem", border: "none", background: "transparent", cursor: "pointer", color: "var(--error, #dc2626)", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "opacity 0.15s" }} title="Delete" onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}>
            <svg style={{ width: "16px", height: "16px" }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      )
    }] : [])
  ];

  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ margin: 0, color: "var(--text-dark)", fontSize: "1.5rem" }}>Room / Venue Management</h2>
        {isAdmin && (
          <button 
            onClick={() => handleOpenModal()} 
            style={{ padding: "10px 16px", borderRadius: "8px", border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}
          >
            <span style={{ fontSize: "18px" }}>+</span> Add Room
          </button>
        )}
      </div>

      <div style={{ background: "var(--card-bg, #fff)", borderRadius: "12px", border: "1px solid var(--card-border)", padding: "1rem" }}>
        <DataTable columns={columns} data={rooms} loading={loading} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingRoom ? "Edit Room" : "Add Room"}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "14px", fontWeight: 500, color: "var(--text-dark)" }}>Room/Venue Name *</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
              required
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--card-border)", fontSize: "14px", background: "var(--input-bg)", color: "var(--text-dark)" }} 
              placeholder="e.g. Auditorium A, Lab 201"
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "14px", fontWeight: 500, color: "var(--text-dark)" }}>Department (Optional)</label>
            <select 
              value={formData.department_id} 
              onChange={e => setFormData({ ...formData, department_id: e.target.value })} 
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--card-border)", fontSize: "14px", background: "var(--input-bg)", color: "var(--text-dark)" }}
            >
              <option value="">-- No Department specified --</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "14px", fontWeight: 500, color: "var(--text-dark)" }}>Status</label>
            <select 
              value={formData.status} 
              onChange={e => setFormData({ ...formData, status: e.target.value })} 
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid var(--card-border)", fontSize: "14px", background: "var(--input-bg)", color: "var(--text-dark)" }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "1rem" }}>
            <button type="button" onClick={() => setModalOpen(false)} style={{ padding: "10px 16px", borderRadius: "6px", border: "1px solid var(--card-border)", background: "var(--card-bg, #fff)", color: "var(--text-dark)", cursor: "pointer", fontWeight: 500 }}>Cancel</button>
            <button type="submit" style={{ padding: "10px 16px", borderRadius: "6px", border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontWeight: 500 }}>{editingRoom ? "Save Changes" : "Create Room"}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog 
        isOpen={!!deleteConfirm} 
        title="Confirm Deletion" 
        message="Are you sure you want to delete this room? This action cannot be undone." 
        onConfirm={handleDelete} 
        onClose={() => setDeleteConfirm(null)} 
      />
    </div>
  );
};

export default RoomsManagementPage;

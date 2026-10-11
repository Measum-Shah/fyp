import React, { useState, useEffect } from "react";
import axios from "axios";
import { DataTable, type Column } from "../components/common/DataTable";
import { Modal } from "../components/common/Modal";
import { toast } from "./AcademicLayout";

export default function FineManagementPage() {
  const [fines, setFines] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedFine, setSelectedFine] = useState<any>(null);
  
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    studentId: "",
    categoryId: "",
    amount: "",
    reason: "",
    violationDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    remarks: ""
  });

  const [payData, setPayData] = useState({
    amount: "",
    paymentMethod: "Cash",
    reference: ""
  });

  useEffect(() => {
    fetchFines();
    fetchCategories();
  }, [search]);

  const fetchFines = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/academic/fines", {
        headers: { Authorization: `Bearer ${localStorage.getItem("erp_token")}` },
        params: { search }
      });
      setFines(res.data);
    } catch (e: any) {
      toast.error("Error", e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/academic/fines/categories", {
        headers: { Authorization: `Bearer ${localStorage.getItem("erp_token")}` }
      });
      setCategories(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/academic/fines", {
        studentId: Number(formData.studentId),
        categoryId: Number(formData.categoryId),
        amount: Number(formData.amount),
        reason: formData.reason,
        violationDate: formData.violationDate,
        dueDate: formData.dueDate,
        remarks: formData.remarks
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("erp_token")}` }
      });
      setShowAddModal(false);
      toast.success("Success", "Fine issued successfully");
      fetchFines();
    } catch (e: any) {
      toast.error("Error", e.response?.data?.error || e.message);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`http://localhost:5000/api/academic/fines/${selectedFine.id}/payment`, {
        amount: Number(payData.amount),
        paymentMethod: payData.paymentMethod,
        reference: payData.reference
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("erp_token")}` }
      });
      setShowPayModal(false);
      toast.success("Success", "Payment recorded successfully");
      fetchFines();
    } catch (e: any) {
      toast.error("Error", e.response?.data?.error || e.message);
    }
  };

  const columns: Column<any>[] = [
    { key: "referenceNumber", header: "Ref #" },
    { key: "student", header: "Student", render: (f: any) => f.student ? `${f.student.first_name} ${f.student.last_name} (${f.student.reg_no})` : f.studentId },
    { key: "category", header: "Category", render: (f: any) => f.category?.name || "-" },
    { key: "amount", header: "Amount (Rs)" },
    { key: "remainingAmount", header: "Remaining (Rs)" },
    { key: "status", header: "Status", render: (f: any) => (
      <span style={{
        display: "inline-flex", alignItems: "center", padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.7rem", fontWeight: 700,
        background: f.status === "PAID" ? "rgba(16,185,129,0.12)" : f.status === "PENDING" ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)",
        color: f.status === "PAID" ? "var(--success, #059669)" : f.status === "PENDING" ? "#d97706" : "var(--error, #dc2626)",
      }}>
        {f.status}
      </span>
    ) },
    { key: "dueDate", header: "Due Date", render: (f: any) => new Date(f.dueDate).toLocaleDateString() },
    { key: "actions", header: "Actions", render: (f: any) => (
      f.remainingAmount > 0 && f.status !== 'CANCELLED' ? (
        <button className="submit-btn" style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", margin: 0 }} 
          onClick={() => { setSelectedFine(f); setPayData({ ...payData, amount: f.remainingAmount.toString() }); setShowPayModal(true); }}>
          Pay
        </button>
      ) : null
    ) }
  ];

  const totalPages = Math.ceil(fines.length / itemsPerPage);
  const paginatedFines = fines.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div style={{ padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="panel-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 className="topbar-title" style={{ fontSize: "1.4rem" }}>Fine Management</h2>
          <p className="topbar-date">Manage disciplinary and academic fines</p>
        </div>
      </div>

      <div className="panel-card">
        <DataTable
          columns={columns}
          data={paginatedFines}
          loading={loading}
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search fines..."
          page={page}
          totalPages={totalPages}
          totalCount={fines.length}
          onPageChange={setPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          emptyMessage="No fines found."
          actionButton={
            <button className="submit-btn" style={{ margin: 0, padding: "0.5rem 1rem", fontSize: "0.85rem", width: "auto" }} onClick={() => setShowAddModal(true)}>
              + Issue Fine
            </button>
          }
        />
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Issue New Fine">
        <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="field-label">Student ID (Internal ID)</label>
            <input className="field-input" required type="number" value={formData.studentId} onChange={e => setFormData({...formData, studentId: e.target.value})} />
          </div>
          <div>
            <label className="field-label">Category</label>
            <select className="field-input" required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Amount (Rs)</label>
            <input className="field-input" required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
          </div>
          <div>
            <label className="field-label">Reason</label>
            <input className="field-input" required type="text" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} />
          </div>
          <div>
            <label className="field-label">Violation Date</label>
            <input className="field-input" required type="date" value={formData.violationDate} onChange={e => setFormData({...formData, violationDate: e.target.value})} />
          </div>
          <div>
            <label className="field-label">Due Date</label>
            <input className="field-input" required type="date" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>Cancel</button>
            <button type="submit" className="submit-btn" style={{ width: "auto" }}>Submit</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title={`Record Payment for ${selectedFine?.referenceNumber}`}>
        <form onSubmit={handlePay} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label className="field-label">Amount (Rs)</label>
            <input className="field-input" required type="number" max={selectedFine?.remainingAmount} value={payData.amount} onChange={e => setPayData({...payData, amount: e.target.value})} />
          </div>
          <div>
            <label className="field-label">Payment Method</label>
            <select className="field-input" value={payData.paymentMethod} onChange={e => setPayData({...payData, paymentMethod: e.target.value})}>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Online">Online</option>
            </select>
          </div>
          <div>
            <label className="field-label">Reference #</label>
            <input className="field-input" type="text" value={payData.reference} onChange={e => setPayData({...payData, reference: e.target.value})} />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem" }}>
            <button type="button" className="cancel-btn" onClick={() => setShowPayModal(false)}>Cancel</button>
            <button type="submit" className="submit-btn" style={{ width: "auto" }}>Submit Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

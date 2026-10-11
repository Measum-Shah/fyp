import React, { useState, useEffect } from "react";
import axios from "axios";
import { DataTable, type Column } from "../../components/common/DataTable";

export default function StudentFinesPage() {
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchFines();
  }, [search]);

  const fetchFines = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/academic/student-portal/fines", {
        headers: { Authorization: `Bearer ${localStorage.getItem("erp_token")}` },
        params: { search }
      });
      setFines(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const columns: Column<any>[] = [
    { key: "referenceNumber", header: "Ref #" },
    { key: "category", header: "Category", render: (f: any) => f.category?.name || "-" },
    { key: "reason", header: "Reason" },
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
    { key: "dueDate", header: "Due Date", render: (f: any) => new Date(f.dueDate).toLocaleDateString() }
  ];

  const totalPages = Math.ceil(fines.length / itemsPerPage);
  const paginatedFines = fines.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div style={{ padding: "1.5rem 2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      <div className="panel-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h2 className="topbar-title" style={{ fontSize: "1.4rem" }}>My Fines</h2>
          <p className="topbar-date">View and track your disciplinary and academic fines.</p>
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
        />
      </div>
    </div>
  );
}

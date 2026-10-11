import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { S, statusColor, pkr } from "../utils/styles";

const API = "http://localhost:5000/api/accounts";

export interface NoteItem {
  id: number;
  note_number: string;
  type: "CREDIT_NOTE" | "DEBIT_NOTE";
  party_type: "CUSTOMER" | "VENDOR";
  party_name: string;
  date: string;
  amount: number;
  reason: string;
  reference_doc?: string;
  status: string;
}

export const CreditDebitNotesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"CREDIT_NOTE" | "DEBIT_NOTE">("CREDIT_NOTE");
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [partyTypeFilter, setPartyTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [formData, setFormData] = useState({
    type: "CREDIT_NOTE",
    party_type: "CUSTOMER",
    party_name: "",
    date: new Date().toISOString().split("T")[0],
    amount: 0,
    reference_doc: "",
    reason: "",
    notes: "",
  });

  const fetchCreditDebitNotesApi = async () => {
    const res = await axios.get(`${API}/credit-debit-notes`);
    return res.data;
  };

  const createCreditDebitNoteApi = async (data: any) => {
    const res = await axios.post(`${API}/credit-debit-notes`, data);
    return res.data;
  };

  const loadNotes = async () => {
    try {
      setLoading(true);
      const data = await fetchCreditDebitNotesApi();
      if (data.success) {
        setNotes(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCreditDebitNoteApi(formData);
      setShowModal(false);
      loadNotes();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      if (n.type !== activeTab) return false;
      if (searchTerm && !n.note_number.toLowerCase().includes(searchTerm.toLowerCase()) && !n.party_name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      if (partyTypeFilter && n.party_type !== partyTypeFilter) return false;
      if (dateFrom && n.date < dateFrom) return false;
      if (dateTo && n.date > dateTo) return false;
      return true;
    });
  }, [notes, activeTab, searchTerm, partyTypeFilter, dateFrom, dateTo]);

  return (
    <div style={S.page}>
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Credit & Debit Notes</h1>
          <p style={S.subtitle}>
            Issue customer credit notes for returns/discounts and vendor debit notes for adjustments.
          </p>
        </div>
        <button
          style={S.btnPrimary}
          onClick={() => {
            setFormData({
              ...formData,
              type: activeTab,
              party_type: activeTab === "CREDIT_NOTE" ? "CUSTOMER" : "VENDOR",
            });
            setShowModal(true);
          }}
        >
          + Create Note
        </button>
      </div>

      <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid var(--card-border)", paddingBottom: "0.5rem" }}>
        <button
          style={{
            ...S.btnSecondary,
            background: activeTab === "CREDIT_NOTE" ? "var(--input-bg)" : "transparent",
            borderColor: activeTab === "CREDIT_NOTE" ? "var(--accent)" : "transparent",
            color: activeTab === "CREDIT_NOTE" ? "var(--accent)" : "var(--text-dark-sub)",
          }}
          onClick={() => setActiveTab("CREDIT_NOTE")}
        >
          Credit Notes
        </button>
        <button
          style={{
            ...S.btnSecondary,
            background: activeTab === "DEBIT_NOTE" ? "var(--input-bg)" : "transparent",
            borderColor: activeTab === "DEBIT_NOTE" ? "var(--accent)" : "transparent",
            color: activeTab === "DEBIT_NOTE" ? "var(--accent)" : "var(--text-dark-sub)",
          }}
          onClick={() => setActiveTab("DEBIT_NOTE")}
        >
          Debit Notes
        </button>
      </div>

      <div style={S.filterBar}>
        <input
          style={S.input}
          placeholder="Search by Note # or Party..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          style={S.select}
          value={partyTypeFilter}
          onChange={(e) => setPartyTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="CUSTOMER">Customer</option>
          <option value="VENDOR">Vendor</option>
        </select>
        <input
          style={S.input}
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <input
          style={S.input}
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
      </div>

      <div style={S.tableWrap}>
        {loading ? (
          <div style={S.emptyRow}>Loading notes...</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Note #</th>
                <th style={S.th}>Party</th>
                <th style={S.th}>Date</th>
                <th style={S.th}>Related Invoice/Bill</th>
                <th style={S.thRight}>Amount</th>
                <th style={S.th}>Reason</th>
                <th style={{ ...S.th, textAlign: "center" }}>Status</th>
                <th style={S.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotes.length === 0 ? (
                <tr>
                  <td colSpan={8} style={S.emptyRow}>
                    No notes found.
                  </td>
                </tr>
              ) : (
                filteredNotes.map((n) => (
                  <tr key={n.id}>
                    <td style={{ ...S.td, ...S.mono }}>{n.note_number}</td>
                    <td style={S.td}>
                      <div style={{ fontWeight: 600 }}>{n.party_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dark-sub)" }}>{n.party_type}</div>
                    </td>
                    <td style={S.td}>{new Date(n.date).toLocaleDateString()}</td>
                    <td style={S.td}>{n.reference_doc || "-"}</td>
                    <td style={S.tdRight}>{pkr(n.amount)}</td>
                    <td style={S.td}>{n.reason}</td>
                    <td style={S.tdCenter}>
                      <span style={S.tag(statusColor(n.status))}>{n.status}</span>
                    </td>
                    <td style={S.tdRight}>
                      <button style={S.btnSecondary}>View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h2 style={S.modalTitle}>Issue Credit / Debit Note</h2>
            <form onSubmit={handleCreate}>
              <div style={S.formGrid}>
                <div style={S.formGroup}>
                  <label style={S.label}>Note Type *</label>
                  <select
                    style={S.select}
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as any,
                        party_type: e.target.value === "CREDIT_NOTE" ? "CUSTOMER" : "VENDOR",
                      })
                    }
                  >
                    <option value="CREDIT_NOTE">CREDIT NOTE</option>
                    <option value="DEBIT_NOTE">DEBIT NOTE</option>
                  </select>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Party Type</label>
                  <select
                    style={S.select}
                    value={formData.party_type}
                    onChange={(e) => setFormData({ ...formData, party_type: e.target.value as any })}
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="VENDOR">VENDOR</option>
                  </select>
                </div>
              </div>

              <div style={{ ...S.formGroup, marginTop: "1rem" }}>
                <label style={S.label}>Party Name *</label>
                <input
                  style={S.input}
                  required
                  placeholder="Party Name"
                  value={formData.party_name}
                  onChange={(e) => setFormData({ ...formData, party_name: e.target.value })}
                />
              </div>

              <div style={{ ...S.formGrid, marginTop: "1rem" }}>
                <div style={S.formGroup}>
                  <label style={S.label}>Amount (PKR) *</label>
                  <input
                    style={S.input}
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Date</label>
                  <input
                    style={S.input}
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
              
              <div style={{ ...S.formGroup, marginTop: "1rem" }}>
                <label style={S.label}>Related Invoice/Bill</label>
                <input
                  style={S.input}
                  placeholder="Reference Doc"
                  value={formData.reference_doc}
                  onChange={(e) => setFormData({ ...formData, reference_doc: e.target.value })}
                />
              </div>

              <div style={{ ...S.formGroup, marginTop: "1rem" }}>
                <label style={S.label}>Reason *</label>
                <input
                  style={S.input}
                  required
                  placeholder="Reason for adjustment"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>

              <div style={{ ...S.formGroup, marginTop: "1rem" }}>
                <label style={S.label}>Notes</label>
                <textarea
                  style={S.textarea}
                  placeholder="Additional notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={S.modalFooter}>
                <button
                  type="button"
                  style={S.btnSecondary}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" style={S.btnPrimary}>
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from "react";
import {
  fetchPeriodClosingsApi,
  closePeriodApi,
} from "../services/accounts.service";
import { S } from "../utils/styles";

export const PeriodClosingPage: React.FC = () => {
  const [closings, setClosings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    period_name: `Period ${new Date().getMonth() + 1} - ${new Date().getFullYear()}`,
    start_date: "",
    end_date: "",
    notes: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const cRes = await fetchPeriodClosingsApi();
      if (cRes.success) setClosings(cRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClosePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await closePeriodApi(formData);
      setFormData({
        period_name: "",
        start_date: "",
        end_date: "",
        notes: "",
      });
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const statusColor = (status: string): "green" | "red" | "blue" | "gold" | "purple" | "gray" => {
    const s = status?.toUpperCase();
    if (s === "OPEN") return "green";
    if (s === "CLOSED") return "gold";
    if (s === "LOCKED") return "red";
    return "gray";
  };

  return (
    <div style={S.page}>
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Period Closing & Financial Controls</h1>
          <p style={S.subtitle}>
            Financial controls, period locking & complete immutable audit trail of posted transactions.
          </p>
        </div>
      </div>

      <div style={{ padding: "1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: "8px", color: "#dc2626", fontWeight: 600, fontSize: "0.85rem" }}>
        ⚠️ Warning: Closed or locked periods are strictly immutable. No transactions can be posted, modified, or deleted within a locked period to ensure financial integrity.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem", alignItems: "flex-start" }}>
        {/* Left Column */}
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Period Name</th>
                <th style={S.th}>Start</th>
                <th style={S.th}>End</th>
                <th style={S.th}>Closed By</th>
                <th style={S.th}>Closed At</th>
                <th style={S.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {closings.length === 0 ? (
                <tr>
                  <td colSpan={6} style={S.emptyRow}>No closed periods found.</td>
                </tr>
              ) : (
                closings.map((c) => (
                  <tr key={c.id}>
                    <td style={S.td}><strong>{c.period_name}</strong></td>
                    <td style={S.td}>{c.start_date || "-"}</td>
                    <td style={S.td}>{c.end_date || "-"}</td>
                    <td style={S.td}>{c.closed_by || "-"}</td>
                    <td style={S.td}>{c.closed_at ? new Date(c.closed_at).toLocaleDateString() : "-"}</td>
                    <td style={S.td}>
                      <span style={S.tag(statusColor(c.status || "LOCKED"))}>
                        {(c.status || "LOCKED").toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Right Column */}
        <div style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "14px", padding: "1.5rem", boxShadow: "var(--shadow-card)" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-dark)", marginBottom: "1.5rem" }}>Close Accounting Period</h2>
          <form onSubmit={handleClosePeriod} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={S.formGroup}>
              <label style={S.label}>Period Name *</label>
              <input
                type="text"
                required
                style={S.input}
                value={formData.period_name}
                onChange={(e) => setFormData({ ...formData, period_name: e.target.value })}
              />
            </div>
            <div style={S.formGrid}>
              <div style={S.formGroup}>
                <label style={S.label}>Start Date</label>
                <input
                  type="date"
                  style={S.input}
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>End Date</label>
                <input
                  type="date"
                  style={S.input}
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Notes</label>
              <textarea
                style={S.textarea}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            <button type="submit" style={{ ...S.btnPrimary, marginTop: "0.5rem", justifyContent: "center" }}>
              🔒 Close Period
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

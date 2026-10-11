import React, { useState, useEffect } from "react";
import {
  fetchVoucherTemplatesApi,
  deleteVoucherTemplateApi,
  type VoucherTemplateItem,
} from "../services/accounts.service";
import { S, pkr } from "../utils/styles";
import { useNavigate } from "react-router-dom";

export const VoucherTemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<VoucherTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchVoucherTemplatesApi();
      if (res.success) setTemplates(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this template?")) return;
    setDeletingId(id);
    try {
      await deleteVoucherTemplateApi(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const typeColor = (type: string): "blue" | "gold" | "gray" | "green" | "purple" | "red" => {
    const map: Record<string, "blue" | "gold" | "gray" | "green" | "purple" | "red"> = { GJV: "blue", CPV: "red", CRV: "green", BPV: "gold", BRV: "purple" };
    return map[type] || "blue";
  };

  return (
    <div style={S.page}>
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Voucher Templates</h1>
          <p style={S.subtitle}>Saved voucher templates for fast recurring entry</p>
        </div>
        <button style={S.btnPrimary} onClick={() => navigate("/accounts/vouchers")}>
          + New Voucher
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-dark-sub)" }}>Loading templates...</div>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>#</th>
                <th style={S.th}>Template Name</th>
                <th style={S.th}>Voucher Type</th>
                <th style={S.th}>Narration</th>
                <th style={S.th}>Lines</th>
                <th style={S.th}>Created</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 && (
                <tr><td colSpan={7} style={S.emptyRow}>No templates saved. Create a voucher and save it as a template.</td></tr>
              )}
              {templates.map((t, idx) => (
                <tr key={t.id}>
                  <td style={{ ...S.td, ...S.mono }}>{idx + 1}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{t.name}</td>
                  <td style={S.td}><span style={S.tag(typeColor(t.voucher_type))}>{t.voucher_type}</span></td>
                  <td style={S.td}>{t.narration || "—"}</td>
                  <td style={S.tdCenter}>
                    <span style={S.tag("blue")}>{(t.lines as any[])?.length || 0} lines</span>
                  </td>
                  <td style={S.td}>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td style={S.td}>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button style={S.btnPrimary} onClick={() => navigate(`/accounts/vouchers?template=${t.id}`)}>
                        Use
                      </button>
                      <button
                        style={{ ...S.btnSecondary, borderColor: "#ef4444", color: "#ef4444" }}
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId === t.id}
                      >
                        {deletingId === t.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state card */}
      {!loading && templates.length === 0 && (
        <div style={{
          marginTop: "2rem", padding: "2.5rem", background: "var(--card-bg)",
          border: "2px dashed var(--card-border)", borderRadius: "1rem", textAlign: "center",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📋</div>
          <h3 style={{ color: "var(--text-dark-main)", marginBottom: "0.5rem" }}>No Templates Yet</h3>
          <p style={{ color: "var(--text-dark-sub)", marginBottom: "1.5rem" }}>
            Open the Voucher Entry screen, fill in your recurring entries, and click "Save as Template".
          </p>
          <button style={S.btnPrimary} onClick={() => navigate("/accounts/vouchers")}>
            Go to Voucher Entry
          </button>
        </div>
      )}
    </div>
  );
};

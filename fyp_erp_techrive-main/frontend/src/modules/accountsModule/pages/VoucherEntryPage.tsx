import React, { useState, useEffect, useRef } from "react";
import {
  fetchChartOfAccounts,
  createVoucherApi,
  postVoucherApi,
  createVoucherTemplateApi,
  fetchVoucherTemplatesApi,
  getVoucherTemplateForUseApi,
  fetchVouchersApi,
  type AccountItem,
} from "../services/accounts.service";
import { S, pkr, statusColor } from "../utils/styles";

const VOUCHER_TYPES = [
  { key: "GJV", label: "General Journal (GJV)" },
  { key: "CPV", label: "Cash Payment (CPV)" },
  { key: "CRV", label: "Cash Receipt (CRV)" },
  { key: "BPV", label: "Bank Payment (BPV)" },
  { key: "BRV", label: "Bank Receipt (BRV)" },
];

interface VoucherLine {
  account_id: number;
  account_name: string;
  account_code: string;
  debit: string;
  credit: string;
  description: string;
}

const emptyLine = (): VoucherLine => ({
  account_id: 0,
  account_name: "",
  account_code: "",
  debit: "",
  credit: "",
  description: "",
});

export const VoucherEntryPage: React.FC = () => {
  const [voucherType, setVoucherType] = useState("GJV");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [reference, setReference] = useState("");
  const [narration, setNarration] = useState("");
  const [instrumentNo, setInstrumentNo] = useState("");
  const [financialYear, setFinancialYear] = useState(String(new Date().getFullYear()));
  const [lines, setLines] = useState<VoucherLine[]>([emptyLine(), emptyLine()]);

  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [searchMap, setSearchMap] = useState<Record<number, string>>({});
  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01;

  useEffect(() => {
    fetchChartOfAccounts().then((r) => r.success && setAccounts(r.data));
    fetchVouchersApi().then((r) => r.success && setVouchers(r.data));
    fetchVoucherTemplatesApi().then((r) => r.success && setTemplates(r.data));
  }, []);

  const filteredAccounts = (search: string) =>
    accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.code.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 10);

  const updateLine = (index: number, field: keyof VoucherLine, value: string) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  };

  const selectAccount = (index: number, acc: AccountItem) => {
    setLines((prev) =>
      prev.map((l, i) =>
        i === index
          ? { ...l, account_id: acc.id, account_name: acc.name, account_code: acc.code }
          : l
      )
    );
    setDropdownOpen(null);
    setSearchMap((prev) => ({ ...prev, [index]: "" }));
  };

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (i: number) => {
    if (lines.length <= 2) return;
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSaveDraft = async () => {
    setErrorMsg("");
    if (!isBalanced) { setErrorMsg(`Voucher is not balanced. Difference: PKR ${difference.toFixed(2)}`); return; }
    setSaving(true);
    try {
      const payload = {
        voucher_type: voucherType,
        date, reference, narration, instrument_no: instrumentNo, financial_year: financialYear,
        lines: lines.filter((l) => l.account_id > 0).map((l) => ({
          account_id: l.account_id,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          description: l.description,
        })),
      };
      const res = await createVoucherApi(payload);
      if (res.success) {
        setSuccessMsg(`Voucher ${res.data.journal_number} saved as Draft!`);
        fetchVouchersApi().then((r) => r.success && setVouchers(r.data));
        resetForm();
      }
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || e.message);
    } finally { setSaving(false); }
  };

  const handlePost = async () => {
    setErrorMsg("");
    if (!isBalanced) { setErrorMsg(`Cannot post: Difference = PKR ${difference.toFixed(2)}`); return; }
    setPosting(true);
    try {
      const payload = {
        voucher_type: voucherType,
        date, reference, narration, instrument_no: instrumentNo, financial_year: financialYear,
        lines: lines.filter((l) => l.account_id > 0).map((l) => ({
          account_id: l.account_id,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          description: l.description,
        })),
      };
      const created = await createVoucherApi(payload);
      if (created.success) {
        const posted = await postVoucherApi(created.data.id);
        if (posted.success) {
          setSuccessMsg(`Voucher ${created.data.journal_number} POSTED successfully!`);
          fetchVouchersApi().then((r) => r.success && setVouchers(r.data));
          resetForm();
        }
      }
    } catch (e: any) {
      setErrorMsg(e.response?.data?.message || e.message);
    } finally { setPosting(false); }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    try {
      await createVoucherTemplateApi({
        name: templateName,
        voucher_type: voucherType,
        narration,
        lines: lines.filter((l) => l.account_id > 0).map((l) => ({
          account_id: l.account_id, debit: parseFloat(l.debit) || 0, credit: parseFloat(l.credit) || 0, description: l.description,
        })),
      });
      setShowSaveTemplateModal(false);
      setTemplateName("");
      fetchVoucherTemplatesApi().then((r) => r.success && setTemplates(r.data));
      setSuccessMsg("Template saved!");
    } catch (e: any) { setErrorMsg(e.message); }
  };

  const loadTemplate = async (id: number) => {
    try {
      const res = await getVoucherTemplateForUseApi(id);
      if (res.success) {
        const t = res.data;
        setVoucherType(t.voucher_type);
        setNarration(t.narration || "");
        setLines(t.lines.map((l: any) => ({
          account_id: l.account_id,
          account_name: l.account?.name || "",
          account_code: l.account?.code || "",
          debit: String(l.debit || ""),
          credit: String(l.credit || ""),
          description: l.description || "",
        })));
        setShowTemplateModal(false);
        setSuccessMsg("Template loaded!");
      }
    } catch (e: any) { setErrorMsg(e.message); }
  };

  const resetForm = () => {
    setLines([emptyLine(), emptyLine()]);
    setReference(""); setNarration(""); setInstrumentNo("");
  };

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Universal Voucher Entry</h1>
          <p style={S.subtitle}>Double-entry bookkeeping — GJV, CPV, CRV, BPV, BRV</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button style={S.btnSecondary} onClick={() => setShowTemplateModal(true)}>Load Template</button>
          <button style={S.btnSecondary} onClick={() => setShowSaveTemplateModal(true)}>Save as Template</button>
        </div>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div style={{ padding: "0.75rem 1rem", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "0.5rem", color: "#22c55e", marginBottom: "1rem" }}>
          ✓ {successMsg} <button onClick={() => setSuccessMsg("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", float: "right" }}>×</button>
        </div>
      )}
      {errorMsg && (
        <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.5rem", color: "#ef4444", marginBottom: "1rem" }}>
          ⚠ {errorMsg} <button onClick={() => setErrorMsg("")} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", float: "right" }}>×</button>
        </div>
      )}

      {/* Voucher Header Form */}
      <div style={{ ...S.modal, marginBottom: "1.5rem", display: "block" }}>
        {/* Type switcher */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          {VOUCHER_TYPES.map((vt) => (
            <button key={vt.key} style={voucherType === vt.key ? S.btnPrimary : S.btnSecondary} onClick={() => setVoucherType(vt.key)}>
              {vt.key}
            </button>
          ))}
          <span style={{ ...S.tag("blue"), display: "flex", alignItems: "center", marginLeft: "auto" }}>
            {VOUCHER_TYPES.find((v) => v.key === voucherType)?.label}
          </span>
        </div>

        {/* Header fields */}
        <div style={S.formGrid}>
          <div style={S.formGroup}>
            <label style={S.label}>Voucher Date *</label>
            <input type="date" style={S.input} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Reference #</label>
            <input type="text" style={S.input} value={reference} onChange={(e) => setReference(e.target.value)} placeholder="PO-2026-001" />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Instrument / Cheque #</label>
            <input type="text" style={S.input} value={instrumentNo} onChange={(e) => setInstrumentNo(e.target.value)} placeholder="CHQ-00123" />
          </div>
          <div style={S.formGroup}>
            <label style={S.label}>Financial Year</label>
            <input type="text" style={S.input} value={financialYear} onChange={(e) => setFinancialYear(e.target.value)} placeholder="2026" />
          </div>
          <div style={{ ...S.formGroup, gridColumn: "1 / -1" }}>
            <label style={S.label}>Narration</label>
            <textarea style={{ ...S.input, minHeight: "60px", resize: "vertical" }} value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="Being payment of..." />
          </div>
        </div>
      </div>

      {/* Line Items Grid */}
      <div style={S.tableWrap}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", borderBottom: "1px solid var(--divider-color)" }}>
          <span style={{ fontWeight: 600, color: "var(--text-dark-main)", fontSize: "0.875rem" }}>Voucher Lines</span>
          <button style={S.btnSecondary} onClick={addLine}>+ Add Line</button>
        </div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width: "35%" }}>Account</th>
              <th style={S.th}>Narration</th>
              <th style={{ ...S.thRight, width: "150px" }}>Debit (PKR)</th>
              <th style={{ ...S.thRight, width: "150px" }}>Credit (PKR)</th>
              <th style={{ ...S.th, width: "40px" }}></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx}>
                {/* Account autocomplete */}
                <td style={S.td}>
                  <div style={{ position: "relative" }}>
                    <input
                      style={{ ...S.input, fontSize: "0.8rem" }}
                      placeholder="Search account..."
                      value={line.account_id > 0 ? `[${line.account_code}] ${line.account_name}` : (searchMap[idx] || "")}
                      onChange={(e) => {
                        if (line.account_id > 0) {
                          setLines((prev) => prev.map((l, i) => i === idx ? { ...l, account_id: 0, account_name: "", account_code: "" } : l));
                        }
                        setSearchMap((prev) => ({ ...prev, [idx]: e.target.value }));
                        setDropdownOpen(idx);
                      }}
                      onFocus={() => setDropdownOpen(idx)}
                    />
                    {dropdownOpen === idx && (searchMap[idx] || "").length > 0 && (
                      <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 100, background: "var(--card-bg)", border: "1px solid var(--card-border)", borderRadius: "0.375rem", maxHeight: "200px", overflowY: "auto" }}>
                        {filteredAccounts(searchMap[idx] || "").map((acc) => (
                          <div key={acc.id} onClick={() => selectAccount(idx, acc)}
                            style={{ padding: "0.5rem 0.75rem", cursor: "pointer", borderBottom: "1px solid var(--divider-color)", fontSize: "0.8rem" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--input-bg)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <span style={S.mono}>{acc.code}</span> — {acc.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td style={S.td}>
                  <input style={{ ...S.input, fontSize: "0.8rem" }} placeholder="Line narration..." value={line.description}
                    onChange={(e) => updateLine(idx, "description", e.target.value)} />
                </td>
                <td style={S.tdRight}>
                  <input type="number" style={{ ...S.input, textAlign: "right", fontSize: "0.8rem" }} placeholder="0.00"
                    value={line.debit} onChange={(e) => updateLine(idx, "debit", e.target.value)} min={0} />
                </td>
                <td style={S.tdRight}>
                  <input type="number" style={{ ...S.input, textAlign: "right", fontSize: "0.8rem" }} placeholder="0.00"
                    value={line.credit} onChange={(e) => updateLine(idx, "credit", e.target.value)} min={0} />
                </td>
                <td style={S.tdCenter}>
                  <button onClick={() => removeLine(idx)} style={{ background: "none", border: "none", color: "var(--text-dark-sub)", cursor: "pointer", fontSize: "1rem" }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sticky Live Balance Box */}
      <div style={{
        position: "sticky", bottom: "1rem", marginTop: "1rem",
        background: "var(--card-bg)", border: `2px solid ${isBalanced ? "var(--accent)" : "#ef4444"}`,
        borderRadius: "0.75rem", padding: "1rem 1.5rem",
        display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap",
        boxShadow: isBalanced ? "0 0 20px rgba(16,185,129,0.15)" : "0 0 20px rgba(239,68,68,0.15)",
        zIndex: 10,
      }}>
        <div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dark-sub)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Debit</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "monospace", color: "var(--accent)" }}>{pkr(totalDebit)}</div>
        </div>
        <div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dark-sub)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Credit</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, fontFamily: "monospace", color: "var(--accent)" }}>{pkr(totalCredit)}</div>
        </div>
        <div>
          <div style={{ fontSize: "0.7rem", color: "var(--text-dark-sub)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Difference</div>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, fontFamily: "monospace", color: isBalanced ? "#22c55e" : "#ef4444" }}>
            {isBalanced ? "✓ Balanced" : pkr(difference)}
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "0.75rem" }}>
          <button style={S.btnSecondary} onClick={handleSaveDraft} disabled={saving}>
            {saving ? "Saving..." : "Save as Draft"}
          </button>
          <button style={{ ...S.btnPrimary, opacity: isBalanced ? 1 : 0.5 }} onClick={handlePost} disabled={posting || !isBalanced}>
            {posting ? "Posting..." : "Post Voucher"}
          </button>
        </div>
      </div>

      {/* Recent Vouchers Table */}
      <div style={{ marginTop: "2rem" }}>
        <h2 style={{ ...S.h1, fontSize: "1rem", marginBottom: "1rem" }}>Recent Vouchers</h2>
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Voucher #</th>
                <th style={S.th}>Type</th>
                <th style={S.th}>Date</th>
                <th style={S.th}>Narration</th>
                <th style={S.thRight}>Debit</th>
                <th style={S.thRight}>Credit</th>
                <th style={S.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.length === 0 && (
                <tr><td colSpan={7} style={S.emptyRow}>No vouchers yet. Create your first one above.</td></tr>
              )}
              {vouchers.slice(0, 20).map((v: any) => (
                <tr key={v.id}>
                  <td style={{ ...S.td, ...S.mono }}>{v.journal_number}</td>
                  <td style={S.td}><span style={S.tag("blue")}>{v.voucher_type || v.journal_type}</span></td>
                  <td style={S.td}>{new Date(v.date).toLocaleDateString()}</td>
                  <td style={S.td}>{v.narration || v.description || "—"}</td>
                  <td style={S.tdRight}>{pkr(v.total_debit)}</td>
                  <td style={S.tdRight}>{pkr(v.total_credit)}</td>
                  <td style={S.td}><span style={S.tag(statusColor(v.status))}>{v.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Load Template Modal */}
      {showTemplateModal && (
        <div style={S.modalOverlay} onClick={() => setShowTemplateModal(false)}>
          <div style={{ ...S.modal, maxWidth: "500px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ ...S.h1, fontSize: "1rem", marginBottom: "1rem" }}>Load Voucher Template</h2>
            {templates.length === 0 ? (
              <p style={{ color: "var(--text-dark-sub)" }}>No templates saved yet.</p>
            ) : (
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead><tr><th style={S.th}>Name</th><th style={S.th}>Type</th><th style={S.th}>Lines</th><th style={S.th}></th></tr></thead>
                  <tbody>
                    {templates.map((t: any) => (
                      <tr key={t.id}>
                        <td style={S.td}>{t.name}</td>
                        <td style={S.td}><span style={S.tag("blue")}>{t.voucher_type}</span></td>
                        <td style={S.td}>{(t.lines as any[])?.length || 0} lines</td>
                        <td style={S.td}><button style={S.btnPrimary} onClick={() => loadTemplate(t.id)}>Use</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={S.modalFooter}>
              <button style={S.btnSecondary} onClick={() => setShowTemplateModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Save Template Modal */}
      {showSaveTemplateModal && (
        <div style={S.modalOverlay} onClick={() => setShowSaveTemplateModal(false)}>
          <div style={{ ...S.modal, maxWidth: "400px", width: "90%" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ ...S.h1, fontSize: "1rem", marginBottom: "1rem" }}>Save as Template</h2>
            <div style={S.formGroup}>
              <label style={S.label}>Template Name *</label>
              <input type="text" style={S.input} value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="e.g. Monthly Rent Payment" />
            </div>
            <div style={S.modalFooter}>
              <button style={S.btnSecondary} onClick={() => setShowSaveTemplateModal(false)}>Cancel</button>
              <button style={S.btnPrimary} onClick={handleSaveTemplate}>Save Template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

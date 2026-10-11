import React, { useState, useEffect } from "react";
import { fetchVendorsApi, fetchVendorLedgerApi, type VendorItem } from "../services/accounts.service";
import { S, pkr } from "../utils/styles";

export const VendorLedgerPage: React.FC = () => {
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<number>(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVendorsApi().then((r) => r.success && setVendors(r.data));
  }, []);

  const handleGenerate = async () => {
    if (!selectedVendor) return;
    setLoading(true);
    setStatement(null);
    try {
      const res = await fetchVendorLedgerApi(selectedVendor, startDate || undefined, endDate || undefined);
      if (res.success) setStatement(res.data);
    } finally {
      setLoading(false);
    }
  };

  const vendor = statement?.vendor;

  return (
    <div style={S.page}>
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Vendor Ledger Statement</h1>
          <p style={S.subtitle}>Vendor-wise transaction history and outstanding balance</p>
        </div>
        {statement && (
          <button style={S.btnSecondary} onClick={() => window.print()}>🖨 Print</button>
        )}
      </div>

      {/* Filter Bar */}
      <div style={S.filterBar}>
        <select style={S.select} value={selectedVendor} onChange={(e) => setSelectedVendor(Number(e.target.value))}>
          <option value={0}>-- Select Vendor --</option>
          {vendors.map((v) => (
            <option key={v.id} value={v.id}>[{v.vendor_code}] {v.name}</option>
          ))}
        </select>
        <input type="date" style={S.input} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <span style={{ color: "var(--text-dark-sub)" }}>to</span>
        <input type="date" style={S.input} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button style={S.btnPrimary} onClick={handleGenerate} disabled={!selectedVendor || loading}>
          {loading ? "Loading..." : "Generate Statement"}
        </button>
        <button style={S.btnSecondary} onClick={() => { setStatement(null); setSelectedVendor(0); setStartDate(""); setEndDate(""); }}>
          Reset
        </button>
      </div>

      {!statement && !loading && (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-dark-sub)" }}>
          Select a vendor and click Generate Statement to view their ledger.
        </div>
      )}

      {loading && (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-dark-sub)" }}>Computing vendor ledger...</div>
      )}

      {statement && (
        <>
          {/* Vendor Info Card */}
          <div style={{ ...S.modal, marginBottom: "1.5rem", display: "block" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1.5rem" }}>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-dark-sub)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Vendor</div>
                <div style={{ fontWeight: 700, color: "var(--text-dark-main)" }}>{vendor?.name}</div>
                <div style={{ ...S.mono, fontSize: "0.75rem", color: "var(--accent)" }}>{vendor?.vendor_code}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-dark-sub)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Contact</div>
                <div style={{ color: "var(--text-dark-main)", fontSize: "0.875rem" }}>{vendor?.email || "—"}</div>
                <div style={{ color: "var(--text-dark-sub)", fontSize: "0.8rem" }}>{vendor?.phone || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-dark-sub)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Total Debits</div>
                <div style={{ ...S.mono, fontWeight: 800, fontSize: "1.2rem", color: "#ef4444" }}>{pkr(statement.total_debit)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-dark-sub)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Total Credits (Bills)</div>
                <div style={{ ...S.mono, fontWeight: 800, fontSize: "1.2rem", color: "var(--accent)" }}>{pkr(statement.total_credit)}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-dark-sub)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>Net Outstanding</div>
                <div style={{
                  ...S.mono, fontWeight: 800, fontSize: "1.2rem",
                  color: statement.closing_balance > 0 ? "#ef4444" : "#22c55e",
                }}>
                  {pkr(Math.abs(statement.closing_balance))}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-dark-sub)" }}>
                  {statement.closing_balance > 0 ? "Payable (Cr)" : "Advance (Dr)"}
                </div>
              </div>
            </div>
          </div>

          {/* Transaction Table */}
          <div style={S.tableWrap}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--divider-color)", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 600, color: "var(--text-dark-main)", fontSize: "0.875rem" }}>Transaction History</span>
              <span style={S.tag("blue")}>{statement.entries?.length || 0} entries</span>
            </div>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Date</th>
                  <th style={S.th}>Voucher #</th>
                  <th style={S.th}>Type</th>
                  <th style={S.th}>Account</th>
                  <th style={S.th}>Description</th>
                  <th style={S.th}>Reference</th>
                  <th style={S.thRight}>Debit</th>
                  <th style={S.thRight}>Credit</th>
                  <th style={S.thRight}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {statement.entries?.length === 0 && (
                  <tr>
                    <td colSpan={9} style={S.emptyRow}>
                      No posted transactions found for this vendor in the selected period.
                    </td>
                  </tr>
                )}
                {statement.entries?.map((entry: any, idx: number) => (
                  <tr key={idx}>
                    <td style={S.td}>{new Date(entry.date).toLocaleDateString()}</td>
                    <td style={{ ...S.td, ...S.mono, color: "var(--accent)" }}>{entry.voucher_number}</td>
                    <td style={S.td}><span style={S.tag("blue")}>{entry.voucher_type || "JV"}</span></td>
                    <td style={S.td}>{entry.account_name}</td>
                    <td style={S.td}>{entry.description || "—"}</td>
                    <td style={S.td}>{entry.reference || "—"}</td>
                    <td style={S.tdRight}>{entry.debit > 0 ? pkr(entry.debit) : "—"}</td>
                    <td style={S.tdRight}>{entry.credit > 0 ? pkr(entry.credit) : "—"}</td>
                    <td style={{
                      ...S.tdRight, fontWeight: 700,
                      color: entry.running_balance > 0 ? "#ef4444" : "#22c55e",
                    }}>
                      {pkr(Math.abs(entry.running_balance))}
                      <span style={{ fontSize: "0.65rem", marginLeft: "0.2rem" }}>
                        {entry.running_balance > 0 ? "Cr" : "Dr"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

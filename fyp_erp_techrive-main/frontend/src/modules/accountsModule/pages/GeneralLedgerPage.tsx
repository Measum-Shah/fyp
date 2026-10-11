import React, { useEffect, useState } from "react";
import {
  fetchChartOfAccounts,
  fetchGeneralLedgerApi,
  type AccountItem,
} from "../services/accounts.service";
import { S, pkr } from "../utils/styles";

export const GeneralLedgerPage: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number>(0);
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    fetchChartOfAccounts().then((res) => {
      if (res.success && res.data.length > 0) {
        setAccounts(res.data);
        setSelectedAccountId(res.data[0].id);
      }
    });
  }, []);

  const loadLedger = async () => {
    if (!selectedAccountId) return;
    try {
      setLoading(true);
      const res = await fetchGeneralLedgerApi(selectedAccountId, startDate, endDate);
      if (res.success) setLedgerData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAccountId) loadLedger();
  }, [selectedAccountId]);

  const totalDebits = ledgerData?.entries?.reduce((sum: number, e: any) => sum + (e.debit || 0), 0) || 0;
  const totalCredits = ledgerData?.entries?.reduce((sum: number, e: any) => sum + (e.credit || 0), 0) || 0;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>General Ledger</h1>
          <p style={S.subtitle}>
            Drill into account transaction history with cumulative running balance calculations.
          </p>
        </div>
      </div>

      {/* Account Selector & Date Filter */}
      <div style={S.filterBar}>
        <div style={S.formGroup}>
          <label style={S.label}>Select GL Account</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(Number(e.target.value))}
            style={S.select}
          >
            <option value={0}>-- Select Account --</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                [{a.code}] {a.name} ({a.type})
              </option>
            ))}
          </select>
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={S.input}
          />
        </div>

        <div style={S.formGroup}>
          <label style={S.label}>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={S.input}
          />
        </div>
        
        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "0.15rem" }}>
          <button onClick={loadLedger} style={S.btnPrimary}>
            Filter
          </button>
        </div>
      </div>

      {/* Account Header Summary */}
      {ledgerData && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
          <div style={{ ...S.pageHeader, padding: "1rem 1.5rem", flexDirection: "column", gap: "0.5rem" }}>
            <p style={S.label}>Opening Balance</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-dark)", fontFamily: "monospace" }}>
              {pkr(ledgerData.opening_balance)}
            </p>
          </div>
          <div style={{ ...S.pageHeader, padding: "1rem 1.5rem", flexDirection: "column", gap: "0.5rem" }}>
            <p style={S.label}>Total Debits</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#16a34a", fontFamily: "monospace" }}>
              {pkr(totalDebits)}
            </p>
          </div>
          <div style={{ ...S.pageHeader, padding: "1rem 1.5rem", flexDirection: "column", gap: "0.5rem" }}>
            <p style={S.label}>Total Credits</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "#dc2626", fontFamily: "monospace" }}>
              {pkr(totalCredits)}
            </p>
          </div>
          <div style={{ ...S.pageHeader, padding: "1rem 1.5rem", flexDirection: "column", gap: "0.5rem" }}>
            <p style={S.label}>Closing Balance</p>
            <p style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent)", fontFamily: "monospace" }}>
              {pkr(ledgerData.current_balance)}
            </p>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div style={S.tableWrap}>
        {loading ? (
          <div style={S.emptyRow}>Loading ledger data...</div>
        ) : !ledgerData ? (
          <div style={S.emptyRow}>Select an account to view statement</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Date</th>
                <th style={S.th}>Voucher #</th>
                <th style={S.th}>Description</th>
                <th style={S.th}>Source</th>
                <th style={S.th}>Reference</th>
                <th style={S.thRight}>Debit</th>
                <th style={S.thRight}>Credit</th>
                <th style={S.thRight}>Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {(!ledgerData.entries || ledgerData.entries.length === 0) ? (
                <tr>
                  <td colSpan={8} style={S.emptyRow}>
                    No posted ledger movements found for this account.
                  </td>
                </tr>
              ) : (
                ledgerData.entries.map((entry: any) => (
                  <tr key={entry.id}>
                    <td style={S.td}>{new Date(entry.date).toLocaleDateString()}</td>
                    <td style={S.td}>
                      <span style={S.mono}>{entry.journal_number || entry.voucher_number || "N/A"}</span>
                    </td>
                    <td style={S.td}>{entry.description || "N/A"}</td>
                    <td style={S.td}>{entry.source || "N/A"}</td>
                    <td style={S.td}>{entry.reference || "N/A"}</td>
                    <td style={S.tdRight}>
                      {entry.debit > 0 ? pkr(entry.debit) : "-"}
                    </td>
                    <td style={S.tdRight}>
                      {entry.credit > 0 ? pkr(entry.credit) : "-"}
                    </td>
                    <td style={{ ...S.tdRight, color: entry.running_balance >= 0 ? "#16a34a" : "#dc2626" }}>
                      {pkr(entry.running_balance)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

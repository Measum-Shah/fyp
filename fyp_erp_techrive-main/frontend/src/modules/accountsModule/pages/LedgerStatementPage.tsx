import React, { useState, useEffect } from "react";
import { fetchChartOfAccounts, fetchLedgerStatementApi, type AccountItem } from "../services/accounts.service";
import { S, pkr } from "../utils/styles";

export const LedgerStatementPage: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number>(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChartOfAccounts().then((r) => r.success && setAccounts(r.data));
  }, []);

  const handleGenerate = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    setStatement(null);
    try {
      const res = await fetchLedgerStatementApi(selectedAccount, startDate || undefined, endDate || undefined);
      if (res.success) setStatement(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  const account = statement?.account;

  return (
    <div style={S.page}>
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Ledger Statement</h1>
          <p style={S.subtitle}>Account transaction history with running balance</p>
        </div>
        {statement && (
          <button style={S.btnSecondary} onClick={handlePrint}>🖨 Print</button>
        )}
      </div>

      {/* Filter Bar */}
      <div style={S.filterBar}>
        <select style={S.select} value={selectedAccount} onChange={(e) => setSelectedAccount(Number(e.target.value))}>
          <option value={0}>-- Select Account --</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>[{a.code}] {a.name}</option>
          ))}
        </select>
        <input type="date" style={S.input} value={startDate} onChange={(e) => setStartDate(e.target.value)} placeholder="From date" />
        <span style={{ color: "var(--text-dark-sub)" }}>to</span>
        <input type="date" style={S.input} value={endDate} onChange={(e) => setEndDate(e.target.value)} placeholder="To date" />
        <button style={S.btnPrimary} onClick={handleGenerate} disabled={!selectedAccount || loading}>
          {loading ? "Loading..." : "Generate Statement"}
        </button>
        {statement && (
          <button style={S.btnSecondary} onClick={() => { setStatement(null); setSelectedAccount(0); setStartDate(""); setEndDate(""); }}>
            Reset
          </button>
        )}
      </div>

      {!statement && !loading && (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-dark-sub)" }}>
          Select an account and click Generate Statement.
        </div>
      )}

      {loading && (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-dark-sub)" }}>
          Computing ledger statement...
        </div>
      )}

      {statement && (
        <>
          {/* Account Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div className="stat-card">
              <div className="stat-header"><span>Account</span></div>
              <div style={{ fontWeight: 700, color: "var(--text-dark-main)", fontSize: "0.9rem" }}>
                {account?.name}
              </div>
              <div style={{ ...S.mono, fontSize: "0.75rem", color: "var(--accent)" }}>{account?.code}</div>
            </div>
            <div className="stat-card">
              <div className="stat-header"><span>Opening Balance</span></div>
              <div className="stat-value">{pkr(statement.opening_balance)}</div>
              <div className="stat-label">{startDate || "All time"}</div>
            </div>
            <div className="stat-card">
              <div className="stat-header"><span>Total Debits</span></div>
              <div style={{ ...S.mono, fontSize: "1.4rem", fontWeight: 800, color: "var(--accent)" }}>
                {pkr(statement.total_debit)}
              </div>
              <div className="stat-label">{statement.entries?.length || 0} entries</div>
            </div>
            <div className="stat-card">
              <div className="stat-header"><span>Total Credits</span></div>
              <div style={{ ...S.mono, fontSize: "1.4rem", fontWeight: 800, color: "var(--accent)" }}>
                {pkr(statement.total_credit)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-header"><span>Closing Balance</span></div>
              <div style={{
                ...S.mono, fontSize: "1.4rem", fontWeight: 800,
                color: statement.closing_balance >= 0 ? "#22c55e" : "#ef4444",
              }}>
                {pkr(Math.abs(statement.closing_balance))}
              </div>
              <div className="stat-label">{statement.closing_balance >= 0 ? "Dr" : "Cr"}</div>
            </div>
          </div>

          {/* Transaction Table */}
          <div style={S.tableWrap}>
            <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--divider-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600, color: "var(--text-dark-main)", fontSize: "0.875rem" }}>
                Transaction History
              </span>
              <span style={S.tag("blue")}>{statement.entries?.length || 0} transactions</span>
            </div>

            {/* Opening balance row */}
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Date</th>
                  <th style={S.th}>Voucher #</th>
                  <th style={S.th}>Type</th>
                  <th style={S.th}>Description</th>
                  <th style={S.th}>Source</th>
                  <th style={S.th}>Reference</th>
                  <th style={S.thRight}>Debit</th>
                  <th style={S.thRight}>Credit</th>
                  <th style={S.thRight}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {/* Opening Balance row */}
                <tr style={{ background: "var(--input-bg)" }}>
                  <td style={S.td}>{startDate || "—"}</td>
                  <td style={{ ...S.td, ...S.mono }}>—</td>
                  <td style={S.td}>—</td>
                  <td style={{ ...S.td, fontWeight: 700, color: "var(--text-dark-main)" }}>Opening Balance</td>
                  <td style={S.td}>—</td>
                  <td style={S.td}>—</td>
                  <td style={S.tdRight}>—</td>
                  <td style={S.tdRight}>—</td>
                  <td style={{ ...S.tdRight, fontWeight: 700 }}>{pkr(statement.opening_balance)}</td>
                </tr>

                {statement.entries?.length === 0 && (
                  <tr><td colSpan={9} style={S.emptyRow}>No transactions in this period.</td></tr>
                )}

                {statement.entries?.map((entry: any, idx: number) => (
                  <tr key={idx}>
                    <td style={S.td}>{new Date(entry.date).toLocaleDateString()}</td>
                    <td style={{ ...S.td, ...S.mono, color: "var(--accent)" }}>{entry.voucher_number}</td>
                    <td style={S.td}><span style={S.tag("blue")}>{entry.voucher_type || "JV"}</span></td>
                    <td style={S.td}>{entry.description || "—"}</td>
                    <td style={S.td}>{entry.source || "MANUAL"}</td>
                    <td style={S.td}>{entry.reference || "—"}</td>
                    <td style={S.tdRight}>{entry.debit > 0 ? pkr(entry.debit) : "—"}</td>
                    <td style={S.tdRight}>{entry.credit > 0 ? pkr(entry.credit) : "—"}</td>
                    <td style={{
                      ...S.tdRight,
                      fontWeight: 700,
                      color: entry.running_balance >= 0 ? "#22c55e" : "#ef4444",
                    }}>
                      {pkr(Math.abs(entry.running_balance))}
                      <span style={{ fontSize: "0.65rem", marginLeft: "0.25rem" }}>
                        {entry.running_balance >= 0 ? "Dr" : "Cr"}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Closing Balance row */}
                <tr style={{ background: "var(--input-bg)", borderTop: "2px solid var(--divider-color)" }}>
                  <td style={S.td}>{endDate || "—"}</td>
                  <td colSpan={6} style={{ ...S.td, fontWeight: 800, textAlign: "right", color: "var(--text-dark-main)" }}>
                    Closing Balance
                  </td>
                  <td style={S.tdRight}>—</td>
                  <td style={{
                    ...S.tdRight, fontWeight: 800,
                    color: statement.closing_balance >= 0 ? "#22c55e" : "#ef4444",
                    fontSize: "1rem",
                  }}>
                    {pkr(Math.abs(statement.closing_balance))} {statement.closing_balance >= 0 ? "Dr" : "Cr"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

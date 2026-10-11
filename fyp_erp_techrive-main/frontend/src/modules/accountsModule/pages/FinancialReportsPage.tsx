import React, { useEffect, useState } from "react";
import {
  fetchTrialBalanceApi,
  fetchProfitLossApi,
  fetchBalanceSheetApi,
} from "../services/accounts.service";
import { S, typeColor, pkr } from "../utils/styles";

export const FinancialReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<"tb" | "pnl" | "bs">("tb");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter bar states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const loadReport = async () => {
    try {
      setLoading(true);
      setData(null);
      if (reportType === "tb") {
        const res = await fetchTrialBalanceApi();
        if (res.success) setData(res.data);
      } else if (reportType === "pnl") {
        const res = await fetchProfitLossApi();
        if (res.success) setData(res.data);
      } else if (reportType === "bs") {
        const res = await fetchBalanceSheetApi();
        if (res.success) setData(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType]);

  const handleGenerate = () => {
    loadReport();
  };

  const renderTB = () => {
    if (!data) return null;
    return (
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Account Code</th>
              <th style={S.th}>Account Name</th>
              <th style={S.th}>Type</th>
              <th style={S.thRight}>Total Debits</th>
              <th style={S.thRight}>Total Credits</th>
              <th style={S.thRight}>Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.rows?.map((row: any) => {
              const bal = Number(row.debit || 0) - Number(row.credit || 0);
              return (
                <tr key={row.id}>
                  <td style={S.td}>{row.code}</td>
                  <td style={S.td}>{row.name}</td>
                  <td style={S.td}>
                    <span style={S.tag(typeColor(row.type))}>{row.type}</span>
                  </td>
                  <td style={S.tdRight}>{pkr(row.debit)}</td>
                  <td style={S.tdRight}>{pkr(row.credit)}</td>
                  <td style={S.tdRight}>
                    {pkr(Math.abs(bal))} {bal > 0 ? "Dr" : bal < 0 ? "Cr" : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ ...S.td, fontWeight: 700, textAlign: "right" }}>
                Totals must Balance:
              </td>
              <td style={{ ...S.tdRight, color: data.isBalanced ? "var(--accent)" : "var(--error)" }}>
                {pkr(data.totalDebit)}
              </td>
              <td style={{ ...S.tdRight, color: data.isBalanced ? "var(--accent)" : "var(--error)" }}>
                {pkr(data.totalCredit)}
              </td>
              <td style={{ ...S.tdRight }}>
                <span style={S.tag(data.isBalanced ? "green" : "red")}>
                  {data.isBalanced ? "Balanced" : "Imbalanced"}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  const renderPnL = () => {
    if (!data) return null;

    const revenues = data.revenues || [];
    const allExpenses = data.expenses || [];
    const cogs = allExpenses.filter(
      (e: any) =>
        e.type === "COGS" ||
        e.name.toLowerCase().includes("cogs") ||
        e.name.toLowerCase().includes("cost of goods")
    );
    const opEx = allExpenses.filter((e: any) => !cogs.includes(e));

    const totalRevenue = data.totalRevenue || 0;
    const totalCogs = cogs.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);
    const grossProfit = totalRevenue - totalCogs;
    const totalOpEx = opEx.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);
    const operatingProfit = grossProfit - totalOpEx;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={S.tableWrap}>
          <table style={S.table}>
            <tbody>
              {/* Revenues */}
              <tr>
                <td colSpan={2} style={{ ...S.th, background: "var(--card-bg)" }}>
                  Revenue Accounts
                </td>
              </tr>
              {revenues.map((r: any) => (
                <tr key={r.id}>
                  <td style={S.td}>
                    [{r.code}] {r.name}
                  </td>
                  <td style={S.tdRight}>{pkr(r.amount)}</td>
                </tr>
              ))}
              <tr>
                <td style={{ ...S.td, fontWeight: 700 }}>Total Revenue</td>
                <td style={{ ...S.tdRight, color: "var(--accent)" }}>{pkr(totalRevenue)}</td>
              </tr>

              {/* COGS */}
              <tr>
                <td colSpan={2} style={{ ...S.th, background: "var(--card-bg)" }}>
                  Cost of Goods Sold (COGS)
                </td>
              </tr>
              {cogs.map((c: any) => (
                <tr key={c.id}>
                  <td style={S.td}>
                    [{c.code}] {c.name}
                  </td>
                  <td style={S.tdRight}>{pkr(c.amount)}</td>
                </tr>
              ))}
              <tr>
                <td style={{ ...S.td, fontWeight: 700 }}>Total COGS</td>
                <td style={{ ...S.tdRight, color: "var(--error)" }}>{pkr(totalCogs)}</td>
              </tr>

              {/* Gross Profit */}
              <tr style={{ background: "var(--input-bg)" }}>
                <td style={{ ...S.td, fontWeight: 800 }}>Gross Profit</td>
                <td style={{ ...S.tdRight, fontWeight: 800 }}>{pkr(grossProfit)}</td>
              </tr>

              {/* Operating Expenses */}
              <tr>
                <td colSpan={2} style={{ ...S.th, background: "var(--card-bg)" }}>
                  Operating Expenses
                </td>
              </tr>
              {opEx.map((e: any) => (
                <tr key={e.id}>
                  <td style={S.td}>
                    [{e.code}] {e.name}
                  </td>
                  <td style={S.tdRight}>{pkr(e.amount)}</td>
                </tr>
              ))}
              <tr>
                <td style={{ ...S.td, fontWeight: 700 }}>Total Operating Expenses</td>
                <td style={{ ...S.tdRight, color: "var(--error)" }}>{pkr(totalOpEx)}</td>
              </tr>

              {/* Operating Profit */}
              <tr style={{ background: "var(--input-bg)" }}>
                <td style={{ ...S.td, fontWeight: 800 }}>Operating Profit</td>
                <td style={{ ...S.tdRight, fontWeight: 800 }}>{pkr(operatingProfit)}</td>
              </tr>

              {/* Net Profit */}
              <tr>
                <td colSpan={2} style={{ ...S.th, background: "var(--card-bg)" }}>
                  Net Profit
                </td>
              </tr>
              <tr style={{ background: "var(--input-bg)" }}>
                <td style={{ ...S.td, fontWeight: 800, fontSize: "1rem" }}>Net Profit</td>
                <td
                  style={{
                    ...S.tdRight,
                    fontWeight: 800,
                    fontSize: "1rem",
                    color: data.netProfit >= 0 ? "#16a34a" : "var(--error)",
                  }}
                >
                  {pkr(data.netProfit)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderBS = () => {
    if (!data) return null;

    const assets = data.assets || [];
    const currentAssets = assets.filter(
      (a: any) =>
        a.type === "CURRENT" ||
        a.name.toLowerCase().includes("current") ||
        a.name.toLowerCase().includes("cash") ||
        a.name.toLowerCase().includes("bank") ||
        a.name.toLowerCase().includes("receivable")
    );
    const fixedAssets = assets.filter((a: any) => !currentAssets.includes(a));

    const totalCurrentAssets = currentAssets.reduce(
      (acc: number, curr: any) => acc + Number(curr.amount || 0),
      0
    );
    const totalFixedAssets = fixedAssets.reduce(
      (acc: number, curr: any) => acc + Number(curr.amount || 0),
      0
    );

    const liabilities = data.liabilities || [];
    const currentLiabilities = liabilities.filter(
      (l: any) =>
        l.type === "CURRENT" ||
        l.name.toLowerCase().includes("current") ||
        l.name.toLowerCase().includes("payable")
    );
    const longTerm = liabilities.filter((l: any) => !currentLiabilities.includes(l));

    const totalCurrentLiabilities = currentLiabilities.reduce(
      (acc: number, curr: any) => acc + Number(curr.amount || 0),
      0
    );
    const totalLongTerm = longTerm.reduce(
      (acc: number, curr: any) => acc + Number(curr.amount || 0),
      0
    );

    const equity = data.equity || [];
    const totalAssets = data.totalAssets || 0;
    const totalLiabilities = data.totalLiabilities || 0;
    const totalEquity = data.totalEquity || 0;

    const isBalanced = totalAssets === totalLiabilities + totalEquity;

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Assets Column */}
        <div style={S.tableWrap}>
          <table style={S.table}>
            <tbody>
              <tr>
                <td colSpan={2} style={{ ...S.th, background: "var(--card-bg)" }}>
                  Assets
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ ...S.th, fontSize: "0.65rem" }}>
                  Current Assets
                </td>
              </tr>
              {currentAssets.map((a: any) => (
                <tr key={a.id}>
                  <td style={S.td}>
                    [{a.code}] {a.name}
                  </td>
                  <td style={S.tdRight}>{pkr(a.amount)}</td>
                </tr>
              ))}
              <tr style={{ background: "var(--input-bg)" }}>
                <td style={{ ...S.td, fontWeight: 700 }}>Total Current Assets</td>
                <td style={{ ...S.tdRight }}>{pkr(totalCurrentAssets)}</td>
              </tr>

              <tr>
                <td colSpan={2} style={{ ...S.th, fontSize: "0.65rem" }}>
                  Fixed Assets
                </td>
              </tr>
              {fixedAssets.map((a: any) => (
                <tr key={a.id}>
                  <td style={S.td}>
                    [{a.code}] {a.name}
                  </td>
                  <td style={S.tdRight}>{pkr(a.amount)}</td>
                </tr>
              ))}
              <tr style={{ background: "var(--input-bg)" }}>
                <td style={{ ...S.td, fontWeight: 700 }}>Total Fixed Assets</td>
                <td style={{ ...S.tdRight }}>{pkr(totalFixedAssets)}</td>
              </tr>

              <tr style={{ background: "var(--card-border)" }}>
                <td style={{ ...S.td, fontWeight: 800, fontSize: "1rem" }}>Total Assets</td>
                <td style={{ ...S.tdRight, fontWeight: 800, fontSize: "1rem" }}>
                  {pkr(totalAssets)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Liabilities & Equity Column */}
        <div style={S.tableWrap}>
          <table style={S.table}>
            <tbody>
              <tr>
                <td colSpan={2} style={{ ...S.th, background: "var(--card-bg)" }}>
                  Liabilities
                </td>
              </tr>
              <tr>
                <td colSpan={2} style={{ ...S.th, fontSize: "0.65rem" }}>
                  Current Liabilities
                </td>
              </tr>
              {currentLiabilities.map((l: any) => (
                <tr key={l.id}>
                  <td style={S.td}>
                    [{l.code}] {l.name}
                  </td>
                  <td style={S.tdRight}>{pkr(l.amount)}</td>
                </tr>
              ))}
              <tr style={{ background: "var(--input-bg)" }}>
                <td style={{ ...S.td, fontWeight: 700 }}>Total Current Liabilities</td>
                <td style={{ ...S.tdRight }}>{pkr(totalCurrentLiabilities)}</td>
              </tr>

              <tr>
                <td colSpan={2} style={{ ...S.th, fontSize: "0.65rem" }}>
                  Long-term Liabilities
                </td>
              </tr>
              {longTerm.map((l: any) => (
                <tr key={l.id}>
                  <td style={S.td}>
                    [{l.code}] {l.name}
                  </td>
                  <td style={S.tdRight}>{pkr(l.amount)}</td>
                </tr>
              ))}
              <tr style={{ background: "var(--input-bg)" }}>
                <td style={{ ...S.td, fontWeight: 700 }}>Total Long-term Liabilities</td>
                <td style={{ ...S.tdRight }}>{pkr(totalLongTerm)}</td>
              </tr>

              <tr style={{ background: "var(--card-border)" }}>
                <td style={{ ...S.td, fontWeight: 800 }}>Total Liabilities</td>
                <td style={{ ...S.tdRight, fontWeight: 800 }}>{pkr(totalLiabilities)}</td>
              </tr>

              <tr>
                <td colSpan={2} style={{ ...S.th, background: "var(--card-bg)" }}>
                  Equity
                </td>
              </tr>
              {equity.map((eq: any) => (
                <tr key={eq.id}>
                  <td style={S.td}>
                    [{eq.code}] {eq.name}
                  </td>
                  <td style={S.tdRight}>{pkr(eq.amount)}</td>
                </tr>
              ))}
              <tr style={{ background: "var(--input-bg)" }}>
                <td style={{ ...S.td, fontWeight: 700 }}>Total Equity</td>
                <td style={{ ...S.tdRight }}>{pkr(totalEquity)}</td>
              </tr>

              <tr style={{ background: "var(--card-border)" }}>
                <td style={{ ...S.td, fontWeight: 800, fontSize: "1rem" }}>
                  Total Liabilities & Equity
                </td>
                <td style={{ ...S.tdRight, fontWeight: 800, fontSize: "1rem" }}>
                  {pkr(totalLiabilities + totalEquity)}
                </td>
              </tr>
            </tbody>
          </table>
          <div
            style={{
              padding: "1rem",
              borderTop: "1px solid var(--divider-color)",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <span style={S.tag(isBalanced ? "green" : "red")}>
              Check: Assets {isBalanced ? "=" : "≠"} Liabilities + Equity
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={S.page}>
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Financial Statements & Reports</h1>
          <p style={S.subtitle}>
            Trial Balance, Profit & Loss Statement, and Balance Sheet derived from General Ledger.
          </p>
        </div>
        <button style={S.btnSecondary}>Export PDF</button>
      </div>

      <div style={S.filterBar}>
        <button
          style={reportType === "tb" ? S.btnPrimary : S.btnSecondary}
          onClick={() => setReportType("tb")}
        >
          Trial Balance
        </button>
        <button
          style={reportType === "pnl" ? S.btnPrimary : S.btnSecondary}
          onClick={() => setReportType("pnl")}
        >
          Profit & Loss
        </button>
        <button
          style={reportType === "bs" ? S.btnPrimary : S.btnSecondary}
          onClick={() => setReportType("bs")}
        >
          Balance Sheet
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="date"
            style={S.input}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{ color: "var(--text-dark-sub)" }}>to</span>
          <input
            type="date"
            style={S.input}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <button style={S.btnPrimary} onClick={handleGenerate}>
            Generate Report
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-dark-sub)" }}>
          Loading reports...
        </div>
      ) : (
        <>
          {reportType === "tb" && renderTB()}
          {reportType === "pnl" && renderPnL()}
          {reportType === "bs" && renderBS()}
        </>
      )}
    </div>
  );
};

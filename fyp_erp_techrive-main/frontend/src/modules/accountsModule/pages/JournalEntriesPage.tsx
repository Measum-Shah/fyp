import React, { useEffect, useState } from "react";
import {
  fetchJournalsApi,
  createJournalApi,
  postJournalApi,
  fetchChartOfAccounts,
  type JournalEntryItem,
  type AccountItem,
} from "../services/accounts.service";
import { S, statusColor, pkr } from "../utils/styles";

export const JournalEntriesPage: React.FC = () => {
  const [journals, setJournals] = useState<JournalEntryItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Filter State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [journalType, setJournalType] = useState("GENERAL");
  const [lines, setLines] = useState([
    { account_id: 0, debit: 0, credit: 0, description: "" },
    { account_id: 0, debit: 0, credit: 0, description: "" },
  ]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [jRes, aRes] = await Promise.all([fetchJournalsApi(), fetchChartOfAccounts()]);
      if (jRes.success) setJournals(jRes.data);
      if (aRes.success) setAccounts(aRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleAddLine = () => {
    setLines([...lines, { account_id: 0, debit: 0, credit: 0, description: "" }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert("Double-Entry Violation: Total Debit must equal Total Credit and be greater than 0.");
      return;
    }

    try {
      await createJournalApi({
        date,
        reference,
        description,
        journal_type: journalType,
        lines: lines.map((l) => ({
          account_id: Number(l.account_id),
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description,
        })),
      });

      setShowModal(false);
      // Reset form
      setDate(new Date().toISOString().split("T")[0]);
      setReference("");
      setDescription("");
      setJournalType("GENERAL");
      setLines([
        { account_id: 0, debit: 0, credit: 0, description: "" },
        { account_id: 0, debit: 0, credit: 0, description: "" },
      ]);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handlePostJournal = async (id: number) => {
    if (!confirm("Are you sure you want to POST this Journal Entry to the General Ledger? This action is permanent.")) return;
    try {
      await postJournalApi(id);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const filteredJournals = journals.filter((j) => {
    if (filterType !== "ALL" && j.journal_type !== filterType) return false;
    if (filterStatus !== "ALL" && j.status !== filterStatus) return false;
    if (startDate && new Date(j.date) < new Date(startDate)) return false;
    if (endDate && new Date(j.date) > new Date(endDate)) return false;
    return true;
  });

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Journal Entries</h1>
          <p style={S.subtitle}>Record manual double-entry financial journals and review posting audit status.</p>
        </div>
        <button style={S.btnPrimary} onClick={() => setShowModal(true)}>
          + Create Journal Entry
        </button>
      </div>

      {/* Filter Bar */}
      <div style={S.filterBar}>
        <div style={S.formGroup}>
          <label style={S.label}>Start Date</label>
          <input
            type="date"
            style={S.input}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>End Date</label>
          <input
            type="date"
            style={S.input}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>Journal Type</label>
          <select style={S.select} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="ALL">All Types</option>
            <option value="GENERAL">GENERAL</option>
            <option value="SALES">SALES</option>
            <option value="PURCHASE">PURCHASE</option>
            <option value="CASH">CASH</option>
            <option value="BANK">BANK</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
          </select>
        </div>
        <div style={S.formGroup}>
          <label style={S.label}>Status</label>
          <select style={S.select} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="POSTED">POSTED</option>
          </select>
        </div>
      </div>

      {/* Journal Entries List */}
      <div style={S.tableWrap}>
        {loading ? (
          <div style={S.emptyRow}>Loading journals...</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>JV Number</th>
                <th style={S.th}>Date</th>
                <th style={S.th}>Reference / Memo</th>
                <th style={S.th}>Type</th>
                <th style={S.thRight}>Debit</th>
                <th style={S.thRight}>Credit</th>
                <th style={S.thCenter}>Status</th>
                <th style={S.thCenter}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredJournals.length === 0 ? (
                <tr>
                  <td colSpan={8} style={S.emptyRow}>
                    No journal entries found. Click "Create Journal Entry" to make a new entry.
                  </td>
                </tr>
              ) : (
                filteredJournals.map((j) => (
                  <React.Fragment key={j.id}>
                    <tr
                      style={{ cursor: "pointer", background: expandedId === j.id ? "var(--hover-bg, rgba(0,0,0,0.02))" : "inherit" }}
                      onClick={() => setExpandedId(expandedId === j.id ? null : j.id)}
                    >
                      <td style={{ ...S.td, ...S.mono }}>{j.journal_number}</td>
                      <td style={S.td}>{new Date(j.date).toLocaleDateString()}</td>
                      <td style={S.td}>{j.reference || j.description || "N/A"}</td>
                      <td style={S.td}>
                        <span style={S.tag("blue")}>{j.journal_type}</span>
                      </td>
                      <td style={S.tdRight}>{pkr(j.total_debit)}</td>
                      <td style={S.tdRight}>{pkr(j.total_credit)}</td>
                      <td style={S.tdCenter}>
                        <span style={S.tag(statusColor(j.status))}>{j.status}</span>
                      </td>
                      <td style={S.tdCenter} onClick={(e) => e.stopPropagation()}>
                        {j.status === "DRAFT" ? (
                          <button
                            onClick={() => handlePostJournal(j.id)}
                            style={S.btnPrimary}
                          >
                            Post to GL
                          </button>
                        ) : (
                          <span style={S.mono}>Posted</span>
                        )}
                      </td>
                    </tr>
                    {expandedId === j.id && (
                      <tr>
                        <td colSpan={8} style={{ padding: 0, borderBottom: "1px solid var(--divider-color)" }}>
                          <div style={{ padding: "1.5rem", background: "var(--input-bg)" }}>
                            <h4 style={{ ...S.h1, fontSize: "1rem", marginBottom: "1rem" }}>Journal Lines</h4>
                            <table style={S.table}>
                              <thead>
                                <tr>
                                  <th style={S.th}>Account</th>
                                  <th style={S.th}>Description</th>
                                  <th style={S.thRight}>Debit</th>
                                  <th style={S.thRight}>Credit</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(j.lines || []).map((line, idx) => (
                                  <tr key={idx}>
                                    <td style={S.td}>
                                      {line.account ? `[${line.account.code}] ${line.account.name}` : `Account ID: ${line.account_id}`}
                                    </td>
                                    <td style={S.td}>{line.description || "-"}</td>
                                    <td style={S.tdRight}>{pkr(line.debit)}</td>
                                    <td style={S.tdRight}>{pkr(line.credit)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={S.modalOverlay}>
          <div style={{ ...S.modal, maxWidth: "800px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={S.modalTitle}>New Double-Entry Journal Voucher</h2>
              <span style={S.tag(isBalanced ? "green" : "red")}>
                {isBalanced ? "✓ Balanced Journal" : "⚠ Unbalanced Journal"}
              </span>
            </div>

            <form onSubmit={handleCreateJournal}>
              <div style={S.formGrid}>
                <div style={S.formGroup}>
                  <label style={S.label}>Posting Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={S.input}
                  />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Journal Type</label>
                  <select
                    value={journalType}
                    onChange={(e) => setJournalType(e.target.value)}
                    style={S.select}
                  >
                    <option value="GENERAL">GENERAL</option>
                    <option value="SALES">SALES</option>
                    <option value="PURCHASE">PURCHASE</option>
                    <option value="CASH">CASH</option>
                    <option value="BANK">BANK</option>
                    <option value="ADJUSTMENT">ADJUSTMENT</option>
                  </select>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Reference / Doc No</label>
                  <input
                    type="text"
                    placeholder="e.g. REF-8842"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    style={S.input}
                  />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Description / Narration</label>
                  <input
                    type="text"
                    placeholder="Reason for journal entry..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={S.input}
                  />
                </div>
              </div>

              {/* Lines Table */}
              <div style={{ marginTop: "2rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ ...S.h1, fontSize: "1.1rem" }}>Journal Lines</h3>
                  <button type="button" onClick={handleAddLine} style={S.btnSecondary}>
                    + Add Line
                  </button>
                </div>

                <div style={{ ...S.tableWrap, overflow: "visible" }}>
                  <table style={S.table}>
                    <thead>
                      <tr>
                        <th style={{ ...S.th, width: "35%" }}>Account *</th>
                        <th style={S.th}>Memo Line</th>
                        <th style={S.thRight}>Debit</th>
                        <th style={S.thRight}>Credit</th>
                        <th style={S.thCenter}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, idx) => (
                        <tr key={idx}>
                          <td style={S.td}>
                            <select
                              required
                              value={line.account_id}
                              onChange={(e) => handleLineChange(idx, "account_id", e.target.value)}
                              style={{ ...S.select, width: "100%" }}
                            >
                              <option value={0}>-- Select Account --</option>
                              {accounts.map((a) => (
                                <option key={a.id} value={a.id}>
                                  [{a.code}] {a.name} ({a.type})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={S.td}>
                            <input
                              type="text"
                              placeholder="Line description"
                              value={line.description}
                              onChange={(e) => handleLineChange(idx, "description", e.target.value)}
                              style={{ ...S.input, width: "100%", minWidth: "120px" }}
                            />
                          </td>
                          <td style={S.tdRight}>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.debit}
                              onChange={(e) => handleLineChange(idx, "debit", parseFloat(e.target.value) || 0)}
                              style={{ ...S.input, width: "100px", textAlign: "right" }}
                            />
                          </td>
                          <td style={S.tdRight}>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.credit}
                              onChange={(e) => handleLineChange(idx, "credit", parseFloat(e.target.value) || 0)}
                              style={{ ...S.input, width: "100px", textAlign: "right" }}
                            />
                          </td>
                          <td style={S.tdCenter}>
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              style={{ ...S.btnDanger, padding: "0.4rem 0.8rem" }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} style={{ ...S.tdRight, borderBottom: "none" }}>Total:</td>
                        <td style={{ ...S.tdRight, borderBottom: "none", color: "var(--success, #16a34a)" }}>
                          {pkr(totalDebit)}
                        </td>
                        <td style={{ ...S.tdRight, borderBottom: "none", color: "var(--error, #dc2626)" }}>
                          {pkr(totalCredit)}
                        </td>
                        <td style={{ ...S.td, borderBottom: "none" }}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div style={S.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} style={S.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" disabled={!isBalanced} style={S.btnPrimary}>
                  Save Journal Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState, useMemo } from "react";
import {
  fetchExpensesApi,
  createExpenseApi,
  fetchChartOfAccounts,
  fetchCashBankAccountsApi,
  type ExpenseItem,
  type AccountItem,
  type CashBankAccountItem,
} from "../services/accounts.service";
import { S, statusColor, pkr } from "../utils/styles";

const EXPENSE_CATEGORIES = [
  "SALARY",
  "UTILITIES",
  "RENT",
  "TRANSPORTATION",
  "REPAIRS",
  "MARKETING",
  "ADMIN",
  "PETTY_CASH",
  "TRAVEL",
  "OTHER",
];

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [cashBankAccounts, setCashBankAccounts] = useState<CashBankAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [formData, setFormData] = useState({
    category: "SALARY",
    account_id: 0,
    amount: 0,
    date: new Date().toISOString().split("T")[0],
    payee: "",
    payment_mode: "CASH",
    cash_bank_account_id: 0,
    description: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [eRes, aRes, cbRes] = await Promise.all([
        fetchExpensesApi(),
        fetchChartOfAccounts(),
        fetchCashBankAccountsApi(),
      ]);
      if (eRes.success) setExpenses(eRes.data);
      if (aRes.success) setAccounts(aRes.data.filter((a: any) => a.type === "EXPENSE"));
      if (cbRes.success) setCashBankAccounts(cbRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createExpenseApi(formData);
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const matchSearch =
        exp.expense_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.payee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = filterCategory ? exp.category === filterCategory : true;
      const matchStatus = filterStatus ? exp.status === filterStatus : true;
      const d = new Date(exp.date).getTime();
      const matchFrom = dateFrom ? d >= new Date(dateFrom).getTime() : true;
      const matchTo = dateTo ? d <= new Date(dateTo).getTime() : true;
      return matchSearch && matchCat && matchStatus && matchFrom && matchTo;
    });
  }, [expenses, searchTerm, filterCategory, filterStatus, dateFrom, dateTo]);

  const kpis = useMemo(() => {
    let total = 0;
    let pending = 0;
    let approved = 0;
    let thisMonth = 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    expenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      total += amt;
      if (e.status === "PENDING") pending += amt;
      if (e.status === "APPROVED") approved += amt;
      
      const d = new Date(e.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        thisMonth += amt;
      }
    });
    return { total, pending, approved, thisMonth };
  }, [expenses]);

  return (
    <div style={S.page}>
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Expense Tracking</h1>
          <p style={S.subtitle}>Track operational disbursements and cost-center expenses.</p>
        </div>
        <button style={S.btnPrimary} onClick={() => setShowModal(true)}>
          + Add Expense
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {[
          { label: "Total Expenses", val: kpis.total },
          { label: "Pending Approval", val: kpis.pending },
          { label: "Approved", val: kpis.approved },
          { label: "This Month", val: kpis.thisMonth },
        ].map((k, i) => (
          <div key={i} style={{ ...S.pageHeader, flexDirection: "column", gap: "0.5rem", padding: "1.25rem" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-dark-sub)", textTransform: "uppercase", fontWeight: 700 }}>
              {k.label}
            </span>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-dark)" }}>
              {pkr(k.val)}
            </span>
          </div>
        ))}
      </div>

      <div style={S.filterBar}>
        <input
          style={S.input}
          placeholder="Search expenses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select style={S.select} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select style={S.select} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="PAID">PAID</option>
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-dark-sub)" }}>From</span>
          <input style={S.input} type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span style={{ fontSize: "0.8rem", color: "var(--text-dark-sub)" }}>To</span>
          <input style={S.input} type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Expense #</th>
              <th style={S.th}>Category</th>
              <th style={S.th}>Date</th>
              <th style={S.th}>Payee</th>
              <th style={S.thRight}>Amount</th>
              <th style={S.th}>Payment Mode</th>
              <th style={S.th}>Description</th>
              <th style={{ ...S.th, textAlign: "center" }}>Status</th>
              <th style={{ ...S.th, textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={S.emptyRow}>Loading...</td>
              </tr>
            ) : filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={9} style={S.emptyRow}>No expenses found.</td>
              </tr>
            ) : (
              filteredExpenses.map((exp) => (
                <tr key={exp.id}>
                  <td style={S.td}><span style={S.mono}>{exp.expense_number}</span></td>
                  <td style={S.td}>{exp.category}</td>
                  <td style={S.td}>{new Date(exp.date).toLocaleDateString()}</td>
                  <td style={S.td}>{exp.payee}</td>
                  <td style={S.tdRight}>{pkr(exp.amount)}</td>
                  <td style={S.td}>{exp.payment_mode}</td>
                  <td style={S.td}>{exp.description || "-"}</td>
                  <td style={S.tdCenter}>
                    <span style={S.tag(statusColor(exp.status))}>{exp.status}</span>
                  </td>
                  <td style={S.tdCenter}>
                    <button style={{ ...S.btnSecondary, padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}>
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h2 style={S.modalTitle}>Add Expense</h2>
            <form onSubmit={handleCreate}>
              <div style={S.formGrid}>
                <div style={S.formGroup}>
                  <label style={S.label}>Category *</label>
                  <select
                    style={S.select}
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Date *</label>
                  <input
                    style={S.input}
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Payee *</label>
                  <input
                    style={S.input}
                    required
                    placeholder="e.g. Electric Supply Co"
                    value={formData.payee}
                    onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                  />
                </div>
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
                  <label style={S.label}>Payment Mode *</label>
                  <select
                    style={S.select}
                    required
                    value={formData.payment_mode}
                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                  >
                    <option value="CASH">CASH</option>
                    <option value="BANK">BANK</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Expense Account *</label>
                  <select
                    style={S.select}
                    required
                    value={formData.account_id}
                    onChange={(e) => setFormData({ ...formData, account_id: Number(e.target.value) })}
                  >
                    <option value={0}>-- Select GL Expense Account --</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        [{a.code}] {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ ...S.formGroup, gridColumn: "span 2" }}>
                  <label style={S.label}>Description</label>
                  <textarea
                    style={S.textarea}
                    placeholder="Expense details..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <div style={S.modalFooter}>
                <button type="button" style={S.btnSecondary} onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" style={S.btnPrimary}>
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

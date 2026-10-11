import React, { useEffect, useState } from "react";
import { fetchChartOfAccounts, createAccountApi, seedChartOfAccountsApi, type AccountItem } from "../services/accounts.service";
import { S, pkr, typeColor } from "../utils/styles";

export const ChartOfAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "ASSET",
    normal_balance: "DEBIT",
    opening_balance: 0,
    description: "",
    tax_applicable: false,
  });

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetchChartOfAccounts();
      if (res.success) setAccounts(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAccountApi(formData);
      setShowModal(false);
      setFormData({
        code: "",
        name: "",
        type: "ASSET",
        normal_balance: "DEBIT",
        opening_balance: 0,
        description: "",
        tax_applicable: false,
      });
      loadAccounts();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleSeed = async () => {
    try {
      if (!window.confirm("Seed default accounts?")) return;
      await seedChartOfAccountsApi();
      loadAccounts();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.name.toLowerCase().includes(search.toLowerCase()) ||
      acc.code.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "ALL" || acc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Chart of Accounts</h1>
          <p style={S.subtitle}>
            Master list of General Ledger accounts organized by Assets, Liabilities, Equity, Revenue & Expenses.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button style={S.btnSecondary} onClick={handleSeed}>
            Seed Default Accounts
          </button>
          <button style={S.btnPrimary} onClick={() => setShowModal(true)}>
            + Add New Account
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={S.filterBar}>
        <input
          type="text"
          placeholder="Search account code or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={S.input}
        />

        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {["ALL", "ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map((t) => {
            const isActive = typeFilter === t;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  ...S.tag(isActive ? "blue" : "gray"),
                  cursor: "pointer",
                  border: isActive ? S.tag("blue").border : "1px solid transparent",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div style={S.tableWrap}>
        {loading ? (
          <div style={S.emptyRow}>Loading accounts...</div>
        ) : (
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Code</th>
                <th style={S.th}>Account Name</th>
                <th style={S.th}>Type</th>
                <th style={S.th}>Normal Balance</th>
                <th style={S.thRight}>Opening Bal</th>
                <th style={S.thRight}>Current Bal</th>
                <th style={S.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={S.emptyRow}>
                    No accounts found. Click "Seed Default Accounts" or add a new account.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => (
                  <tr key={acc.id}>
                    <td style={S.td}>
                      <span style={S.mono}>{acc.code}</span>
                    </td>
                    <td style={S.td}>
                      <strong>{acc.name}</strong>
                    </td>
                    <td style={S.td}>
                      <span style={S.tag(typeColor(acc.type))}>{acc.type}</span>
                    </td>
                    <td style={S.td}>{acc.normal_balance}</td>
                    <td style={S.tdRight}>{pkr(acc.opening_balance)}</td>
                    <td style={S.tdRight}>{pkr(acc.current_balance)}</td>
                    <td style={S.tdCenter}>
                      <span style={S.tag("green")}>Active</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h2 style={{ ...S.h1, fontSize: "1.15rem", marginBottom: "1.5rem" }}>
              Add New General Ledger Account
            </h2>
            <form onSubmit={handleCreateAccount}>
              <div style={S.formGrid}>
                <div style={S.formGroup}>
                  <label style={S.label}>Account Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1050"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    style={S.input}
                  />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Account Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value,
                        normal_balance: ["ASSET", "EXPENSE"].includes(e.target.value) ? "DEBIT" : "CREDIT",
                      })
                    }
                    style={S.select}
                  >
                    <option value="ASSET">ASSET</option>
                    <option value="LIABILITY">LIABILITY</option>
                    <option value="EQUITY">EQUITY</option>
                    <option value="REVENUE">REVENUE</option>
                    <option value="EXPENSE">EXPENSE</option>
                  </select>
                </div>
              </div>

              <div style={{ ...S.formGroup, marginTop: "1rem", marginBottom: "1rem" }}>
                <label style={S.label}>Account Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Petty Cash"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={S.input}
                />
              </div>

              <div style={S.formGrid}>
                <div style={S.formGroup}>
                  <label style={S.label}>Normal Balance</label>
                  <select
                    value={formData.normal_balance}
                    onChange={(e) => setFormData({ ...formData, normal_balance: e.target.value })}
                    style={S.select}
                  >
                    <option value="DEBIT">DEBIT</option>
                    <option value="CREDIT">CREDIT</option>
                  </select>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Opening Balance (PKR)</label>
                  <input
                    type="number"
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                    style={S.input}
                  />
                </div>
              </div>

              <div style={S.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={S.btnSecondary}
                >
                  Cancel
                </button>
                <button type="submit" style={S.btnPrimary}>
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

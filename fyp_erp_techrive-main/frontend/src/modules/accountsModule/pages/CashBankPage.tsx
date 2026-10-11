import React, { useEffect, useState } from "react";
import {
  fetchCashBankAccountsApi,
  createCashBankAccountApi,
  seedCashBankApi,
  type CashBankAccountItem,
} from "../services/accounts.service";
import { S, pkr } from "../utils/styles";

export const CashBankPage: React.FC = () => {
  const [accounts, setAccounts] = useState<CashBankAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    account_type: "BANK",
    bank_name: "",
    account_number: "",
    iban: "",
    current_balance: 0,
    currency: "PKR",
  });

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetchCashBankAccountsApi();
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCashBankAccountApi(formData);
      setShowModal(false);
      loadAccounts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSeed = async () => {
    try {
      await seedCashBankApi();
      loadAccounts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalCash = accounts.filter(a => a.account_type === 'CASH').reduce((sum, a) => sum + Number(a.current_balance || 0), 0);
  const totalBank = accounts.filter(a => a.account_type === 'BANK').reduce((sum, a) => sum + Number(a.current_balance || 0), 0);
  const totalBalance = totalCash + totalBank;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Cash Management & Bank Accounts</h1>
          <p style={S.subtitle}>
            Cash floats, bank balances, statement imports & bank reconciliation.
          </p>
          
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dark-sub)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Total Cash</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '0.2rem' }}>{pkr(totalCash)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dark-sub)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Total Bank</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '0.2rem' }}>{pkr(totalBank)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dark-sub)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Total Balance</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent)', marginTop: '0.2rem' }}>{pkr(totalBalance)}</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleSeed}
            style={S.btnSecondary}
          >
            ⚡ Seed Default Accounts
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={S.btnPrimary}
          >
            + Add Account
          </button>
        </div>
      </div>

      {/* Grid of Bank Accounts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {accounts.map((acc) => (
          <div key={acc.id} style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--card-border)',
            borderRadius: '14px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={S.tag(acc.account_type === "CASH" ? "blue" : "green")}>
                  {acc.account_type}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)', marginTop: '0.75rem' }}>
                  {acc.account_type === 'CASH' ? '💵' : '🏦'} {acc.name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-dark-sub)', marginTop: '0.25rem' }}>
                  {acc.bank_name || "Physical Cash Float"}
                </p>
              </div>
              <span style={S.mono}>{acc.currency || 'PKR'}</span>
            </div>

            <div style={{ borderTop: '1px solid var(--divider-color)', paddingTop: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dark-sub)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Current Available Balance</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)', marginTop: '0.4rem', fontFamily: 'monospace' }}>
                {pkr(acc.current_balance)}
              </p>
            </div>

            {acc.account_number && (
              <div style={{ 
                background: 'var(--input-bg)', 
                border: '1px solid var(--card-border)',
                borderRadius: '8px', 
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem'
              }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dark)', display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: 'var(--text-dark-sub)', fontWeight: 600 }}>A/C:</strong> 
                  <span style={S.mono}>{acc.account_number}</span>
                </div>
                {acc.iban && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dark)', display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ color: 'var(--text-dark-sub)', fontWeight: 600 }}>IBAN:</strong> 
                    <span style={S.mono}>{acc.iban}</span>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
              <a href="#" style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
                → View Transactions
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h2 style={S.modalTitle}>Add Cash / Bank Account</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={S.formGroup}>
                <label style={S.label}>Account Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Allied Bank Operating"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={S.input}
                />
              </div>

              <div style={S.formGrid}>
                <div style={S.formGroup}>
                  <label style={S.label}>Account Type</label>
                  <select
                    value={formData.account_type}
                    onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                    style={S.select}
                  >
                    <option value="BANK">BANK</option>
                    <option value="CASH">CASH</option>
                  </select>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Opening Balance</label>
                  <input
                    type="number"
                    value={formData.current_balance}
                    onChange={(e) => setFormData({ ...formData, current_balance: parseFloat(e.target.value) || 0 })}
                    style={{ ...S.input, fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>Currency</label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  style={S.input}
                />
              </div>

              {formData.account_type === "BANK" && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={S.formGroup}>
                    <label style={S.label}>Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Allied Bank Ltd"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      style={S.input}
                    />
                  </div>
                  <div style={S.formGrid}>
                    <div style={S.formGroup}>
                      <label style={S.label}>Account Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 0102030405"
                        value={formData.account_number}
                        onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                        style={{ ...S.input, fontFamily: 'monospace' }}
                      />
                    </div>
                    <div style={S.formGroup}>
                      <label style={S.label}>IBAN</label>
                      <input
                        type="text"
                        placeholder="e.g. PK00ABPA000..."
                        value={formData.iban}
                        onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                        style={{ ...S.input, fontFamily: 'monospace' }}
                      />
                    </div>
                  </div>
                </div>
              )}

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

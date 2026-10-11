import React, { useEffect, useState } from "react";
import {
  fetchVendorsApi,
  createVendorApi,
  fetchVendorBillsApi,
  createVendorBillApi,
  fetchVendorPaymentsApi,
  createVendorPaymentApi,
  fetchChartOfAccounts,
  fetchCashBankAccountsApi,
  type VendorItem,
  type VendorBillItem,
  type AccountItem,
  type CashBankAccountItem,
} from "../services/accounts.service";
import { S, pkr, statusColor } from "../utils/styles";

export const AccountsPayablePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"vendors" | "bills" | "payments">("vendors");
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [bills, setBills] = useState<VendorBillItem[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [cashBankAccounts, setCashBankAccounts] = useState<CashBankAccountItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filters
  const [vendorSearch, setVendorSearch] = useState("");
  const [billVendorFilter, setBillVendorFilter] = useState("ALL");
  const [billStatusFilter, setBillStatusFilter] = useState("ALL");

  // Modals
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Vendor Form
  const [vendorForm, setVendorForm] = useState({
    code: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    tax_number: "",
    payment_terms: "Net 30",
    credit_limit: 0,
  });

  // Bill Form
  const [billForm, setBillForm] = useState({
    vendor_id: 0,
    bill_number: "",
    bill_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    subtotal: 0,
    tax_amount: 0,
    discount_amount: 0,
    notes: "",
    lines: [{ item_description: "", account_id: 0, quantity: 1, unit_price: 0 }],
  });

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    vendor_id: 0,
    payment_date: new Date().toISOString().split("T")[0],
    amount: 0,
    payment_mode: "BANK",
    reference_number: "",
    notes: "",
    cash_bank_account_id: 0,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [vRes, bRes, pRes, aRes, cbRes] = await Promise.all([
        fetchVendorsApi(),
        fetchVendorBillsApi(),
        fetchVendorPaymentsApi(),
        fetchChartOfAccounts(),
        fetchCashBankAccountsApi(),
      ]);
      if (vRes.success) setVendors(vRes.data);
      if (bRes.success) setBills(bRes.data);
      if (pRes.success) setPayments(pRes.data);
      if (aRes.success) setAccounts(aRes.data);
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

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVendorApi(vendorForm);
      setShowVendorModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVendorBillApi(billForm);
      setShowBillModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVendorPaymentApi(paymentForm);
      setShowPaymentModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Stats Calculations
  const totalPayable = bills.reduce((acc, b) => acc + (Number(b.total_amount) - Number(b.paid_amount)), 0);
  const overdueBills = bills.filter(b => new Date(b.due_date) < new Date() && Number(b.total_amount) > Number(b.paid_amount));
  const overdueAmount = overdueBills.reduce((acc, b) => acc + (Number(b.total_amount) - Number(b.paid_amount)), 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const paidThisMonth = payments
    .filter(p => {
      const d = new Date(p.payment_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, p) => acc + Number(p.amount), 0);

  const pendingBillsCount = bills.filter(b => b.status !== "PAID").length;

  // Filters
  const filteredVendors = vendors.filter(v => v.name.toLowerCase().includes(vendorSearch.toLowerCase()) || v.vendor_code?.toLowerCase().includes(vendorSearch.toLowerCase()));
  
  const filteredBills = bills.filter(b => {
    const matchVendor = billVendorFilter === "ALL" || b.vendor_id === Number(billVendorFilter);
    const matchStatus = billStatusFilter === "ALL" || b.status === billStatusFilter;
    return matchVendor && matchStatus;
  });

  return (
    <div style={S.page}>
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Accounts Payable</h1>
          <p style={S.subtitle}>Manage vendors, bills, and payments.</p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        <div style={{ ...S.pageHeader, flexDirection: "column", alignItems: "flex-start", padding: "1.25rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-dark-sub)", fontWeight: 600 }}>Total Payable</span>
          <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-dark)", marginTop: "0.5rem" }}>{pkr(totalPayable)}</span>
        </div>
        <div style={{ ...S.pageHeader, flexDirection: "column", alignItems: "flex-start", padding: "1.25rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-dark-sub)", fontWeight: 600 }}>Overdue</span>
          <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--error)", marginTop: "0.5rem" }}>{pkr(overdueAmount)}</span>
        </div>
        <div style={{ ...S.pageHeader, flexDirection: "column", alignItems: "flex-start", padding: "1.25rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-dark-sub)", fontWeight: 600 }}>Paid This Month</span>
          <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--success)", marginTop: "0.5rem" }}>{pkr(paidThisMonth)}</span>
        </div>
        <div style={{ ...S.pageHeader, flexDirection: "column", alignItems: "flex-start", padding: "1.25rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-dark-sub)", fontWeight: 600 }}>Pending Bills</span>
          <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-dark)", marginTop: "0.5rem" }}>{pendingBillsCount}</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "2rem", borderBottom: "1px solid var(--card-border)", paddingBottom: "0.5rem" }}>
        {["Vendors", "Vendor Bills", "Payments"].map((tab) => {
          const key = tab === "Vendor Bills" ? "bills" : tab.toLowerCase() as any;
          const isActive = activeTab === key;
          return (
            <div
              key={tab}
              onClick={() => setActiveTab(key)}
              style={{
                fontSize: "0.9rem",
                fontWeight: isActive ? 700 : 600,
                color: isActive ? "var(--accent)" : "var(--text-dark-sub)",
                cursor: "pointer",
                borderBottom: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                paddingBottom: "0.4rem",
                marginBottom: "-0.6rem",
              }}
            >
              {tab}
            </div>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === "vendors" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={S.filterBar}>
            <input
              type="text"
              placeholder="Search vendors..."
              style={S.input}
              value={vendorSearch}
              onChange={(e) => setVendorSearch(e.target.value)}
            />
            <div style={{ flex: 1 }} />
            <button style={S.btnPrimary} onClick={() => setShowVendorModal(true)}>
              + Add Vendor
            </button>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Vendor Code</th>
                  <th style={S.th}>Name</th>
                  <th style={S.th}>Tax#</th>
                  <th style={S.th}>Payment Terms</th>
                  <th style={S.thRight}>Credit Limit</th>
                  <th style={S.thRight}>Outstanding</th>
                  <th style={S.thCenter}>Status</th>
                  <th style={S.thCenter}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={S.emptyRow}>No vendors found.</td>
                  </tr>
                ) : (
                  filteredVendors.map((v) => (
                    <tr key={v.id}>
                      <td style={S.td}><span style={S.mono}>{v.vendor_code}</span></td>
                      <td style={S.td}><strong>{v.name}</strong></td>
                      <td style={S.td}>{v.tax_number || "-"}</td>
                      <td style={S.td}>{v.payment_terms || "Net 30"}</td>
                      <td style={S.tdRight}>{pkr(v.credit_limit || 0)}</td>
                      <td style={S.tdRight}>{pkr(0)}</td>
                      <td style={S.tdCenter}>
                        <span style={S.tag("green")}>ACTIVE</span>
                      </td>
                      <td style={S.tdCenter}>
                        <button style={S.btnSecondary}>Edit</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "bills" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={S.filterBar}>
            <select style={S.select} value={billVendorFilter} onChange={(e) => setBillVendorFilter(e.target.value)}>
              <option value="ALL">All Vendors</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
            <select style={S.select} value={billStatusFilter} onChange={(e) => setBillStatusFilter(e.target.value)}>
              <option value="ALL">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="POSTED">Posted</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
            </select>
            <div style={{ flex: 1 }} />
            <button style={S.btnPrimary} onClick={() => setShowBillModal(true)}>
              + Add Bill
            </button>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Bill #</th>
                  <th style={S.th}>Vendor</th>
                  <th style={S.th}>Bill Date</th>
                  <th style={S.th}>Due Date</th>
                  <th style={S.thRight}>Subtotal</th>
                  <th style={S.thRight}>Tax</th>
                  <th style={S.thRight}>Total</th>
                  <th style={S.thRight}>Paid</th>
                  <th style={S.thRight}>Outstanding</th>
                  <th style={S.thCenter}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={S.emptyRow}>No vendor bills found.</td>
                  </tr>
                ) : (
                  filteredBills.map((b) => {
                    const outstanding = Number(b.total_amount) - Number(b.paid_amount);
                    return (
                      <tr key={b.id}>
                        <td style={S.td}><span style={S.mono}>{b.bill_number}</span></td>
                        <td style={S.td}><strong>{b.vendor?.name}</strong></td>
                        <td style={S.td}>{new Date(b.bill_date).toLocaleDateString()}</td>
                        <td style={S.td}>{new Date(b.due_date).toLocaleDateString()}</td>
                        <td style={S.tdRight}>{pkr(b.subtotal || b.total_amount)}</td>
                        <td style={S.tdRight}>{pkr(b.tax_amount || 0)}</td>
                        <td style={S.tdRight}>{pkr(b.total_amount)}</td>
                        <td style={S.tdRight}><span style={{ color: "var(--success)" }}>{pkr(b.paid_amount)}</span></td>
                        <td style={S.tdRight}>
                          <span style={{ color: outstanding > 0 ? "var(--error)" : "inherit" }}>
                            {pkr(outstanding)}
                          </span>
                        </td>
                        <td style={S.tdCenter}>
                          <span style={S.tag(statusColor(b.status))}>{b.status}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "payments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={S.filterBar}>
            <div style={{ flex: 1 }} />
            <button style={S.btnPrimary} onClick={() => setShowPaymentModal(true)}>
              + Add Payment
            </button>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Payment#</th>
                  <th style={S.th}>Vendor</th>
                  <th style={S.th}>Date</th>
                  <th style={S.thRight}>Amount</th>
                  <th style={S.th}>Mode</th>
                  <th style={S.th}>Reference</th>
                  <th style={S.thCenter}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={S.emptyRow}>No vendor payments found.</td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id}>
                      <td style={S.td}><span style={S.mono}>{p.payment_number}</span></td>
                      <td style={S.td}><strong>{p.vendor?.name}</strong></td>
                      <td style={S.td}>{new Date(p.payment_date).toLocaleDateString()}</td>
                      <td style={S.tdRight}>{pkr(p.amount)}</td>
                      <td style={S.td}>{p.payment_mode}</td>
                      <td style={S.td}>{p.reference_number || "-"}</td>
                      <td style={S.tdCenter}>
                        <span style={S.tag(statusColor(p.status))}>{p.status || "POSTED"}</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showVendorModal && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h2 style={S.modalTitle}>Add Vendor</h2>
            <form onSubmit={handleCreateVendor} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={S.formGrid}>
                <div style={S.formGroup}>
                  <label style={S.label}>Vendor Code</label>
                  <input style={S.input} value={vendorForm.code} onChange={e => setVendorForm({ ...vendorForm, code: e.target.value })} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Name *</label>
                  <input style={S.input} required value={vendorForm.name} onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Email</label>
                  <input type="email" style={S.input} value={vendorForm.email} onChange={e => setVendorForm({ ...vendorForm, email: e.target.value })} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Phone</label>
                  <input style={S.input} value={vendorForm.phone} onChange={e => setVendorForm({ ...vendorForm, phone: e.target.value })} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Tax Number</label>
                  <input style={S.input} value={vendorForm.tax_number} onChange={e => setVendorForm({ ...vendorForm, tax_number: e.target.value })} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Payment Terms</label>
                  <input style={S.input} value={vendorForm.payment_terms} onChange={e => setVendorForm({ ...vendorForm, payment_terms: e.target.value })} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Credit Limit</label>
                  <input type="number" style={S.input} value={vendorForm.credit_limit} onChange={e => setVendorForm({ ...vendorForm, credit_limit: Number(e.target.value) })} />
                </div>
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Address</label>
                <textarea style={S.textarea} value={vendorForm.address} onChange={e => setVendorForm({ ...vendorForm, address: e.target.value })} />
              </div>
              <div style={S.modalFooter}>
                <button type="button" style={S.btnSecondary} onClick={() => setShowVendorModal(false)}>Cancel</button>
                <button type="submit" style={S.btnPrimary}>Save Vendor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bill Modal */}
      {showBillModal && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h2 style={S.modalTitle}>Add Bill</h2>
            <form onSubmit={handleCreateBill} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={S.formGrid}>
                <div style={S.formGroup}>
                  <label style={S.label}>Vendor *</label>
                  <select required style={S.select} value={billForm.vendor_id} onChange={e => setBillForm({ ...billForm, vendor_id: Number(e.target.value) })}>
                    <option value={0}>Select Vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Bill Number</label>
                  <input style={S.input} value={billForm.bill_number} onChange={e => setBillForm({ ...billForm, bill_number: e.target.value })} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Bill Date</label>
                  <input type="date" style={S.input} required value={billForm.bill_date} onChange={e => setBillForm({ ...billForm, bill_date: e.target.value })} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Due Date</label>
                  <input type="date" style={S.input} required value={billForm.due_date} onChange={e => setBillForm({ ...billForm, due_date: e.target.value })} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Subtotal</label>
                  <input type="number" style={S.input} value={billForm.subtotal} onChange={e => setBillForm({ ...billForm, subtotal: Number(e.target.value) })} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Tax Amount</label>
                  <input type="number" style={S.input} value={billForm.tax_amount} onChange={e => setBillForm({ ...billForm, tax_amount: Number(e.target.value) })} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Discount Amount</label>
                  <input type="number" style={S.input} value={billForm.discount_amount} onChange={e => setBillForm({ ...billForm, discount_amount: Number(e.target.value) })} />
                </div>
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Notes</label>
                <textarea style={S.textarea} value={billForm.notes} onChange={e => setBillForm({ ...billForm, notes: e.target.value })} />
              </div>
              <div style={S.modalFooter}>
                <button type="button" style={S.btnSecondary} onClick={() => setShowBillModal(false)}>Cancel</button>
                <button type="submit" style={S.btnPrimary}>Save Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showPaymentModal && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h2 style={S.modalTitle}>Add Payment</h2>
            <form onSubmit={handleCreatePayment} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={S.formGrid}>
                <div style={S.formGroup}>
                  <label style={S.label}>Vendor *</label>
                  <select required style={S.select} value={paymentForm.vendor_id} onChange={e => setPaymentForm({ ...paymentForm, vendor_id: Number(e.target.value) })}>
                    <option value={0}>Select Vendor</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Payment Date *</label>
                  <input type="date" required style={S.input} value={paymentForm.payment_date} onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Amount *</label>
                  <input type="number" required style={S.input} value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Payment Mode</label>
                  <select style={S.select} value={paymentForm.payment_mode} onChange={e => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}>
                    <option value="CASH">CASH</option>
                    <option value="BANK">BANK</option>
                    <option value="CHEQUE">CHEQUE</option>
                    <option value="ONLINE">ONLINE</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Reference Number</label>
                  <input style={S.input} value={paymentForm.reference_number} onChange={e => setPaymentForm({ ...paymentForm, reference_number: e.target.value })} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Cash/Bank Account</label>
                  <select style={S.select} value={paymentForm.cash_bank_account_id} onChange={e => setPaymentForm({ ...paymentForm, cash_bank_account_id: Number(e.target.value) })}>
                    <option value={0}>Select Account</option>
                    {cashBankAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={S.formGroup}>
                <label style={S.label}>Notes</label>
                <textarea style={S.textarea} value={paymentForm.notes} onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
              </div>
              <div style={S.modalFooter}>
                <button type="button" style={S.btnSecondary} onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" style={S.btnPrimary}>Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

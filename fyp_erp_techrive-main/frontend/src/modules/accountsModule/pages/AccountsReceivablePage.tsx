import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  fetchCustomerInvoicesApi,
  createCustomerInvoiceApi,
  createCustomerPaymentApi,
  fetchChartOfAccounts,
  fetchCashBankAccountsApi,
  type CustomerInvoiceItem,
  type AccountItem,
  type CashBankAccountItem,
} from "../services/accounts.service";
import { S, statusColor, pkr } from "../utils/styles";

export const AccountsReceivablePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"INVOICES" | "PAYMENTS">("INVOICES");
  const [invoices, setInvoices] = useState<CustomerInvoiceItem[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [cashBankAccounts, setCashBankAccounts] = useState<CashBankAccountItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState("");

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Invoice Form
  const [invoiceForm, setInvoiceForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_address: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0],
    subtotal: 0,
    tax_amount: 0,
    discount_amount: 0,
    notes: "",
    payment_terms: "",
    lines: [{ item_description: "", account_id: 0, quantity: 1, unit_price: 0 }],
  });

  // Payment Form
  const [paymentForm, setPaymentForm] = useState({
    customer_name: "",
    customer_email: "",
    invoice_id: 0,
    receipt_date: new Date().toISOString().split("T")[0],
    amount: 0,
    payment_method: "BANK",
    cash_bank_account_id: 0,
    reference_number: "",
    notes: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [iRes, aRes, cbRes] = await Promise.all([
        fetchCustomerInvoicesApi(),
        fetchChartOfAccounts(),
        fetchCashBankAccountsApi(),
      ]);
      if (iRes.success) setInvoices(iRes.data);
      if (aRes.success) setAccounts(aRes.data);
      if (cbRes.success) setCashBankAccounts(cbRes.data);
      
      try {
        const pRes = await axios.get("http://localhost:5000/api/accounts/customer-payments");
        if (pRes.data && pRes.data.success) {
          setPayments(pRes.data.data);
        }
      } catch(e) {
        // Ignored if endpoint doesn't exist
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCustomerInvoiceApi(invoiceForm);
      setShowInvoiceModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Error creating invoice");
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCustomerPaymentApi({
        ...paymentForm,
        payment_date: paymentForm.receipt_date,
        reference_no: paymentForm.reference_number,
      });
      setShowPaymentModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || "Error recording payment");
    }
  };

  // KPIs
  const totalAr = invoices.reduce((acc, inv) => acc + (Number(inv.total_amount) - Number(inv.paid_amount)), 0);
  const overdueAr = invoices.filter(inv => inv.status === 'OVERDUE').reduce((acc, inv) => acc + (Number(inv.total_amount) - Number(inv.paid_amount)), 0);
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const collectedThisMonth = invoices.reduce((acc, inv) => {
    const d = new Date(inv.invoice_date);
    if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
      return acc + Number(inv.paid_amount);
    }
    return acc;
  }, 0);
  const draftInvoices = invoices.filter(inv => inv.status === 'DRAFT').length;

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={S.page}>
      <div style={S.pageHeader}>
        <div>
          <h1 style={S.h1}>Accounts Receivable</h1>
          <p style={S.subtitle}>Manage customer invoices, track payments, and monitor outstanding balances.</p>
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ ...S.filterBar, padding: '1rem', minWidth: '200px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dark-sub)', fontWeight: 700 }}>Total AR</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>{pkr(totalAr)}</div>
              </div>
            </div>
            <div style={{ ...S.filterBar, padding: '1rem', minWidth: '200px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dark-sub)', fontWeight: 700 }}>Overdue</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--error)' }}>{pkr(overdueAr)}</div>
              </div>
            </div>
            <div style={{ ...S.filterBar, padding: '1rem', minWidth: '200px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dark-sub)', fontWeight: 700 }}>Collected This Month</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>{pkr(collectedThisMonth)}</div>
              </div>
            </div>
            <div style={{ ...S.filterBar, padding: '1rem', minWidth: '200px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dark-sub)', fontWeight: 700 }}>Draft Invoices</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>{draftInvoices}</div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button style={S.btnSecondary} onClick={() => setShowPaymentModal(true)}>Record Payment</button>
          <button style={S.btnPrimary} onClick={() => setShowInvoiceModal(true)}>+ Create Invoice</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid var(--card-border)", paddingBottom: "0.5rem" }}>
        <button 
          onClick={() => setActiveTab("INVOICES")} 
          style={{ 
            background: "transparent", 
            border: "none", 
            fontSize: "0.95rem", 
            fontWeight: activeTab === "INVOICES" ? 700 : 500,
            color: activeTab === "INVOICES" ? "var(--accent)" : "var(--text-dark-sub)",
            borderBottom: activeTab === "INVOICES" ? "2px solid var(--accent)" : "none",
            paddingBottom: "0.5rem",
            cursor: "pointer"
          }}
        >
          Customer Invoices
        </button>
        <button 
          onClick={() => setActiveTab("PAYMENTS")} 
          style={{ 
            background: "transparent", 
            border: "none", 
            fontSize: "0.95rem", 
            fontWeight: activeTab === "PAYMENTS" ? 700 : 500,
            color: activeTab === "PAYMENTS" ? "var(--accent)" : "var(--text-dark-sub)",
            borderBottom: activeTab === "PAYMENTS" ? "2px solid var(--accent)" : "none",
            paddingBottom: "0.5rem",
            cursor: "pointer"
          }}
        >
          Customer Payments
        </button>
      </div>

      {activeTab === "INVOICES" && (
        <>
          <div style={S.filterBar}>
            <input 
              style={S.input} 
              placeholder="Search by invoice # or customer..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select style={S.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="POSTED">Posted</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <input 
              type="date" 
              style={S.input} 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            />
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Invoice #</th>
                  <th style={S.th}>Customer</th>
                  <th style={S.th}>Invoice Date</th>
                  <th style={S.th}>Due Date</th>
                  <th style={S.thRight}>Subtotal</th>
                  <th style={S.thRight}>Tax</th>
                  <th style={S.thRight}>Total</th>
                  <th style={S.thRight}>Paid</th>
                  <th style={S.thRight}>Outstanding</th>
                  <th style={S.thCenter}>Status</th>
                  <th style={S.thCenter}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={11} style={S.emptyRow}>Loading...</td></tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr><td colSpan={11} style={S.emptyRow}>No invoices found</td></tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const outstanding = Number(inv.total_amount) - Number(inv.paid_amount);
                    return (
                      <tr key={inv.id}>
                        <td style={S.td}><strong>{inv.invoice_number}</strong></td>
                        <td style={S.td}>{inv.customer_name}</td>
                        <td style={S.td}>{new Date(inv.invoice_date).toLocaleDateString()}</td>
                        <td style={S.td}>{new Date(inv.due_date).toLocaleDateString()}</td>
                        <td style={S.tdRight}>{pkr(inv.subtotal)}</td>
                        <td style={S.tdRight}>{pkr(inv.tax_amount)}</td>
                        <td style={S.tdRight}>{pkr(inv.total_amount)}</td>
                        <td style={S.tdRight}>{pkr(inv.paid_amount)}</td>
                        <td style={S.tdRight}>{pkr(outstanding)}</td>
                        <td style={S.tdCenter}>
                          <span style={S.tag(statusColor(inv.status))}>{inv.status}</span>
                        </td>
                        <td style={S.tdCenter}>
                          {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
                            <button
                              onClick={() => {
                                setPaymentForm({
                                  ...paymentForm,
                                  customer_name: inv.customer_name,
                                  invoice_id: inv.id,
                                  amount: outstanding,
                                });
                                setShowPaymentModal(true);
                              }}
                              style={{...S.btnSecondary, padding: "0.4rem 0.8rem", fontSize: "0.75rem"}}
                            >
                              Receive
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "PAYMENTS" && (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Receipt #</th>
                <th style={S.th}>Customer</th>
                <th style={S.th}>Date</th>
                <th style={S.thRight}>Amount</th>
                <th style={S.th}>Method</th>
                <th style={S.th}>Reference</th>
                <th style={S.th}>Allocated To</th>
                <th style={S.thCenter}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={S.emptyRow}>Loading...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={8} style={S.emptyRow}>No payments recorded yet.</td></tr>
              ) : (
                payments.map((p, idx) => (
                  <tr key={idx}>
                    <td style={S.td}><strong>{p.receipt_number || p.payment_number || `REC-${p.id}`}</strong></td>
                    <td style={S.td}>{p.customer_name}</td>
                    <td style={S.td}>{new Date(p.payment_date || p.receipt_date).toLocaleDateString()}</td>
                    <td style={S.tdRight}>{pkr(p.amount)}</td>
                    <td style={S.td}>{p.payment_method || p.payment_mode}</td>
                    <td style={S.td}>{p.reference_number || p.reference_no}</td>
                    <td style={S.td}>{p.allocated_to || p.invoice?.invoice_number || 'Unallocated'}</td>
                    <td style={S.tdCenter}>
                      <span style={S.tag(statusColor(p.status || 'POSTED'))}>{p.status || 'POSTED'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div style={S.modalOverlay}>
          <div style={{ ...S.modal, maxWidth: '800px' }}>
            <h2 style={S.modalTitle}>Create Customer Invoice</h2>
            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={S.formGrid}>
                <div style={S.formGroup}>
                  <label style={S.label}>Customer Name *</label>
                  <input required style={S.input} value={invoiceForm.customer_name} onChange={e => setInvoiceForm({...invoiceForm, customer_name: e.target.value})} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Customer Email</label>
                  <input type="email" style={S.input} value={invoiceForm.customer_email} onChange={e => setInvoiceForm({...invoiceForm, customer_email: e.target.value})} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Customer Phone</label>
                  <input style={S.input} value={invoiceForm.customer_phone} onChange={e => setInvoiceForm({...invoiceForm, customer_phone: e.target.value})} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Payment Terms</label>
                  <input style={S.input} value={invoiceForm.payment_terms} onChange={e => setInvoiceForm({...invoiceForm, payment_terms: e.target.value})} />
                </div>
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>Customer Address</label>
                <textarea style={S.textarea} value={invoiceForm.customer_address} onChange={e => setInvoiceForm({...invoiceForm, customer_address: e.target.value})} />
              </div>

              <div style={S.formGrid}>
                <div style={S.formGroup}>
                  <label style={S.label}>Invoice Date *</label>
                  <input type="date" required style={S.input} value={invoiceForm.invoice_date} onChange={e => setInvoiceForm({...invoiceForm, invoice_date: e.target.value})} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Due Date *</label>
                  <input type="date" required style={S.input} value={invoiceForm.due_date} onChange={e => setInvoiceForm({...invoiceForm, due_date: e.target.value})} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                <div style={S.formGroup}>
                  <label style={S.label}>Subtotal *</label>
                  <input type="number" step="0.01" required style={S.input} value={invoiceForm.subtotal} onChange={e => setInvoiceForm({...invoiceForm, subtotal: parseFloat(e.target.value) || 0})} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Tax Amount</label>
                  <input type="number" step="0.01" style={S.input} value={invoiceForm.tax_amount} onChange={e => setInvoiceForm({...invoiceForm, tax_amount: parseFloat(e.target.value) || 0})} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Discount Amount</label>
                  <input type="number" step="0.01" style={S.input} value={invoiceForm.discount_amount} onChange={e => setInvoiceForm({...invoiceForm, discount_amount: parseFloat(e.target.value) || 0})} />
                </div>
              </div>
              
              <div style={S.formGroup}>
                <label style={S.label}>Notes</label>
                <textarea style={{...S.textarea, minHeight: '60px'}} value={invoiceForm.notes} onChange={e => setInvoiceForm({...invoiceForm, notes: e.target.value})} />
              </div>

              {/* Minimal Lines Fallback for backend expectations */}
              <div style={S.formGroup}>
                <label style={S.label}>Line Item Detail (Optional)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input style={{...S.input, flex: 2}} placeholder="Description" value={invoiceForm.lines[0].item_description} onChange={e => setInvoiceForm({...invoiceForm, lines: [{...invoiceForm.lines[0], item_description: e.target.value}]})} />
                  <select style={{...S.select, flex: 1}} value={invoiceForm.lines[0].account_id} onChange={e => setInvoiceForm({...invoiceForm, lines: [{...invoiceForm.lines[0], account_id: Number(e.target.value)}]})}>
                    <option value={0}>Revenue Account</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={S.modalFooter}>
                <button type="button" style={S.btnSecondary} onClick={() => setShowInvoiceModal(false)}>Cancel</button>
                <button type="submit" style={S.btnPrimary}>Create Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <h2 style={S.modalTitle}>Record Customer Payment</h2>
            <form onSubmit={handleCreatePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={S.formGrid}>
                <div style={S.formGroup}>
                  <label style={S.label}>Customer Name *</label>
                  <input required style={S.input} value={paymentForm.customer_name} onChange={e => setPaymentForm({...paymentForm, customer_name: e.target.value})} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Customer Email</label>
                  <input type="email" style={S.input} value={paymentForm.customer_email} onChange={e => setPaymentForm({...paymentForm, customer_email: e.target.value})} />
                </div>
              </div>

              <div style={S.formGrid}>
                <div style={S.formGroup}>
                  <label style={S.label}>Receipt Date *</label>
                  <input type="date" required style={S.input} value={paymentForm.receipt_date} onChange={e => setPaymentForm({...paymentForm, receipt_date: e.target.value})} />
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Amount (PKR) *</label>
                  <input type="number" step="0.01" required style={S.input} value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: parseFloat(e.target.value) || 0})} />
                </div>
              </div>

              <div style={S.formGrid}>
                <div style={S.formGroup}>
                  <label style={S.label}>Payment Method *</label>
                  <select style={S.select} value={paymentForm.payment_method} onChange={e => setPaymentForm({...paymentForm, payment_method: e.target.value})}>
                    <option value="CASH">CASH</option>
                    <option value="BANK">BANK</option>
                    <option value="CHEQUE">CHEQUE</option>
                    <option value="ONLINE">ONLINE</option>
                  </select>
                </div>
                <div style={S.formGroup}>
                  <label style={S.label}>Reference Number</label>
                  <input style={S.input} value={paymentForm.reference_number} onChange={e => setPaymentForm({...paymentForm, reference_number: e.target.value})} />
                </div>
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>Receiving Account *</label>
                <select required style={S.select} value={paymentForm.cash_bank_account_id} onChange={e => setPaymentForm({...paymentForm, cash_bank_account_id: Number(e.target.value)})}>
                  <option value={0}>-- Select Account --</option>
                  {cashBankAccounts.map((cb) => (
                    <option key={cb.id} value={cb.id}>{cb.name} ({pkr(cb.current_balance)})</option>
                  ))}
                </select>
              </div>

              <div style={S.formGroup}>
                <label style={S.label}>Notes</label>
                <textarea style={{...S.textarea, minHeight: '60px'}} value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
              </div>

              <div style={S.modalFooter}>
                <button type="button" style={S.btnSecondary} onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" style={S.btnPrimary}>Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { StudentAPI } from "../services/api";
import { DataTable } from "../../components/common/DataTable";

const StudentFeesPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    StudentAPI.getFeeDashboard()
      .then(res => setData(res.data.data))
      .catch((err) => { console.error('Fee API error:', err); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex flex-col gap-6 animate-pulse"><div className="panel-card" style={{height:300}}/></div>;

  // Backend returns: { student_id, linked_student_ids, dashboard: { summary, statements, payment_history } }
  const dashboard = data?.dashboard || {};
  const summary = dashboard?.summary || {};
  const statements = dashboard?.statements || [];

  // Map statements into voucher-like rows for the table
  const vouchers = statements.map((s: any) => ({
    id: s.bill_no || `#${s.id}`,
    due_date: s.fee_due_date_end,
    amount: s.due_amount || s.total_after_discount || s.total_fee || 0,
    paid: s.paid_amount || 0,
    balance: s.balance || 0,
    status: s.statement_status,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{color: "var(--text-dark)"}}>Fee & Finance</h1>
      
      <div className="teacher-stats-grid" style={{gridTemplateColumns:"repeat(auto-fit, minmax(200px, 1fr))"}}>
        <div className="stat-card stat-card-blue">
          <div className="stat-value">Rs {summary.outstanding_balance || 0}</div>
          <div className="stat-label">Pending Dues</div>
        </div>
        <div className="stat-card stat-card-green">
          <div className="stat-value">Rs {summary.total_paid || 0}</div>
          <div className="stat-label">Paid This Semester</div>
        </div>
        <div className="stat-card stat-card-purple">
          <div className="stat-value">Rs {summary.total_dues || 0}</div>
          <div className="stat-label">Total Dues</div>
        </div>
      </div>

      <div className="panel-card">
        <div className="panel-card-header"><h3>Fee Statements</h3></div>
        <div className="p-4">
          <DataTable 
            columns={[
              { key: "id", header: "Bill #", render: (v: any) => v.id },
              { key: "due_date", header: "Due Date", render: (v: any) => v.due_date ? new Date(v.due_date).toLocaleDateString() : "—" },
              { key: "amount", header: "Amount", render: (v: any) => `Rs ${v.amount}` },
              { key: "paid", header: "Paid", render: (v: any) => `Rs ${v.paid}` },
              { key: "balance", header: "Balance", render: (v: any) => `Rs ${v.balance}` },
              { key: "status", header: "Status", render: (v: any) => (
                <span className="inline-block text-xs font-semibold" style={{padding:"4px 8px", borderRadius:"6px", 
                  background: v.status === 'Paid' ? 'var(--success-bg)' : v.status === 'Overdue' ? 'var(--error-bg)' : 'var(--gold-light)',
                  color: v.status === 'Paid' ? 'var(--success)' : v.status === 'Overdue' ? 'var(--error)' : 'var(--text-dark)',
                  border: `1px solid ${v.status === 'Paid' ? 'var(--success-border)' : v.status === 'Overdue' ? 'var(--error-border)' : 'var(--gold)'}`
                }}>
                  {v.status || "Unpaid"}
                </span>
              )},
              { key: "action", header: "Action", render: (v: any) => v.status !== 'Paid' ? <button style={{background:"var(--accent)",color:"#fff",fontWeight:600,padding:"6px 16px",borderRadius:"6px",border:"none",cursor:"pointer",fontSize:"0.75rem"}}>Pay Now</button> : null }
            ]}
            data={vouchers}
          />
        </div>
      </div>
    </div>
  );
};

export default StudentFeesPage;

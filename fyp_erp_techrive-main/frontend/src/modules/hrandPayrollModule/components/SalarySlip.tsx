import React from "react";
import type { SalarySlipRow } from "../services/payrollReport.types";

// Requires "./salary-slip.css" to already be loaded by whichever page
// renders this (BulkSalarySlipPage.tsx and SalarySheetsPage.tsx both do) —
// not imported here to avoid loading it twice.

export const formatSlipMoney = (value: number | string | null): string => {
  if (value == null) return "0";
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

export const SLIP_MONTH_NAMES: Record<string, string> = {
  "01": "January", "02": "February", "03": "March", "04": "April",
  "05": "May", "06": "June", "07": "July", "08": "August",
  "09": "September", "10": "October", "11": "November", "12": "December",
};

// ─── SalarySlip ───────────────────────────────────────────────────────────
// One printable slip. Every allowance/deduction line comes straight off the
// salary sheet (see payrollReport.service.ts's getSalarySlips) — no derived
// math beyond what the backend already computed as gross/net. Originally
// lived only in BulkSalarySlipPage.tsx; pulled out here so SalarySheetsPage
// can print/save a single employee's slip straight from that sheet's row,
// without going through the Reports page's branch/month filter form.
const SalarySlip: React.FC<{ slip: SalarySlipRow }> = ({ slip }) => (
  <div className="salary-slip-sheet">
    <div className="salary-slip-sheet-header">
      <div>
        <div className="salary-slip-company">{slip.company_name}</div>
        <div className="salary-slip-branch">{slip.branch_name}</div>
      </div>
      <div className="salary-slip-period">
        Salary Slip
        <strong>{SLIP_MONTH_NAMES[slip.month_id] ?? slip.month_id} {slip.year_id}</strong>
      </div>
    </div>

    <dl className="salary-slip-employee-grid">
      <div><dt>Employee ID:</dt><dd>{slip.reg_no ?? "—"}</dd></div>
      <div><dt>Name:</dt><dd>{slip.employee_name}</dd></div>
      <div><dt>Designation:</dt><dd>{slip.designation ?? "—"}</dd></div>
      <div><dt>Department:</dt><dd>{slip.department_name}</dd></div>
      <div><dt>CNIC:</dt><dd>{slip.cnic ?? "—"}</dd></div>
      <div><dt>Bank Account:</dt><dd>{slip.account_number ?? slip.bank_account ?? "—"}</dd></div>
    </dl>

    <div className="salary-slip-table-cols">
      <table className="salary-slip-line-table">
        <caption>Earnings</caption>
        <tbody>
          <tr><td>Basic Salary</td><td>{formatSlipMoney(slip.basic_salary)}</td></tr>
          <tr><td>House Rent Allowance</td><td>{formatSlipMoney(slip.house_rent_allowance)}</td></tr>
          <tr><td>Medical Allowance</td><td>{formatSlipMoney(slip.medical_allowance)}</td></tr>
          <tr><td>Conveyance Allowance</td><td>{formatSlipMoney(slip.conveyance_allowance)}</td></tr>
          {slip.arrears ? <tr><td>Arrears</td><td>{formatSlipMoney(slip.arrears)}</td></tr> : null}
          <tr><td><strong>Gross Salary</strong></td><td><strong>{formatSlipMoney(slip.gross_salary)}</strong></td></tr>
        </tbody>
      </table>

      <table className="salary-slip-line-table">
        <caption>Deductions</caption>
        <tbody>
          <tr><td>EOBI</td><td>{formatSlipMoney(slip.eobi_amount)}</td></tr>
          <tr><td>EPF</td><td>{formatSlipMoney(slip.epf_amount)}</td></tr>
          <tr><td>Tax</td><td>{formatSlipMoney(slip.tax_amount)}</td></tr>
          <tr><td>Loan Installment</td><td>{formatSlipMoney(slip.loan_amount)}</td></tr>
          <tr><td>Other Deductions</td><td>{formatSlipMoney(slip.other_deduction)}</td></tr>
        </tbody>
      </table>
    </div>

    <div className="salary-slip-net-row">
      <span>Net Salary Payable</span>
      <span className="amount">{formatSlipMoney(slip.net_salary)}</span>
    </div>
  </div>
);

export default SalarySlip;

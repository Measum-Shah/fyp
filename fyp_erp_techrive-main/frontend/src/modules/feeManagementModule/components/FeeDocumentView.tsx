/**
 * On-screen Invoice / Receipt renderer shared by
 * Fee Management → Student Fee Records and Fee Management → Payment Processing.
 *
 * Rendered from the normalised `FeeDocumentModel`, which is the same input used
 * by the print and PDF exports, so the three outputs cannot drift apart.
 * Styles are scoped to the `fdoc-` prefix in FeeDocumentView.css.
 */

import React from "react";
import "./FeeDocumentView.css";
import type { FeeDocumentModel } from "../utils/feeDocumentModel";
import { feeDocColumnLabel, feeDocLineValue } from "../utils/feeDocumentModel";
import { formatFeeMoney } from "../utils/feeDocumentModel";

const EntryList: React.FC<{
  heading: string;
  entries: Array<{ label: string; value: string }>;
}> = ({ heading, entries }) => (
  <div className="fdoc-col">
    <h4>{heading}</h4>
    {entries.map((entry) => (
      <div className="fdoc-entry" key={`${heading}-${entry.label}`}>
        <span>{entry.label}</span>
        <strong>{entry.value}</strong>
      </div>
    ))}
  </div>
);

export const FeeDocumentView: React.FC<{ model: FeeDocumentModel }> = ({ model }) => (
  <div className={`fdoc fdoc-${model.kind}`}>
    <div className="fdoc-head">
      <div>
        <h2>{model.title}</h2>
        <p>{model.purpose}</p>
      </div>
      <div className="fdoc-badge">
        <span className="fdoc-badge-kind">
          {model.kind === "invoice" ? "Invoice" : "Payment Receipt"}
        </span>
        <span className="fdoc-badge-status">{model.status}</span>
      </div>
    </div>

    <div className="fdoc-grid">
      <EntryList heading="Issued By" entries={model.institution} />
      <EntryList heading="Student" entries={model.student} />
      <EntryList
        heading={model.kind === "invoice" ? "Invoice Details" : "Payment Details"}
        entries={model.reference}
      />
    </div>

    <h5 className="fdoc-section">
      {model.kind === "invoice" ? "Fee Details" : "Fee Heads Paid"}
    </h5>
    <div className="fdoc-table-wrap">
      <table className="fdoc-table">
        <thead>
          <tr>
            <th>Description</th>
            {model.lineColumns.map((col) => (
              <th key={col} className="fdoc-num">
                {feeDocColumnLabel(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.lines.length ? (
            model.lines.map((line, index) => (
              <tr key={`${line.description}-${index}`}>
                <td>{line.description}</td>
                {model.lineColumns.map((col) => (
                  <td key={col} className="fdoc-num">
                    {feeDocLineValue(line, col)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={model.lineColumns.length + 1}>No fee lines available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    {model.payments.length > 0 && (
      <>
        <h5 className="fdoc-section">Payment Transactions</h5>
        <div className="fdoc-table-wrap">
          <table className="fdoc-table">
            <thead>
              <tr>
                <th>Voucher / Txn No</th>
                <th>Date</th>
                <th>Mode</th>
                <th>Ref No</th>
                <th>Remarks</th>
                <th className="fdoc-num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {model.payments.map((payment, index) => (
                <tr key={`${payment.voucher_no}-${index}`}>
                  <td>{payment.voucher_no}</td>
                  <td>{payment.paid_date}</td>
                  <td>{payment.payment_mode}</td>
                  <td>{payment.reference_number || "—"}</td>
                  <td>{payment.note || "—"}</td>
                  <td className="fdoc-num">{formatFeeMoney(payment.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )}

    <div className="fdoc-totals">
      {model.totals.map((total) => (
        <div
          key={total.label}
          className={`fdoc-total ${total.emphasis ? "fdoc-total-strong" : ""}`}
        >
          <span>{total.label}</span>
          <strong>{total.value}</strong>
        </div>
      ))}
    </div>

    {model.notes.length > 0 && (
      <div className="fdoc-notes">
        {model.notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
      </div>
    )}

    <div className="fdoc-foot">
      <span>Generated: {model.generated_at}</span>
      <span>
        {model.kind === "invoice"
          ? "This document is a fee bill and does not confirm payment."
          : "This document confirms payment received."}
      </span>
    </div>
  </div>
);

export default FeeDocumentView;

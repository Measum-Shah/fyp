/**
 * Fee Management document printing.
 *
 * The previous implementation called `window.print()` on the app document and
 * relied on a global `@media print` rule that hides everything except
 * `#fee-print-area`. That rule also sets `display: none` on
 * `.fee-modal-backdrop`, which is an ancestor of the document markup, so the
 * whole subtree was removed from the print render tree and the page came out
 * blank (a `visibility: visible` descendant cannot survive a `display: none`
 * ancestor).
 *
 * Printing now happens from an isolated off-screen iframe that carries its own
 * markup and stylesheet, so it cannot be affected by app-level print rules and
 * can never render blank.
 */

import type { FeeDocumentModel } from "./feeDocumentModel";
import { feeDocColumnLabel, feeDocLineValue } from "./feeDocumentModel";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const entryRows = (entries: Array<{ label: string; value: string }>) =>
  entries
    .map(
      (e) =>
        `<div class="fpd-entry"><span>${escapeHtml(e.label)}</span><strong>${escapeHtml(
          e.value
        )}</strong></div>`
    )
    .join("");

const documentStyles = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 24px;
    font-family: "Segoe UI", Arial, Helvetica, sans-serif;
    color: #111827;
    font-size: 12px;
  }
  .fpd-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    border-bottom: 2px solid #111827;
    padding-bottom: 12px;
  }
  .fpd-title { margin: 0; font-size: 20px; letter-spacing: 0.06em; }
  .fpd-purpose { margin: 4px 0 0; font-size: 11px; color: #4b5563; }
  .fpd-kind {
    border: 1px solid #111827;
    border-radius: 4px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  .fpd-grid {
    display: flex;
    gap: 20px;
    margin-top: 16px;
  }
  .fpd-col { flex: 1; }
  .fpd-col h3 {
    margin: 0 0 6px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #4b5563;
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 3px;
  }
  .fpd-entry {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 2px 0;
  }
  .fpd-entry span { color: #4b5563; }
  .fpd-entry strong { font-weight: 600; text-align: right; }
  h4.fpd-section {
    margin: 18px 0 6px;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #4b5563;
  }
  table { width: 100%; border-collapse: collapse; }
  th, td {
    border: 1px solid #d1d5db;
    padding: 6px 8px;
    text-align: left;
    font-size: 11.5px;
  }
  th { background: #f3f4f6; text-transform: uppercase; letter-spacing: 0.04em; font-size: 10.5px; }
  td.fpd-num, th.fpd-num { text-align: right; white-space: nowrap; }
  .fpd-totals { margin-top: 14px; display: flex; justify-content: flex-end; }
  .fpd-totals table { width: auto; min-width: 260px; }
  .fpd-totals td { border: none; padding: 3px 0; }
  .fpd-totals td.fpd-num { padding-left: 24px; }
  .fpd-totals tr.fpd-strong td {
    border-top: 1px solid #111827;
    padding-top: 6px;
    font-weight: 700;
    font-size: 13px;
  }
  .fpd-notes { margin-top: 14px; font-size: 11px; color: #4b5563; }
  .fpd-notes p { margin: 2px 0; }
  .fpd-foot {
    margin-top: 26px;
    border-top: 1px solid #d1d5db;
    padding-top: 8px;
    display: flex;
    justify-content: space-between;
    font-size: 10.5px;
    color: #6b7280;
  }
  @page { size: A4; margin: 12mm; }
  @media print {
    body { padding: 0; }
    tr, table { page-break-inside: avoid; }
  }
`;

export const buildFeeDocumentHtml = (model: FeeDocumentModel) => {
  const lineHead = model.lineColumns
    .map((c) => `<th class="fpd-num">${feeDocColumnLabel(c)}</th>`)
    .join("");

  const lineRows = model.lines.length
    ? model.lines
        .map(
          (line) =>
            `<tr><td>${escapeHtml(line.description)}</td>${model.lineColumns
              .map(
                (c) => `<td class="fpd-num">${escapeHtml(feeDocLineValue(line, c))}</td>`
              )
              .join("")}</tr>`
        )
        .join("")
    : `<tr><td colspan="${model.lineColumns.length + 1}">No fee lines available</td></tr>`;

  const paymentsBlock = model.payments.length
    ? `<h4 class="fpd-section">Payment Transactions</h4>
       <table>
         <thead>
           <tr>
             <th>Voucher / Txn No</th>
             <th>Date</th>
             <th>Mode</th>
             <th>Ref No</th>
             <th>Remarks</th>
             <th class="fpd-num">Amount</th>
           </tr>
         </thead>
         <tbody>
           ${model.payments
             .map(
               (p) =>
                 `<tr><td>${escapeHtml(p.voucher_no)}</td><td>${escapeHtml(
                   p.paid_date
                 )}</td><td>${escapeHtml(p.payment_mode)}</td><td>${escapeHtml(
                   p.reference_number || "-"
                 )}</td><td>${escapeHtml(
                   p.note
                 )}</td><td class="fpd-num">${escapeHtml(
                   feeDocLineValue({ description: "", amount: p.amount, paid: p.amount, balance: 0 }, "amount")
                 )}</td></tr>`
             )
             .join("")}
         </tbody>
       </table>`
    : "";

  const totalsRows = model.totals
    .map(
      (t) =>
        `<tr${t.emphasis ? ' class="fpd-strong"' : ""}><td>${escapeHtml(
          t.label
        )}</td><td class="fpd-num">${escapeHtml(t.value)}</td></tr>`
    )
    .join("");

  const notesBlock = model.notes.length
    ? `<div class="fpd-notes">${model.notes
        .map((n) => `<p>${escapeHtml(n)}</p>`)
        .join("")}</div>`
    : "";

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(model.title)}</title>
    <style>${documentStyles}</style>
  </head>
  <body>
    <div class="fpd-head">
      <div>
        <h1 class="fpd-title">${escapeHtml(model.title)}</h1>
        <p class="fpd-purpose">${escapeHtml(model.purpose)}</p>
      </div>
      <div class="fpd-kind">${model.kind === "invoice" ? "Invoice" : "Payment Receipt"} · ${escapeHtml(
        model.status
      )}</div>
    </div>

    <div class="fpd-grid">
      <div class="fpd-col">
        <h3>Issued By</h3>
        ${entryRows(model.institution)}
      </div>
      <div class="fpd-col">
        <h3>Student</h3>
        ${entryRows(model.student)}
      </div>
      <div class="fpd-col">
        <h3>${model.kind === "invoice" ? "Invoice Details" : "Payment Details"}</h3>
        ${entryRows(model.reference)}
      </div>
    </div>

    <h4 class="fpd-section">${
      model.kind === "invoice" ? "Fee Details" : "Fee Heads Paid"
    }</h4>
    <table>
      <thead><tr><th>Description</th>${lineHead}</tr></thead>
      <tbody>${lineRows}</tbody>
    </table>

    ${paymentsBlock}

    <div class="fpd-totals"><table><tbody>${totalsRows}</tbody></table></div>

    ${notesBlock}

    <div class="fpd-foot">
      <span>Generated: ${escapeHtml(model.generated_at)}</span>
      <span>${
        model.kind === "invoice"
          ? "This document is a fee bill and does not confirm payment."
          : "This document confirms payment received."
      }</span>
    </div>
  </body>
</html>`;
};

/** Print the given Invoice/Receipt through an isolated iframe. */
export const printFeeDocument = (model: FeeDocumentModel) => {
  const html = buildFeeDocumentHtml(model);
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.style.visibility = "hidden";

  const cleanup = () => {
    window.setTimeout(() => {
      if (frame.parentNode) frame.parentNode.removeChild(frame);
    }, 1000);
  };

  let printed = false;
  frame.onload = () => {
    if (printed) return;
    printed = true;
    const win = frame.contentWindow;
    if (!win) {
      cleanup();
      return;
    }
    win.onafterprint = cleanup;
    // Let the iframe finish layout before invoking the print dialog.
    window.setTimeout(() => {
      win.focus();
      win.print();
      window.setTimeout(cleanup, 60000);
    }, 120);
  };

  // srcdoc keeps the markup in this single load event, so the print dialog can
  // never open against an empty about:blank document.
  frame.srcdoc = html;
  document.body.appendChild(frame);
};

/**
 * Fee Management PDF export (Invoice / Receipt).
 *
 * The project has no PDF dependency, so this writes a minimal, valid PDF 1.4
 * document (A4, standard Helvetica fonts) directly from the same
 * `FeeDocumentModel` used by the on-screen and print views. The file is handed
 * to the browser as a real `application/pdf` blob download — it never opens the
 * print dialog and never produces an empty document.
 */

import type { FeeDocumentModel } from "./feeDocumentModel";
import { feeDocColumnLabel, feeDocLineValue } from "./feeDocumentModel";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM_LIMIT = MARGIN + 40;

/** Approximate Helvetica advance widths (per 1000 units) for layout maths. */
const charWidth = (code: number, bold: boolean) => {
  if (code === 32) return 278;
  if (code >= 48 && code <= 57) return 556;
  if (code >= 65 && code <= 90) return bold ? 722 : 667;
  if (code >= 97 && code <= 122) return bold ? 578 : 528;
  if (".,:;'!|".includes(String.fromCharCode(code))) return 278;
  if ("()[]/-".includes(String.fromCharCode(code))) return 333;
  return bold ? 600 : 556;
};

const textWidth = (value: string, size: number, bold = false) => {
  let total = 0;
  for (let i = 0; i < value.length; i += 1) {
    total += charWidth(value.charCodeAt(i), bold);
  }
  return (total / 1000) * size;
};

/** Map characters the standard fonts cannot show onto Latin-1 equivalents. */
const toLatin1 = (value: string) =>
  value
    .replace(/₨/g, "Rs.")
    .replace(/[·•]/g, "-")
    .replace(/[–—]/g, "-")
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .normalize("NFC")
    .split("")
    .map((ch) => (ch.charCodeAt(0) <= 255 ? ch : "?"))
    .join("");

const escapePdfText = (value: string) =>
  toLatin1(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[\r\n]+/g, " ");

const truncate = (value: string, maxWidth: number, size: number, bold = false) => {
  const clean = toLatin1(value);
  if (textWidth(clean, size, bold) <= maxWidth) return clean;
  let out = clean;
  while (out.length > 1 && textWidth(`${out}...`, size, bold) > maxWidth) {
    out = out.slice(0, -1);
  }
  return `${out}...`;
};

const wrap = (value: string, maxWidth: number, size: number) => {
  const words = toLatin1(value).split(/\s+/).filter(Boolean);
  if (!words.length) return [""];
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (textWidth(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = truncate(word, maxWidth, size);
    }
  });
  if (current) lines.push(current);
  return lines;
};

class PdfDocument {
  private pages: string[][] = [];
  private ops: string[] = [];
  private cursor = PAGE_HEIGHT - MARGIN;

  constructor() {
    this.pages.push(this.ops);
  }

  get y() {
    return this.cursor;
  }

  move(amount: number) {
    this.cursor -= amount;
  }

  addPage() {
    this.ops = [];
    this.pages.push(this.ops);
    this.cursor = PAGE_HEIGHT - MARGIN;
  }

  ensure(space: number) {
    if (this.cursor - space < BOTTOM_LIMIT) this.addPage();
  }

  text(
    value: string,
    x: number,
    size: number,
    options: { bold?: boolean; align?: "left" | "right"; gray?: number; y?: number } = {}
  ) {
    const { bold = false, align = "left", gray, y } = options;
    const baseline = y ?? this.cursor;
    const content = escapePdfText(value);
    const drawX =
      align === "right" ? x - textWidth(toLatin1(value), size, bold) : x;
    const color = gray !== undefined ? `${gray} ${gray} ${gray} rg\n` : "0 0 0 rg\n";
    this.ops.push(
      `${color}BT /${bold ? "F2" : "F1"} ${size} Tf ${drawX.toFixed(2)} ${baseline.toFixed(
        2
      )} Td (${content}) Tj ET`
    );
  }

  line(x1: number, y1: number, x2: number, y2: number, width = 0.6, gray = 0.75) {
    this.ops.push(
      `${gray} ${gray} ${gray} RG ${width} w ${x1.toFixed(2)} ${y1.toFixed(
        2
      )} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`
    );
  }

  fill(x: number, y: number, w: number, h: number, gray = 0.94) {
    this.ops.push(
      `${gray} ${gray} ${gray} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(
        2
      )} ${h.toFixed(2)} re f`
    );
  }

  build() {
    const objects: string[] = [];
    const pageCount = this.pages.length;
    const firstPageObj = 5;

    const kids = Array.from(
      { length: pageCount },
      (_, i) => `${firstPageObj + i * 2} 0 R`
    ).join(" ");

    objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[1] = `<< /Type /Pages /Count ${pageCount} /Kids [${kids}] >>`;
    objects[2] =
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
    objects[3] =
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

    this.pages.forEach((ops, index) => {
      const pageObj = firstPageObj + index * 2;
      const contentObj = pageObj + 1;
      objects[pageObj - 1] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObj} 0 R >>`;
      const stream = ops.join("\n");
      objects[contentObj - 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    });

    let pdf = "%PDF-1.4\n";
    const offsets: number[] = [];
    objects.forEach((body, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    const bytes = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i += 1) bytes[i] = pdf.charCodeAt(i) & 0xff;
    return new Blob([bytes], { type: "application/pdf" });
  }
}

const drawEntryColumn = (
  doc: PdfDocument,
  heading: string,
  entries: Array<{ label: string; value: string }>,
  x: number,
  width: number,
  top: number
) => {
  let y = top;
  doc.text(heading.toUpperCase(), x, 8, { bold: true, gray: 0.35, y });
  y -= 4;
  doc.line(x, y, x + width, y, 0.5, 0.8);
  y -= 11;
  entries.forEach((entry) => {
    doc.text(truncate(entry.label, width * 0.4, 8), x, 8, { gray: 0.4, y });
    doc.text(truncate(entry.value, width * 0.6, 8.5, true), x + width, 8.5, {
      bold: true,
      align: "right",
      y,
    });
    y -= 12;
  });
  return y;
};

const drawTable = (
  doc: PdfDocument,
  headers: Array<{ label: string; width: number; align: "left" | "right" }>,
  rows: string[][]
) => {
  const drawHeader = () => {
    doc.ensure(30);
    const headerTop = doc.y;
    doc.fill(MARGIN, headerTop - 4, CONTENT_WIDTH, 15);
    let x = MARGIN;
    headers.forEach((col) => {
      if (col.align === "right") {
        doc.text(col.label.toUpperCase(), x + col.width - 4, 8, {
          bold: true,
          align: "right",
          gray: 0.25,
          y: headerTop,
        });
      } else {
        doc.text(col.label.toUpperCase(), x + 4, 8, {
          bold: true,
          gray: 0.25,
          y: headerTop,
        });
      }
      x += col.width;
    });
    doc.move(15);
    doc.line(MARGIN, doc.y + 6, MARGIN + CONTENT_WIDTH, doc.y + 6, 0.5, 0.75);
  };

  drawHeader();

  rows.forEach((row) => {
    const descLines = wrap(row[0] || "", headers[0].width - 8, 9);
    const rowHeight = Math.max(14, descLines.length * 11 + 4);
    if (doc.y - rowHeight < BOTTOM_LIMIT) {
      doc.addPage();
      drawHeader();
    }
    const rowTop = doc.y;
    let x = MARGIN;
    headers.forEach((col, colIndex) => {
      const value = row[colIndex] ?? "";
      if (colIndex === 0) {
        descLines.forEach((lineText, lineIndex) => {
          doc.text(lineText, x + 4, 9, { y: rowTop - lineIndex * 11 });
        });
      } else if (col.align === "right") {
        doc.text(truncate(value, col.width - 8, 9), x + col.width - 4, 9, {
          align: "right",
          y: rowTop,
        });
      } else {
        doc.text(truncate(value, col.width - 8, 9), x + 4, 9, { y: rowTop });
      }
      x += col.width;
    });
    doc.move(rowHeight);
    doc.line(MARGIN, doc.y + 7, MARGIN + CONTENT_WIDTH, doc.y + 7, 0.4, 0.85);
  });
};

const renderDocument = (model: FeeDocumentModel) => {
  const doc = new PdfDocument();

  // Header
  doc.text(model.title, MARGIN, 17, { bold: true });
  doc.move(14);
  doc.text(model.purpose, MARGIN, 8.5, { gray: 0.4 });
  const badge = `${model.kind === "invoice" ? "INVOICE" : "PAYMENT RECEIPT"} · ${model.status}`;
  doc.text(badge, PAGE_WIDTH - MARGIN, 9, {
    bold: true,
    align: "right",
    gray: 0.2,
    y: doc.y + 14,
  });
  doc.move(10);
  doc.line(MARGIN, doc.y, PAGE_WIDTH - MARGIN, doc.y, 1.1, 0.2);
  doc.move(16);

  // Three information columns
  const colGap = 14;
  const colWidth = (CONTENT_WIDTH - colGap * 2) / 3;
  const columnsTop = doc.y;
  const bottoms = [
    drawEntryColumn(doc, "Issued By", model.institution, MARGIN, colWidth, columnsTop),
    drawEntryColumn(
      doc,
      "Student",
      model.student,
      MARGIN + colWidth + colGap,
      colWidth,
      columnsTop
    ),
    drawEntryColumn(
      doc,
      model.kind === "invoice" ? "Invoice Details" : "Payment Details",
      model.reference,
      MARGIN + (colWidth + colGap) * 2,
      colWidth,
      columnsTop
    ),
  ];
  doc.move(columnsTop - Math.min(...bottoms) + 10);

  // Fee lines
  doc.ensure(60);
  doc.text(
    model.kind === "invoice" ? "FEE DETAILS" : "FEE HEADS PAID",
    MARGIN,
    9,
    { bold: true, gray: 0.3 }
  );
  doc.move(14);

  const numericWidth = 92;
  const lineHeaders = [
    {
      label: "Description",
      width: CONTENT_WIDTH - numericWidth * model.lineColumns.length,
      align: "left" as const,
    },
    ...model.lineColumns.map((col) => ({
      label: feeDocColumnLabel(col),
      width: numericWidth,
      align: "right" as const,
    })),
  ];
  const lineRows = model.lines.length
    ? model.lines.map((line) => [
        line.description,
        ...model.lineColumns.map((col) => feeDocLineValue(line, col)),
      ])
    : [["No fee lines available", ...model.lineColumns.map(() => "")]];
  drawTable(doc, lineHeaders, lineRows);

  // Payment transactions (receipt only — invoice has no payment ledger)
  if (model.payments.length) {
    doc.move(12);
    doc.ensure(60);
    doc.text("PAYMENT TRANSACTIONS", MARGIN, 9, { bold: true, gray: 0.3 });
    doc.move(14);
    const amountWidth = 80;
    const dateWidth = 62;
    const modeWidth = 68;
    const refWidth = 72;
    const voucherWidth = 110;
    drawTable(
      doc,
      [
        {
          label: "Remarks",
          width: CONTENT_WIDTH - amountWidth - dateWidth - modeWidth - refWidth - voucherWidth,
          align: "left",
        },
        { label: "Voucher / Txn No", width: voucherWidth, align: "left" },
        { label: "Date", width: dateWidth, align: "left" },
        { label: "Mode", width: modeWidth, align: "left" },
        { label: "Ref No", width: refWidth, align: "left" },
        { label: "Amount", width: amountWidth, align: "right" },
      ],
      model.payments.map((p) => [
        p.note || "-",
        p.voucher_no,
        p.paid_date,
        p.payment_mode,
        p.reference_number || "-",
        feeDocLineValue(
          { description: "", amount: p.amount, paid: p.amount, balance: 0 },
          "amount"
        ),
      ])
    );
  }

  // Totals
  doc.move(16);
  doc.ensure(20 + model.totals.length * 14);
  const totalsRight = PAGE_WIDTH - MARGIN;
  const totalsLabelX = totalsRight - 150;
  model.totals.forEach((total) => {
    if (total.emphasis) {
      doc.line(totalsLabelX - 6, doc.y + 11, totalsRight, doc.y + 11, 0.8, 0.25);
      doc.move(4);
    }
    doc.text(total.label, totalsLabelX, total.emphasis ? 10.5 : 9.5, {
      bold: total.emphasis,
      gray: total.emphasis ? 0 : 0.35,
    });
    doc.text(total.value, totalsRight, total.emphasis ? 11.5 : 9.5, {
      bold: true,
      align: "right",
    });
    doc.move(total.emphasis ? 18 : 14);
  });

  // Notes
  if (model.notes.length) {
    doc.move(6);
    model.notes.forEach((note) => {
      wrap(note, CONTENT_WIDTH, 8.5).forEach((noteLine) => {
        doc.ensure(14);
        doc.text(noteLine, MARGIN, 8.5, { gray: 0.4 });
        doc.move(12);
      });
    });
  }

  // Footer
  doc.ensure(30);
  doc.move(10);
  doc.line(MARGIN, doc.y, PAGE_WIDTH - MARGIN, doc.y, 0.5, 0.8);
  doc.move(12);
  doc.text(`Generated: ${model.generated_at}`, MARGIN, 8, { gray: 0.45 });
  doc.text(
    model.kind === "invoice"
      ? "This document is a fee bill and does not confirm payment."
      : "This document confirms payment received.",
    PAGE_WIDTH - MARGIN,
    8,
    { align: "right", gray: 0.45 }
  );

  return doc.build();
};

export const downloadFeeDocumentPdf = (model: FeeDocumentModel) => {
  const blob = renderDocument(model);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = model.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
};

// ─── ExportCsvButton ─────────────────────────────────────────────────────────
// Generic "export what's currently on screen" button, shared by every report
// page. No new dependency was added for this (frontend/package.json has no
// CSV/Excel library) — CSV is just a text format, so a small hand-rolled
// serializer is enough, and the resulting .csv file opens directly in Excel,
// which covers the "Export to Excel/CSV" requirement without adding a
// dependency the rest of the project doesn't already use.

export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
}

interface ExportCsvButtonProps<T> {
  rows: T[];
  columns: CsvColumn<T>[];
  filename: string;
  disabled?: boolean;
  /** Button label — defaults to "Export to Excel/CSV" for the report pages. */
  label?: string;
}

// Escapes a single CSV field per RFC 4180: wrap in quotes and double up any
// embedded quotes whenever the value contains a comma, quote, or newline.
const escapeCsvField = (value: string | number | null | undefined): string => {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const buildCsv = <T,>(rows: T[], columns: CsvColumn<T>[]): string => {
  const headerLine = columns.map((col) => escapeCsvField(col.header)).join(",");
  const dataLines = rows.map((row) =>
    columns.map((col) => escapeCsvField(col.accessor(row))).join(",")
  );
  // Leading BOM so Excel opens UTF-8 CSVs (e.g. names with accents) correctly
  // instead of mis-detecting the encoding.
  return "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
};

const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

function ExportCsvButton<T>({ rows, columns, filename, disabled, label }: ExportCsvButtonProps<T>) {
  const handleExport = () => {
    const csv = buildCsv(rows, columns);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      className="hr-btn hr-btn-secondary"
      onClick={handleExport}
      disabled={disabled || rows.length === 0}
    >
      <IconDownload />
      {label ?? "Export to Excel/CSV"}
    </button>
  );
}

export default ExportCsvButton;

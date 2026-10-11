import * as XLSX from "xlsx";
import type { CsvColumn } from "./ExportCsvButton";

// ─── ExportExcelButton ────────────────────────────────────────────────────
// Same "export what's currently on screen" contract as ExportCsvButton.tsx
// (reuses its CsvColumn<T> shape directly — header + accessor — so any
// report's existing column-builder function works with either button
// unchanged), but writes a genuine .xlsx workbook via SheetJS instead of a
// CSV. Used where a report specifically needs to be a real Excel file —
// e.g. the Gross Salary Report, whose column count varies month to month
// (one column per allowance/deduction type actually used that period),
// which a spreadsheet handles far better than a flat CSV a person has to
// eyeball-align by hand.

interface ExportExcelButtonProps<T> {
  rows: T[];
  columns: CsvColumn<T>[];
  filename: string;
  sheetName?: string;
  disabled?: boolean;
}

const IconDownload = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

function ExportExcelButton<T>({ rows, columns, filename, sheetName = "Sheet1", disabled }: ExportExcelButtonProps<T>) {
  const handleExport = () => {
    const aoa: (string | number)[][] = [
      columns.map((col) => col.header),
      ...rows.map((row) => columns.map((col) => col.accessor(row) ?? "")),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    // Rough auto-width per column so numbers/names aren't clipped on open —
    // SheetJS has no built-in autosize, this is the standard workaround.
    worksheet["!cols"] = columns.map((col) => {
      const longest = Math.max(
        col.header.length,
        ...rows.map((row) => String(col.accessor(row) ?? "").length)
      );
      return { wch: Math.min(Math.max(longest + 2, 10), 40) };
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
  };

  return (
    <button
      type="button"
      className="hr-btn hr-btn-secondary"
      onClick={handleExport}
      disabled={disabled || rows.length === 0}
    >
      <IconDownload />
      Export to Excel
    </button>
  );
}

export default ExportExcelButton;

/** Fee-local CSV export (no dependency on other modules). */

export type FeeCsvColumn<T> = {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
};

const escapeCsvField = (value: string | number | null | undefined): string => {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
};

export const buildFeeCsv = <T,>(rows: T[], columns: FeeCsvColumn<T>[]): string => {
  const headerLine = columns.map((c) => escapeCsvField(c.header)).join(",");
  const dataLines = rows.map((row) =>
    columns.map((c) => escapeCsvField(c.accessor(row))).join(",")
  );
  return "\uFEFF" + [headerLine, ...dataLines].join("\r\n");
};

export const downloadFeeCsv = <T,>(
  rows: T[],
  columns: FeeCsvColumn<T>[],
  filename: string
) => {
  const csv = buildFeeCsv(rows, columns);
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

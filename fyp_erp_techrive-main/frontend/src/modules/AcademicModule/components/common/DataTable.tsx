import React from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchPlaceholder?: string;
  page?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (size: number) => void;
  actionButton?: React.ReactNode;
  emptyMessage?: string;
  filterComponent?: React.ReactNode;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  loading = false,
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Search records...",
  page = 1,
  totalPages = 1,
  totalCount,
  onPageChange,
  itemsPerPage = 10,
  onItemsPerPageChange,
  actionButton,
  emptyMessage = "No records found.",
  filterComponent,
}: DataTableProps<T>) {
  return (
    <div
      style={{
        width: "100%",
        background: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: "var(--radius-card)",
        overflow: "hidden",
        boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header controls bar */}
      {(onSearchChange || actionButton || filterComponent) && (
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--card-border)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.875rem",
            background: "var(--input-bg)",
          }}
        >
          <div style={{ display: "flex", flex: 1, alignItems: "center", gap: "0.75rem", minWidth: "240px" }}>
            {onSearchChange && (
              <div style={{ position: "relative", flex: 1, maxWidth: "400px" }}>
                <input
                  type="search"
                  name="datatable-search-query"
                  autoComplete="off"
                  value={searchQuery || ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="field-input"
                  style={{ paddingLeft: "2.6rem" }}
                />
                <svg
                  style={{
                    position: "absolute",
                    left: "0.875rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "16px",
                    height: "16px",
                    color: "var(--input-icon-color)",
                    pointerEvents: "none",
                  }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            )}
            {filterComponent}
          </div>

          {actionButton && <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>{actionButton}</div>}
        </div>
      )}

      {/* Table container */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", textAlign: "left", fontSize: "0.875rem", borderCollapse: "collapse" }}>
          <thead>
            <tr
              style={{
                borderBottom: "1px solid var(--card-border)",
                background: "var(--input-bg)",
                color: "var(--text-dark-sub)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                fontSize: "0.72rem",
                fontWeight: 700,
              }}
            >
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{
                    width: col.width,
                    padding: "0.875rem 1.25rem",
                    textAlign: col.align || "left",
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--divider-color)" }}>
                  {columns.map((col) => (
                    <td key={col.key} style={{ padding: "0.875rem 1.25rem" }}>
                      <div style={{ height: "16px", background: "var(--input-disabled-bg)", borderRadius: "4px", width: "75%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text-dark-sub)" }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                    <svg
                      style={{ width: "36px", height: "36px", opacity: 0.4, stroke: "currentColor" }}
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7m16 0v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5m16 0h-2.586a1 1 0 0 0-.707.293l-2.414 2.414a1 1 0 0 1-.707.293h-3.172a1 1 0 0 1-.707-.293l-2.414-2.414A1 1 0 0 0 6.586 13H4" />
                    </svg>
                    <span style={{ fontWeight: 600 }}>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={row.id || rowIndex}
                  style={{
                    borderBottom: "1px solid var(--divider-color)",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--input-bg)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      style={{
                        padding: "0.875rem 1.25rem",
                        color: "var(--text-dark)",
                        textAlign: col.align || "left",
                      }}
                    >
                      {col.render ? col.render(row, (page ? (page - 1) * (itemsPerPage || 10) : 0) + rowIndex + 1) : (row as any)[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {onPageChange && (
        <div
          style={{
            padding: "0.875rem 1.25rem",
            borderTop: "1px solid var(--card-border)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            fontSize: "0.78rem",
            color: "var(--text-dark-sub)",
            background: "var(--input-bg)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>
              Showing page <strong style={{ color: "var(--text-dark)" }}>{page}</strong> of{" "}
              <strong style={{ color: "var(--text-dark)" }}>{totalPages}</strong>
            </span>
            {totalCount !== undefined && (
              <span style={{ opacity: 0.7 }}>({totalCount} total entries)</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {onItemsPerPageChange && (
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                style={{
                  padding: "0.25rem 0.5rem",
                  border: "1px solid var(--input-border)",
                  background: "var(--card-bg)",
                  color: "var(--text-dark)",
                  borderRadius: "6px",
                  fontSize: "0.78rem",
                  outline: "none",
                }}
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            )}

            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid var(--input-border)",
                background: "var(--card-bg)",
                color: "var(--text-dark)",
                fontWeight: 600,
                cursor: page <= 1 ? "not-allowed" : "pointer",
                opacity: page <= 1 ? 0.5 : 1,
              }}
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid var(--input-border)",
                background: "var(--card-bg)",
                color: "var(--text-dark)",
                fontWeight: 600,
                cursor: page >= totalPages ? "not-allowed" : "pointer",
                opacity: page >= totalPages ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

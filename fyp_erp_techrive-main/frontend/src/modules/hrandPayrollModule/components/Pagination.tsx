import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

// Builds a compact page-number list with ellipses, e.g.:
// 1 … 4 5 [6] 7 8 … 24
const buildPageList = (page: number, totalPages: number): (number | "ellipsis")[] => {
  const pages: (number | "ellipsis")[] = [];
  const windowSize = 1;

  const start = Math.max(2, page - windowSize);
  const end = Math.min(totalPages - 1, page + windowSize);

  pages.push(1);
  if (start > 2) pages.push("ellipsis");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < totalPages - 1) pages.push("ellipsis");
  if (totalPages > 1) pages.push(totalPages);

  return pages;
};

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const rangeStart = (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);
  const pageList = buildPageList(page, totalPages);

  return (
    <div className="hr-pagination">
      <span className="hr-pagination-summary">
        Showing <strong>{rangeStart}</strong>–<strong>{rangeEnd}</strong> of{" "}
        <strong>{total}</strong>
      </span>

      <div className="hr-pagination-controls">
        <button
          type="button"
          className="hr-pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <IconChevronLeft />
        </button>

        {pageList.map((p, idx) =>
          p === "ellipsis" ? (
            <span key={`ellipsis-${idx}`} className="hr-pagination-ellipsis">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`hr-pagination-btn ${p === page ? "hr-pagination-btn-active" : ""}`}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          className="hr-pagination-btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <IconChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

import { useCallback, useEffect, useState } from "react";
import { reportAPI } from "../services/report.service";
import { getApiErrorMessage } from "../services/employee.service";
import { PAGE_SIZE_DEFAULT } from "../services/employee.constants";
import type { PaginationMeta } from "../services/employee.types";
import type { EmployeeDirectoryParams, EmployeeDirectoryRow } from "../services/report.types";

const EMPTY_META: PaginationMeta = { total: 0, page: 1, limit: PAGE_SIZE_DEFAULT, totalPages: 1 };

// ─── useEmployeeDirectoryReport ──────────────────────────────────────────────
// Owns the Employee Directory report's filter + page state and fetched rows.
// Mirrors useEmployees.ts exactly — same "loading flips true from the
// handler, not synchronously inside the effect" pattern, same "changing a
// filter resets to page 1" rule, since this report is now a real paginated
// list over `staff` rather than a flat capped dump.
export const useEmployeeDirectoryReport = () => {
  const [filters, setFiltersState] = useState<Omit<EmployeeDirectoryParams, "page" | "limit">>({});
  const [page, setPageState] = useState(1);
  const limit = PAGE_SIZE_DEFAULT;
  const [rows, setRows] = useState<EmployeeDirectoryRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    reportAPI
      .employeeDirectory({ ...filters, page, limit })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
        setMeta(res.meta);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(getApiErrorMessage(err));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, limit, reloadToken]);

  // Resets to page 1 whenever a filter changes — otherwise the user could
  // land on a page number that no longer exists for the new, narrower
  // result set (same rule as useEmployees.ts's changeSearch).
  const setFilters = useCallback((next: Omit<EmployeeDirectoryParams, "page" | "limit">) => {
    setLoading(true);
    setFiltersState(next);
    setPageState(1);
  }, []);

  const setPage = useCallback((next: number) => {
    setLoading(true);
    setPageState(next);
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return {
    rows,
    meta,
    filters,
    setFilters,
    page,
    setPage,
    loading,
    error,
    refetch,
  };
};

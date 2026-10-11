import { useCallback, useEffect, useState } from "react";
import { activityLogAPI, getApiErrorMessage } from "../services/activityLog.service";
import { PAGE_SIZE_DEFAULT } from "../services/employee.constants";
import type { ActivityLog, PaginationMeta } from "../services/activityLog.types";

interface UseActivityLogsOptions {
  limit?: number;
}

interface ActivityLogFilters {
  module?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
}

const EMPTY_META: PaginationMeta = { total: 0, page: 1, limit: PAGE_SIZE_DEFAULT, totalPages: 1 };
const EMPTY_FILTERS: ActivityLogFilters = {};

// ─── useActivityLogs ────────────────────────────────────────────────────────
// Mirrors useSessions.ts / useDesignations.ts. Filters are grouped into one
// object (rather than one useState per field) since the Activity Log page
// has more of them (module, action, date range) and they're always applied
// together from a single filter panel.
export const useActivityLogs = (options: UseActivityLogsOptions = {}) => {
  const limit = options.limit ?? PAGE_SIZE_DEFAULT;

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [page, setPageState] = useState(1);
  const [search, setSearchState] = useState("");
  const [filters, setFiltersState] = useState<ActivityLogFilters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    activityLogAPI
      .list({
        page,
        limit,
        search: search || undefined,
        module: filters.module || undefined,
        action: filters.action || undefined,
        date_from: filters.dateFrom || undefined,
        date_to: filters.dateTo || undefined,
      })
      .then((res) => {
        if (cancelled) return;
        setLogs(res.data);
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
  }, [page, limit, search, filters, reloadToken]);

  const setPage = useCallback((next: number) => {
    setLoading(true);
    setPageState(next);
  }, []);

  const changeSearch = useCallback((value: string) => {
    setLoading(true);
    setSearchState(value);
    setPageState(1);
  }, []);

  const changeFilters = useCallback((next: ActivityLogFilters) => {
    setLoading(true);
    setFiltersState(next);
    setPageState(1);
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return {
    logs,
    meta,
    page,
    setPage,
    search,
    changeSearch,
    filters,
    changeFilters,
    loading,
    error,
    refetch,
  };
};

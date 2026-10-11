import { useCallback, useEffect, useState } from "react";
import { leaveRequestAPI } from "../services/leaveRequest.service";
import { getApiErrorMessage } from "../services/employee.service";
import { PAGE_SIZE_DEFAULT } from "../services/employee.constants";
import type { LeaveRequest } from "../services/leaveRequest.types";
import type { PaginationMeta } from "../services/employee.types";

interface UseLeaveRequestsOptions {
  limit?: number;
}

const EMPTY_META: PaginationMeta = { total: 0, page: 1, limit: PAGE_SIZE_DEFAULT, totalPages: 1 };

// ─── useLeaveRequests ─────────────────────────────────────────────────────────
// Mirrors useLeaveTypes.ts/useDepartments.ts. Adds an optional leave_status
// filter (used by the "Pending" quick-filter tab on LeaveRequestsPage).
export const useLeaveRequests = (options: UseLeaveRequestsOptions = {}) => {
  const limit = options.limit ?? PAGE_SIZE_DEFAULT;

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [page, setPageState] = useState(1);
  const [search, setSearchState] = useState("");
  const [leaveStatus, setLeaveStatusState] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    leaveRequestAPI
      .list({ page, limit, search: search || undefined, leave_status: leaveStatus })
      .then((res) => {
        if (cancelled) return;
        setLeaveRequests(res.data);
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
  }, [page, limit, search, leaveStatus, reloadToken]);

  const setPage = useCallback((next: number) => {
    setLoading(true);
    setPageState(next);
  }, []);

  const changeSearch = useCallback((value: string) => {
    setLoading(true);
    setSearchState(value);
    setPageState(1);
  }, []);

  const changeLeaveStatusFilter = useCallback((value: number | undefined) => {
    setLoading(true);
    setLeaveStatusState(value);
    setPageState(1);
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return {
    leaveRequests,
    meta,
    page,
    setPage,
    search,
    changeSearch,
    leaveStatus,
    changeLeaveStatusFilter,
    loading,
    error,
    refetch,
  };
};
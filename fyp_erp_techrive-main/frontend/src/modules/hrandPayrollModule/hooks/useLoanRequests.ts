import { useCallback, useEffect, useState } from "react";
import { loanRequestAPI } from "../services/loanRequest.service";
import { getApiErrorMessage } from "../services/employee.service";
import { PAGE_SIZE_DEFAULT } from "../services/employee.constants";
import type { LoanRequest } from "../services/loanRequest.types";
import type { PaginationMeta } from "../services/employee.types";

interface UseLoanRequestsOptions {
  limit?: number;
}

const EMPTY_META: PaginationMeta = { total: 0, page: 1, limit: PAGE_SIZE_DEFAULT, totalPages: 1 };

// ─── useLoanRequests ──────────────────────────────────────────────────────
// Mirrors useLeaveRequests.ts exactly — page/search/status filter state,
// same loading/reset-on-filter-change rules.
export const useLoanRequests = (options: UseLoanRequestsOptions = {}) => {
  const limit = options.limit ?? PAGE_SIZE_DEFAULT;

  const [loanRequests, setLoanRequests] = useState<LoanRequest[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [page, setPageState] = useState(1);
  const [search, setSearchState] = useState("");
  const [status, setStatusState] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    loanRequestAPI
      .list({ page, limit, search: search || undefined, status })
      .then((res) => {
        if (cancelled) return;
        setLoanRequests(res.data);
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
  }, [page, limit, search, status, reloadToken]);

  const setPage = useCallback((next: number) => {
    setLoading(true);
    setPageState(next);
  }, []);

  const changeSearch = useCallback((value: string) => {
    setLoading(true);
    setSearchState(value);
    setPageState(1);
  }, []);

  const changeStatusFilter = useCallback((value: number | undefined) => {
    setLoading(true);
    setStatusState(value);
    setPageState(1);
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return {
    loanRequests,
    meta,
    page,
    setPage,
    search,
    changeSearch,
    status,
    changeStatusFilter,
    loading,
    error,
    refetch,
  };
};

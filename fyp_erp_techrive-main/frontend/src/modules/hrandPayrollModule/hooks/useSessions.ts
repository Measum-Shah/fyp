import { useCallback, useEffect, useState } from "react";
import { sessionLogAPI, getApiErrorMessage } from "../services/sessionLog.service";
import { PAGE_SIZE_DEFAULT } from "../services/employee.constants";
import type { LoginStatus, PaginationMeta, UserSession } from "../services/sessionLog.types";

interface UseSessionsOptions {
  limit?: number;
}

const EMPTY_META: PaginationMeta = { total: 0, page: 1, limit: PAGE_SIZE_DEFAULT, totalPages: 1 };

// ─── useSessions ─────────────────────────────────────────────────────────
// Mirrors useDesignations.ts's structure, with the extra is_active /
// login_status filters the Sessions monitoring page needs.
export const useSessions = (options: UseSessionsOptions = {}) => {
  const limit = options.limit ?? PAGE_SIZE_DEFAULT;

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [page, setPageState] = useState(1);
  const [search, setSearchState] = useState("");
  const [isActive, setIsActiveState] = useState<boolean | undefined>(undefined);
  const [loginStatus, setLoginStatusState] = useState<LoginStatus | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    sessionLogAPI
      .list({
        page,
        limit,
        search: search || undefined,
        is_active: isActive,
        login_status: loginStatus,
      })
      .then((res) => {
        if (cancelled) return;
        setSessions(res.data);
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
  }, [page, limit, search, isActive, loginStatus, reloadToken]);

  const setPage = useCallback((next: number) => {
    setLoading(true);
    setPageState(next);
  }, []);

  const changeSearch = useCallback((value: string) => {
    setLoading(true);
    setSearchState(value);
    setPageState(1);
  }, []);

  const changeIsActive = useCallback((value: boolean | undefined) => {
    setLoading(true);
    setIsActiveState(value);
    setPageState(1);
  }, []);

  const changeLoginStatus = useCallback((value: LoginStatus | undefined) => {
    setLoading(true);
    setLoginStatusState(value);
    setPageState(1);
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return {
    sessions,
    meta,
    page,
    setPage,
    search,
    changeSearch,
    isActive,
    changeIsActive,
    loginStatus,
    changeLoginStatus,
    loading,
    error,
    refetch,
  };
};

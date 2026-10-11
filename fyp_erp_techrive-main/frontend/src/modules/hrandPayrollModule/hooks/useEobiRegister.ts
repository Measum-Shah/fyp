import { useCallback, useEffect, useState } from "react";
import { eobiAPI } from "../services/eobi.service";
import { getApiErrorMessage } from "../services/employee.service";
import { PAGE_SIZE_DEFAULT } from "../services/employee.constants";
import type { EobiEntry } from "../services/eobi.types";
import type { PaginationMeta } from "../services/employee.types";

const EMPTY_META: PaginationMeta = { total: 0, page: 1, limit: PAGE_SIZE_DEFAULT, totalPages: 1 };

export const useEobiRegister = (options: { limit?: number } = {}) => {
  const limit = options.limit ?? PAGE_SIZE_DEFAULT;

  const [entries, setEntries] = useState<EobiEntry[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [page, setPageState] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    eobiAPI
      .list({ page, limit })
      .then((res) => {
        if (cancelled) return;
        setEntries(res.data);
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
  }, [page, limit, reloadToken]);

  const setPage = useCallback((next: number) => { setLoading(true); setPageState(next); }, []);
  const refetch = useCallback(() => { setLoading(true); setReloadToken((t) => t + 1); }, []);

  return { entries, meta, page, setPage, loading, error, refetch };
};
import { useCallback, useEffect, useState } from "react";
import { resignationAPI } from "../services/resignation.service";
import { getApiErrorMessage } from "../services/employee.service";
import { PAGE_SIZE_DEFAULT } from "../services/employee.constants";
import type { Resignation } from "../services/resignation.types";
import type { PaginationMeta } from "../services/employee.types";

const EMPTY_META: PaginationMeta = { total: 0, page: 1, limit: PAGE_SIZE_DEFAULT, totalPages: 1 };

export const useResignations = (options: { limit?: number } = {}) => {
  const limit = options.limit ?? PAGE_SIZE_DEFAULT;

  const [resignations, setResignations] = useState<Resignation[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [page, setPageState] = useState(1);
  const [search, setSearchState] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    resignationAPI
      .list({ page, limit, search: search || undefined })
      .then((res) => {
        if (cancelled) return;
        setResignations(res.data);
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
  }, [page, limit, search, reloadToken]);

  const setPage = useCallback((next: number) => { setLoading(true); setPageState(next); }, []);
  const changeSearch = useCallback((value: string) => { setLoading(true); setSearchState(value); setPageState(1); }, []);
  const refetch = useCallback(() => { setLoading(true); setReloadToken((t) => t + 1); }, []);

  return { resignations, meta, page, setPage, search, changeSearch, loading, error, refetch };
};

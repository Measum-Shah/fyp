import { useCallback, useEffect, useState } from "react";
import { allowanceTypeAPI } from "../services/allowanceType.service";
import { getApiErrorMessage } from "../services/employee.service";
import { PAGE_SIZE_DEFAULT } from "../services/employee.constants";
import type { AllowanceType } from "../services/allowanceType.types";
import type { PaginationMeta } from "../services/employee.types";

const EMPTY_META: PaginationMeta = { total: 0, page: 1, limit: PAGE_SIZE_DEFAULT, totalPages: 1 };

export const useAllowanceTypes = (options: { limit?: number } = {}) => {
  const limit = options.limit ?? PAGE_SIZE_DEFAULT;

  const [allowanceTypes, setAllowanceTypes] = useState<AllowanceType[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [page, setPageState] = useState(1);
  const [search, setSearchState] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    allowanceTypeAPI
      .list({ page, limit, search: search || undefined })
      .then((res) => {
        if (cancelled) return;
        setAllowanceTypes(res.data);
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

  return { allowanceTypes, meta, page, setPage, search, changeSearch, loading, error, refetch };
};

// ─── useAllowanceTypeLookup ──────────────────────────────────────────────────
// Unpaginated, active-only list for the Salary Sheet form's allowance picker.
export const useAllowanceTypeLookup = () => {
  const [allowanceTypes, setAllowanceTypes] = useState<AllowanceType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    allowanceTypeAPI
      .lookup()
      .then((res) => {
        if (!cancelled) {
          setAllowanceTypes(res.data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { allowanceTypes, loading };
};

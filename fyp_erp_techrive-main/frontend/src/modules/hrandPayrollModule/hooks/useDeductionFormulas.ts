import { useCallback, useEffect, useState } from "react";
import { deductionFormulaAPI } from "../services/payrollDeductionFormula.service";
import { getApiErrorMessage } from "../services/employee.service";
import { PAGE_SIZE_DEFAULT } from "../services/employee.constants";
import type { DeductionFormula } from "../services/payrollDeductionFormula.types";
import type { PaginationMeta } from "../services/employee.types";

const EMPTY_META: PaginationMeta = { total: 0, page: 1, limit: PAGE_SIZE_DEFAULT, totalPages: 1 };

export const useDeductionFormulas = (options: { limit?: number } = {}) => {
  const limit = options.limit ?? PAGE_SIZE_DEFAULT;

  const [deductionFormulas, setDeductionFormulas] = useState<DeductionFormula[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [page, setPageState] = useState(1);
  const [search, setSearchState] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    deductionFormulaAPI
      .list({ page, limit, search: search || undefined })
      .then((res) => {
        if (cancelled) return;
        setDeductionFormulas(res.data);
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

  return { deductionFormulas, meta, page, setPage, search, changeSearch, loading, error, refetch };
};

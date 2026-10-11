import { useCallback, useEffect, useState } from "react";
import { reportAPI } from "../services/report.service";
import { getApiErrorMessage } from "../services/employee.service";
import type {
  ContractProbationExpiryParams,
  ContractProbationExpiryRow,
} from "../services/report.types";

// ─── useContractProbationExpiryReport ────────────────────────────────────────
// Same auto-fetch-with-defaults shape as useCnicExpiryReport — from/to are
// optional, the backend applies the same 90-day forward window when omitted.
export const useContractProbationExpiryReport = (params: ContractProbationExpiryParams = {}) => {
  const [filters, setFilters] = useState<ContractProbationExpiryParams>(params);
  const [rows, setRows] = useState<ContractProbationExpiryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    reportAPI
      .contractProbationExpiry(filters)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
        setTotal(res.meta.total);
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
  }, [filters, reloadToken]);

  const refetch = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  return { rows, total, filters, setFilters, loading, error, refetch };
};

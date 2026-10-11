import { useCallback, useEffect, useState } from "react";
import { reportAPI } from "../services/report.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { CnicExpiryParams, CnicExpiryRow } from "../services/report.types";

// ─── useCnicExpiryReport ─────────────────────────────────────────────────────
// Auto-fetches on mount and whenever `filters` changes — unlike
// useJoinersExitsReport, from/to are optional (the backend defaults to
// "today .. today + 90 days" when omitted), so there's always a sensible
// result to show without requiring the user to pick dates first. Used by
// both the full CNIC Expiry Report page and the dashboard widget (which
// just calls it with no filters).
export const useCnicExpiryReport = (params: CnicExpiryParams = {}) => {
  const [filters, setFilters] = useState<CnicExpiryParams>(params);
  const [rows, setRows] = useState<CnicExpiryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    reportAPI
      .cnicExpiry(filters)
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

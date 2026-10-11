import { useCallback, useEffect, useState } from "react";
import { performanceAPI } from "../services/performance.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { Performance } from "../services/performance.types";

// ─── usePerformancesByStaff ───────────────────────────────────────────────────
// Scoped to a single employee (staffId) — used by PerformancePanel, embedded
// inside the Employee Profile page's "Performance Reviews" tab rather than
// the standalone PerformancesPage list.
export const usePerformancesByStaff = (staffId: number | undefined) => {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!staffId) {
      setPerformances([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    performanceAPI
      .list({ staff_id: staffId, limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setPerformances(res.data);
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
  }, [staffId, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { performances, loading, error, refetch };
};
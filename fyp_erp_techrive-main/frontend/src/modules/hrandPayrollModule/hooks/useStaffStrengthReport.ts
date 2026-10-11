import { useCallback, useEffect, useState } from "react";
import { reportAPI } from "../services/report.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { StaffStrengthData } from "../services/report.types";

// ─── useStaffStrengthReport ──────────────────────────────────────────────────
// Mirrors useEmployeeAnalyticsReport exactly — a single no-params GET that
// composes headcount-by-department/branch with staff-type/job-status
// breakdowns server-side (see report.service.ts's getStaffStrengthReport).
export const useStaffStrengthReport = () => {
  const [data, setData] = useState<StaffStrengthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    reportAPI
      .staffStrength()
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
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
  }, [reloadToken]);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return { data, loading, error, refetch };
};

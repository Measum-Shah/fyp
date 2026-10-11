import { useCallback, useEffect, useState } from "react";
import { payrollReportAPI } from "../services/payrollReport.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { PayrollRunSummaryParams, PayrollRunSummaryRow } from "../services/payrollReport.types";

// ─── usePayrollRunSummaryReport ──────────────────────────────────────────────
// Small aggregate report (one row per branch+month run) — filters refetch
// directly, no pagination needed (mirrors useHeadcountByDepartmentReport.ts's
// "small aggregate, no page state" shape, just with filters added).
export const usePayrollRunSummaryReport = () => {
  const [filters, setFiltersState] = useState<PayrollRunSummaryParams>({});
  const [rows, setRows] = useState<PayrollRunSummaryRow[]>([]);
  const [totalRuns, setTotalRuns] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    payrollReportAPI
      .payrollRunSummary(filters)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
        setTotalRuns(res.meta.totalRuns);
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

  const setFilters = useCallback((next: PayrollRunSummaryParams) => {
    setLoading(true);
    setFiltersState(next);
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return { rows, totalRuns, filters, setFilters, loading, error, refetch };
};

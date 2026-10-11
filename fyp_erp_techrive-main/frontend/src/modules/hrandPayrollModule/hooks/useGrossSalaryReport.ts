import { useCallback, useEffect, useState } from "react";
import { payrollReportAPI } from "../services/payrollReport.service";
import { getApiErrorMessage } from "../services/employee.service";
import type {
  GrossSalaryParams,
  GrossSalaryReportResponse,
  GrossSalaryRow,
} from "../services/payrollReport.types";

type GrossSalaryMeta = GrossSalaryReportResponse["meta"];

const EMPTY_META: GrossSalaryMeta = {
  employeeCount: 0,
  totalGross: 0,
  totalNet: 0,
  totalAllowances: 0,
  totalDeductions: 0,
  month_id: "",
  year_id: 0,
  allowanceColumns: [],
  deductionColumns: [],
  payrollDeductionColumns: [],
};

// ─── useGrossSalaryReport ─────────────────────────────────────────────────────
// Auto-fetches on mount with no params, which the backend resolves to "the
// current calendar month" (see payrollReport.service.ts's currentMonthYear
// default) — so both the full report page and the dashboard widget get
// "how much did we pay this month" for free on first paint.
export const useGrossSalaryReport = (params: GrossSalaryParams = {}) => {
  const [filters, setFilters] = useState<GrossSalaryParams>(params);
  const [rows, setRows] = useState<GrossSalaryRow[]>([]);
  const [meta, setMeta] = useState(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    payrollReportAPI
      .grossSalary(filters)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, reloadToken]);

  const refetch = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  return { rows, meta, filters, setFilters, loading, error, refetch };
};
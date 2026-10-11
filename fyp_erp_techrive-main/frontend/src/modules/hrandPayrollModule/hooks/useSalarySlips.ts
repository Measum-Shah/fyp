import { useCallback, useState } from "react";
import { payrollReportAPI } from "../services/payrollReport.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { SalarySlipRow, SalarySlipsParams } from "../services/payrollReport.types";

// ─── useSalarySlips ───────────────────────────────────────────────────────────
// Same "no sensible default, wait for an explicit Generate" shape as
// useJoinersExitsReport — month_id/year_id are required (see
// salarySlipsQuerySchema), so this never auto-fetches on mount. The page
// calls `run({ month_id, year_id, ... })` once the user has picked a month.
export const useSalarySlips = () => {
  const [rows, setRows] = useState<SalarySlipRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const run = useCallback(async (params: SalarySlipsParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await payrollReportAPI.salarySlips(params);
      setRows(res.data);
      setHasRun(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setRows([]);
    setHasRun(false);
    setError(null);
  }, []);

  return { rows, loading, error, hasRun, run, reset };
};

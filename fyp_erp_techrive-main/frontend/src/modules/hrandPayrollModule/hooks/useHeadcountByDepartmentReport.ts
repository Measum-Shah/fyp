import { useCallback, useEffect, useState } from "react";
import { reportAPI } from "../services/report.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { HeadcountRow } from "../services/report.types";

// ─── useHeadcountByDepartmentReport ──────────────────────────────────────────
// Small aggregate report (one row per department) — no filters, no
// pagination, fetched once on mount with a manual refetch.
export const useHeadcountByDepartmentReport = () => {
  const [rows, setRows] = useState<HeadcountRow[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    reportAPI
      .headcountByDepartment()
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
        setTotalEmployees(res.meta.totalEmployees);
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

  return { rows, totalEmployees, loading, error, refetch };
};
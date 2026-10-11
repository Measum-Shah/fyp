import { useCallback, useEffect, useState } from "react";
import { payrollRunAPI } from "../services/payrollRun.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { PayrollRunMember } from "../services/payrollRun.types";
import type { PaginationMeta } from "../services/employee.types";

const EMPTY_META: PaginationMeta = { total: 0, page: 1, limit: 100, totalPages: 1 };

// ─── usePayrollRunMembers ─────────────────────────────────────────────────────
// Fetches the members of a specific branch + month_year payroll run. Only
// fetches once both branch_id and month_year are set — a run is always
// scoped to one branch/month, unlike the other Payroll & Salary lists which
// show everything by default.
export const usePayrollRunMembers = (branchId: number | null, monthYear: string) => {
  const [members, setMembers] = useState<PayrollRunMember[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!branchId || !monthYear) {
      setMembers([]);
      setMeta(EMPTY_META);
      return;
    }

    let cancelled = false;
    setLoading(true);

    payrollRunAPI
      .list({ branch_id: branchId, month_year: monthYear, page, limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setMembers(res.data);
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
  }, [branchId, monthYear, page, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { members, meta, page, setPage, loading, error, refetch };
};

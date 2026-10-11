import { useCallback, useEffect, useState } from "react";
import { leaveEntitlementAPI } from "../services/leaveEntitlement.service";
import { getApiErrorMessage } from "../services/employee.service";
import { PAGE_SIZE_DEFAULT } from "../services/employee.constants";
import type { LeaveEntitlement } from "../services/leaveEntitlement.types";
import type { PaginationMeta } from "../services/employee.types";

interface UseLeaveEntitlementsOptions {
  limit?: number;
}

const EMPTY_META: PaginationMeta = { total: 0, page: 1, limit: PAGE_SIZE_DEFAULT, totalPages: 1 };

// ─── useLeaveEntitlements ─────────────────────────────────────────────────────
// Mirrors useLeaveTypes.ts. No text `search` param — the Leave Entitlements
// list is filtered by employee_id/leave_type_id dropdowns instead (there's
// no name column on this table itself to search against).
export const useLeaveEntitlements = (options: UseLeaveEntitlementsOptions = {}) => {
  const limit = options.limit ?? PAGE_SIZE_DEFAULT;

  const [entitlements, setEntitlements] = useState<LeaveEntitlement[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [page, setPageState] = useState(1);
  const [employeeId, setEmployeeIdState] = useState<number | undefined>(undefined);
  const [leaveTypeId, setLeaveTypeIdState] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    leaveEntitlementAPI
      .list({ page, limit, employee_id: employeeId, leave_type_id: leaveTypeId })
      .then((res) => {
        if (cancelled) return;
        setEntitlements(res.data);
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
  }, [page, limit, employeeId, leaveTypeId, reloadToken]);

  const setPage = useCallback((next: number) => {
    setLoading(true);
    setPageState(next);
  }, []);

  const changeEmployeeFilter = useCallback((value: number | undefined) => {
    setLoading(true);
    setEmployeeIdState(value);
    setPageState(1);
  }, []);

  const changeLeaveTypeFilter = useCallback((value: number | undefined) => {
    setLoading(true);
    setLeaveTypeIdState(value);
    setPageState(1);
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return {
    entitlements,
    meta,
    page,
    setPage,
    employeeId,
    changeEmployeeFilter,
    leaveTypeId,
    changeLeaveTypeFilter,
    loading,
    error,
    refetch,
  };
};
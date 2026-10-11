import { useCallback, useEffect, useState } from "react";
import { employeeAPI, getApiErrorMessage } from "../services/employee.service";
import type { Employee } from "../services/employee.types";

// ─── useEmployee ──────────────────────────────────────────────────────────────
// Fetches a single employee by id, used by EditEmployeePage. An invalid id
// (missing/NaN route param) is treated as a derived render-time condition
// rather than stored in state — the effect simply skips running in that
// case — so no setState call ever happens synchronously at the top of the
// effect body (satisfies react-hooks/set-state-in-effect, same approach as
// useEmployees.ts).
export const useEmployee = (id: number | undefined) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const isValidId = id !== undefined && !Number.isNaN(id);

  useEffect(() => {
    if (!isValidId || id === undefined) return;

    let cancelled = false;

    employeeAPI
      .getById(id)
      .then((res) => {
        if (cancelled) return;
        setEmployee(res.data);
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
  }, [id, isValidId, reloadToken]);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return {
    employee,
    loading: isValidId ? loading : false,
    error: isValidId ? error : "Invalid employee id",
    refetch,
  };
};
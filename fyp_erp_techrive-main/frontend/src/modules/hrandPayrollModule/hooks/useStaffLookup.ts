import { useEffect, useState } from "react";
import { employeeAPI, getApiErrorMessage } from "../services/employee.service";
import type { StaffLookupOption } from "../services/employee.types";

interface StaffLookupState {
  staff: StaffLookupOption[];
  loading: boolean;
  error: string | null;
}

// ─── useStaffLookup ───────────────────────────────────────────────────────────
// Fetches the shared "pick an employee" dropdown once on mount. Reused by
// every Payroll & Salary feature (Bank Accounts, Salary Sheet, Loans,
// Increments, EOBI/EPF Register) — same shape as useCompanies.ts, which this
// mirrors, but pointed at employeeAPI.lookups.staff() instead of
// branchAPI.lookups.companies().
export const useStaffLookup = () => {
  const [state, setState] = useState<StaffLookupState>({
    staff: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    employeeAPI.lookups
      .staff()
      .then((res) => {
        if (cancelled) return;
        setState({ staff: res.data, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false, error: getApiErrorMessage(err) }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
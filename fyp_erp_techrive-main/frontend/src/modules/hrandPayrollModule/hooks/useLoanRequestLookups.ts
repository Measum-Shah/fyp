import { useEffect, useState } from "react";
import { employeeAPI, getApiErrorMessage } from "../services/employee.service";
import { loanRequestAPI } from "../services/loanRequest.service";
import type { LookupOption } from "../services/employee.types";
import type { EmployeeLookupOption } from "../services/loanRequest.types";

interface LoanRequestLookupsState {
  employees: EmployeeLookupOption[];
  branches: LookupOption[];
  loading: boolean;
  error: string | null;
}

// ─── useLoanRequestLookups ────────────────────────────────────────────────
// Fetches the Loan Request form's lookups — mirrors useLeaveRequestLookups.ts,
// minus leaveTypes/leaveStatuses since loan status is a fixed enum here, not
// an admin-managed lookup table.
//
// companyId scopes the branches lookup (see the Company→Branch scoping
// task) and re-fetches branches whenever it changes. Omitted entirely, it
// keeps the legacy system-wide branch list — LoanRequestsPage.tsx's branch
// name lookup doesn't have a Company selector, so it still calls this with
// no args.
export const useLoanRequestLookups = (companyId?: number | null) => {
  const [state, setState] = useState<LoanRequestLookupsState>({
    employees: [],
    branches: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [employees, branches] = await Promise.all([
          loanRequestAPI.lookups.employees(),
          companyId === null
            ? Promise.resolve({ data: [] as LookupOption[] })
            : employeeAPI.lookups.branches(companyId ?? undefined),
        ]);

        if (cancelled) return;
        setState({
          employees: employees.data,
          branches: branches.data,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false, error: getApiErrorMessage(err) }));
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return state;
};

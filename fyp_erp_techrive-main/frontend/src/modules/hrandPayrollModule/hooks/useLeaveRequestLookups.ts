import { useEffect, useState } from "react";
import { employeeAPI, getApiErrorMessage } from "../services/employee.service";
import { leaveTypeAPI } from "../services/leaveType.service";
import { leaveStatusAPI } from "../services/leaveStatus.service";
import { leaveRequestAPI } from "../services/leaveRequest.service";
import type { LookupOption } from "../services/employee.types";
import type { EmployeeLookupOption } from "../services/leaveRequest.types";

interface LeaveRequestLookupsState {
  employees: EmployeeLookupOption[];
  leaveTypes: LookupOption[];
  leaveStatuses: LookupOption[];
  branches: LookupOption[];
  loading: boolean;
  error: string | null;
}

// ─── useLeaveRequestLookups ───────────────────────────────────────────────────
// Fetches all four Leave Request form lookups, same pattern as useLookups.ts
// (Employee form). Branches reuse employeeAPI.lookups.branches rather than
// duplicating a second "list branches" endpoint.
//
// companyId scopes the branches lookup (see the Company→Branch scoping
// task) and re-fetches branches whenever it changes. Omitted entirely, it
// keeps the legacy system-wide branch list.
export const useLeaveRequestLookups = (companyId?: number | null) => {
  const [state, setState] = useState<LeaveRequestLookupsState>({
    employees: [],
    leaveTypes: [],
    leaveStatuses: [],
    branches: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [employees, leaveTypes, leaveStatuses, branches] = await Promise.all([
          leaveRequestAPI.lookups.employees(),
          leaveTypeAPI.lookup(),
          leaveStatusAPI.lookup(),
          companyId === null
            ? Promise.resolve({ data: [] as LookupOption[] })
            : employeeAPI.lookups.branches(companyId ?? undefined),
        ]);

        if (cancelled) return;
        setState({
          employees: employees.data,
          leaveTypes: leaveTypes.data,
          leaveStatuses: leaveStatuses.data,
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
import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../services/employee.service";
import { leaveTypeAPI } from "../services/leaveType.service";
import { leaveRequestAPI } from "../services/leaveRequest.service";
import type { LookupOption } from "../services/employee.types";
import type { EmployeeLookupOption } from "../services/leaveRequest.types";

interface LeaveEntitlementLookupsState {
  employees: EmployeeLookupOption[];
  leaveTypes: LookupOption[];
  loading: boolean;
  error: string | null;
}

// ─── useLeaveEntitlementLookups ───────────────────────────────────────────────
// Fetches the two Leave Entitlement form lookups once on mount. Reuses the
// same employees lookup endpoint as useLeaveRequestLookups.ts (defined on
// leaveRequest.routes.ts since that's where it was first needed) rather than
// duplicating it under leave-entitlements.
export const useLeaveEntitlementLookups = () => {
  const [state, setState] = useState<LeaveEntitlementLookupsState>({
    employees: [],
    leaveTypes: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [employees, leaveTypes] = await Promise.all([
          leaveRequestAPI.lookups.employees(),
          leaveTypeAPI.lookup(),
        ]);

        if (cancelled) return;
        setState({
          employees: employees.data,
          leaveTypes: leaveTypes.data,
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
  }, []);

  return state;
};
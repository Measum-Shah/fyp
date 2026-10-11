import { useEffect, useState } from "react";
import { employeeAPI, getApiErrorMessage } from "../services/employee.service";
import type { LookupOption } from "../services/employee.types";

interface LookupsState {
  departments: LookupOption[];
  branches: LookupOption[];
  designations: LookupOption[];
  staffTypes: LookupOption[];
  loading: boolean;
  error: string | null;
}

// ─── useLookups ───────────────────────────────────────────────────────────────
// Fetches all four Employee-form lookups once on mount. Used by:
//  - EmployeeListPage, to resolve department_id -> department name for display
//  - AddEmployeePage / EditEmployeePage (later step), to populate dropdowns
// A single shared hook avoids re-fetching the same lookups from every page.
export const useLookups = () => {
  const [state, setState] = useState<LookupsState>({
    departments: [],
    branches: [],
    designations: [],
    staffTypes: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [departments, branches, designations, staffTypes] =
          await Promise.all([
            employeeAPI.lookups.departments(),
            employeeAPI.lookups.branches(),
            employeeAPI.lookups.designations(),
            employeeAPI.lookups.staffTypes(),
          ]);

        if (cancelled) return;
        setState({
          departments: departments.data,
          branches: branches.data,
          designations: designations.data,
          staffTypes: staffTypes.data,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: getApiErrorMessage(err),
        }));
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
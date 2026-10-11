import { useEffect, useState } from "react";
import { employeeAPI, getApiErrorMessage } from "../services/employee.service";
import type { LookupOption } from "../services/employee.types";

interface BranchesLookupState {
  branches: LookupOption[];
  loading: boolean;
  error: string | null;
}

// ─── useBranchesLookup ────────────────────────────────────────────────────────
// Fetches the branches lookup, for the Work Shift form's Branch dropdown (and
// now every other Company→Branch scoped selector — see the Company→Branch
// scoping task). Reuses the existing /employees/lookups/branches endpoint
// (same one useLookups.ts uses) rather than adding a new endpoint.
//
// companyId scopes the result to that company's branches and re-fetches
// whenever it changes. Two distinct "no value" states, on purpose:
//  - omitted entirely (call with zero args) — legacy fallback, fetches the
//    system-wide list, for the callers not yet converted to a
//    Company→Branch flow (see the Company→Branch scoping task's call-site
//    list — every one of these should eventually pass a real companyId).
//  - explicit `null` — the caller HAS a Company selector but nothing is
//    chosen yet, so this returns [] (task: "Branch dropdown should be
//    disabled/empty-state until a Company is chosen").
export const useBranchesLookup = (companyId?: number | null) => {
  const [state, setState] = useState<BranchesLookupState>({
    branches: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    if (companyId === null) {
      setState({ branches: [], loading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    employeeAPI.lookups
      .branches(companyId)
      .then((res) => {
        if (cancelled) return;
        setState({ branches: res.data, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false, error: getApiErrorMessage(err) }));
      });

    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return state;
};
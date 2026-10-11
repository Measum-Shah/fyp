import { useEffect, useState } from "react";
import { branchAPI } from "../services/branch.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { LookupOption } from "../services/employee.types";

interface CompanyLookupState {
  companies: LookupOption[];
  loading: boolean;
  error: string | null;
}

// ─── useCompanyLookup ─────────────────────────────────────────────────────────
// Thin wrapper around the existing branchAPI.lookups.companies() endpoint
// (already used by the Branch feature) — reused here for the EOBI/EPF
// Register's optional Company field rather than duplicating the endpoint.
export const useCompanyLookup = () => {
  const [state, setState] = useState<CompanyLookupState>({ companies: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    branchAPI.lookups
      .companies()
      .then((res) => {
        if (cancelled) return;
        setState({ companies: res.data, loading: false, error: null });
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

import { useEffect, useState } from "react";
import { branchAPI } from "../services/branch.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { LookupOption } from "../services/employee.types";

interface CompaniesState {
  companies: LookupOption[];
  loading: boolean;
  error: string | null;
}

// ─── useCompanies ─────────────────────────────────────────────────────────────
// Fetches the companies lookup once on mount, for the Branch form's Company
// dropdown. Small and single-purpose, unlike useLookups.ts (which serves 4
// different Employee-form lookups) — kept as its own hook rather than folded
// in there, since Branch and Employee forms have no overlap in what they need.
export const useCompanies = () => {
  const [state, setState] = useState<CompaniesState>({
    companies: [],
    loading: true,
    error: null,
  });

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
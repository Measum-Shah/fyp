import { useEffect, useState } from "react";
import { employeeAPI, getApiErrorMessage } from "../services/employee.service";
import type { EmployeeSearchOption } from "../services/employee.types";

const DEBOUNCE_MS = 300;

// ─── useEmployeeSearchLookup ──────────────────────────────────────────────────
// Debounced search-as-you-type for the Attendance form's employee picker —
// backs onto GET /employees/lookups/search (see employee.service.ts's
// employeeAPI.lookups.search), since the full employee list can be too large
// to load as a single static dropdown (unlike Branches/Departments).
export const useEmployeeSearchLookup = (query: string) => {
  const [results, setResults] = useState<EmployeeSearchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const timer = setTimeout(() => {
      employeeAPI.lookups
        .search(query.trim() || undefined)
        .then((res) => {
          if (cancelled) return;
          setResults(res.data);
          setError(null);
          setLoading(false);
        })
        .catch((err) => {
          if (cancelled) return;
          setError(getApiErrorMessage(err));
          setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  return { results, loading, error };
};
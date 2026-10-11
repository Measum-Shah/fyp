import { useCallback, useEffect, useState } from "react";
import { familyAPI } from "../services/family.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { Family } from "../services/family.types";

// ─── useFamiliesByStaff ───────────────────────────────────────────────────────
// Scoped to a single employee (staffId) — used by FamilyPanel, embedded
// inside the Employee Profile page's "Family Members" tab rather than the
// standalone FamiliesPage list. Mirrors useStaffQualifications.ts.
export const useFamiliesByStaff = (staffId: number | undefined) => {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!staffId) {
      setFamilies([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    familyAPI
      .list({ staff_id: staffId, limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setFamilies(res.data);
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
  }, [staffId, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { families, loading, error, refetch };
};
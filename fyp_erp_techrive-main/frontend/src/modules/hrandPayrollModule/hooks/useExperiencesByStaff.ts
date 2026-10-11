import { useCallback, useEffect, useState } from "react";
import { experienceAPI } from "../services/experience.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { Experience } from "../services/experience.types";

// ─── useExperiencesByStaff ────────────────────────────────────────────────────
// Scoped to a single employee (staffId) — used by ExperiencesPanel, which is
// embedded directly inside the Employee Profile page's "Experience" tab
// rather than the standalone ExperiencesPage list. Fetches the max page size
// in one call since a single employee will only ever have a handful of
// experience records. Mirrors useStaffQualifications.ts / useStaffAssets.ts.
export const useExperiencesByStaff = (staffId: number | undefined) => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!staffId) {
      setExperiences([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    experienceAPI
      .list({ staff_id: staffId, limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setExperiences(res.data);
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

  return { experiences, loading, error, refetch };
};
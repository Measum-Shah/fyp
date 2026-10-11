import { useCallback, useEffect, useState } from "react";
import { staffQualificationAPI } from "../services/staffQualification.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { StaffQualification } from "../services/staffQualification.types";

// ─── useStaffQualifications ───────────────────────────────────────────────────
// Scoped to a single employee (staffId) — used by StaffQualificationsPanel,
// which is embedded directly inside EmployeeDetailsPage rather than a
// standalone list page. Fetches the max page size in one call since a
// single employee will only ever have a handful of qualification records.
export const useStaffQualifications = (staffId: number | undefined) => {
  const [qualifications, setQualifications] = useState<StaffQualification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!staffId) {
      setQualifications([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    staffQualificationAPI
      .list({ staff_id: staffId, limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setQualifications(res.data);
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

  return { qualifications, loading, error, refetch };
};
import { useCallback, useEffect, useState } from "react";
import { staffAssetAPI } from "../services/staffAsset.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { StaffAsset } from "../services/staffAsset.types";

// ─── useStaffAssets ───────────────────────────────────────────────────────────
// Scoped to a single employee (staffId) — used by StaffAssetsPanel, which is
// embedded directly inside EmployeeDetailsPage rather than a standalone list
// page. Fetches the max page size in one call since a single employee will
// only ever have a handful of assigned assets.
export const useStaffAssets = (staffId: number | undefined) => {
  const [assets, setAssets] = useState<StaffAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!staffId) {
      setAssets([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    staffAssetAPI
      .list({ staff_id: staffId, limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setAssets(res.data);
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

  return { assets, loading, error, refetch };
};
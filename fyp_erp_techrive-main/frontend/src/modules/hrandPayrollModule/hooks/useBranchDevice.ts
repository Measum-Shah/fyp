import { useCallback, useEffect, useState } from "react";
import { branchAPI } from "../services/branch.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { Branch } from "../services/branch.types";

// ─── useBranchDevice ──────────────────────────────────────────────────────────
// Fetches a single branch by id — mirrors useEmployee.ts exactly. Used by
// BiometricDevicesPage.tsx to load the selected branch's ip/port (and to
// refetch after they're edited), reusing the existing branchAPI rather than
// adding a device-specific "get config" endpoint.
export const useBranchDevice = (id: number | undefined) => {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const isValidId = id !== undefined && !Number.isNaN(id);

  useEffect(() => {
    if (!isValidId || id === undefined) {
      setBranch(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    branchAPI
      .getById(id)
      .then((res) => {
        if (cancelled) return;
        setBranch(res.data);
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
  }, [id, isValidId, reloadToken]);

  const refetch = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  return { branch, loading, error, refetch };
};

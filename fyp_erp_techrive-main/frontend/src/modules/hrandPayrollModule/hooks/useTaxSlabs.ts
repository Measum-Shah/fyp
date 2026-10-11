import { useCallback, useEffect, useState } from "react";
import { taxSlabAPI } from "../services/taxSlab.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { TaxSlab } from "../services/taxSlab.types";

// ─── useTaxSlabsForFiscalYear ────────────────────────────────────────────────
// Drives the Tax Slabs page's ladder view: every active/inactive slab for
// one selected fiscal year, unpaginated (a ladder of 5-8 rows doesn't need
// pagination, and the whole point is to see it as one ordered list).
export const useTaxSlabsForFiscalYear = (fiscalYearId: number | null) => {
  const [slabs, setSlabs] = useState<TaxSlab[]>([]);
  const [missingUnboundedTopSlabWarning, setMissingUnboundedTopSlabWarning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (fiscalYearId === null) {
      setSlabs([]);
      setMissingUnboundedTopSlabWarning(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    taxSlabAPI
      .listForFiscalYear(fiscalYearId)
      .then((res) => {
        if (cancelled) return;
        setSlabs(res.data);
        setMissingUnboundedTopSlabWarning(res.missing_unbounded_top_slab_warning);
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
  }, [fiscalYearId, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { slabs, missingUnboundedTopSlabWarning, loading, error, refetch };
};

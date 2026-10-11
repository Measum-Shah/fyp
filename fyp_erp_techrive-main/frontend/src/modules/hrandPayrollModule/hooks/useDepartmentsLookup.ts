import { useEffect, useState } from "react";
import { employeeAPI } from "../services/employee.service";
import type { LookupOption } from "../services/employee.types";

// ─── useDepartmentsLookup ───────────────────────────────────────────────────
// Third link in the School/University → Campus → Department cascade —
// mirrors useBranchesLookup's company-scoping pattern exactly, one level
// down: pass the selected Campus's id (branch_id) and this returns only the
// departments actually offered there (via the branch_departments join
// table — see lookup.service.ts's listDepartments). Passing undefined/null
// (no Campus selected yet) returns an empty list rather than "all
// departments system-wide" — a Department genuinely doesn't make sense to
// pick before its Campus is chosen, unlike Branch, which has a real
// system-wide list when no Company is selected.
export const useDepartmentsLookup = (branchId?: number | null) => {
  const [departments, setDepartments] = useState<LookupOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!branchId) {
      setDepartments([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    employeeAPI.lookups
      .departments(branchId)
      .then((res) => {
        if (!cancelled) setDepartments(res.data);
      })
      .catch(() => {
        if (!cancelled) setDepartments([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [branchId]);

  return { departments, loading };
};

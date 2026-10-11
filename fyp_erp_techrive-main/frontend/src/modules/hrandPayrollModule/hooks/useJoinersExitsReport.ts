import { useCallback, useState } from "react";
import { reportAPI } from "../services/report.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { JoinersExitsData, JoinersExitsParams } from "../services/report.types";

// ─── useJoinersExitsReport ────────────────────────────────────────────────────
// Unlike the other report hooks, this one does NOT auto-fetch on mount —
// `from`/`to` are required query params with no sensible default range, so
// the page calls `run({ from, to })` explicitly once the user has picked
// both dates (e.g. from a "Generate report" button). `hasRun` lets the page
// tell "never generated yet" apart from "generated, zero results".
export const useJoinersExitsReport = () => {
  const [data, setData] = useState<JoinersExitsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const run = useCallback(async (params: JoinersExitsParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportAPI.joinersAndExits(params);
      setData(res.data);
      setHasRun(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, hasRun, run };
};
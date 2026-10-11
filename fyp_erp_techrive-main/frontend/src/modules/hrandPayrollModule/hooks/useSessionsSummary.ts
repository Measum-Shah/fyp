import { useEffect, useState } from "react";
import { sessionLogAPI } from "../services/sessionLog.service";
import type { SessionsSummary } from "../services/sessionLog.types";

// ─── useSessionsSummary ────────────────────────────────────────────────────
// Small standalone hook (not folded into useSessions.ts) so a dashboard
// widget can show "N users online" without paying for the full paginated
// session list — same separation-of-concerns reasoning as report.controller.ts
// keeping summary vs. detail endpoints apart.
export const useSessionsSummary = () => {
  const [summary, setSummary] = useState<SessionsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    sessionLogAPI
      .summary()
      .then((res) => {
        if (cancelled) return;
        setSummary(res.data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { summary, loading };
};

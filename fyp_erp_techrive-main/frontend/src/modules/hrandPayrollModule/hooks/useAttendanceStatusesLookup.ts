import { useEffect, useState } from "react";
import { attendanceStatusAPI } from "../services/attendanceStatus.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { AttendanceStatus } from "../services/attendanceStatus.types";

interface AttendanceStatusesLookupState {
  statuses: AttendanceStatus[];
  loading: boolean;
  error: string | null;
}

// ─── useAttendanceStatusesLookup ──────────────────────────────────────────────
// Fetches the active-only attendance status lookup once on mount, for the
// Attendance form's Status dropdown. Same small single-purpose pattern as
// useBranchesLookup.ts.
export const useAttendanceStatusesLookup = () => {
  const [state, setState] = useState<AttendanceStatusesLookupState>({
    statuses: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    attendanceStatusAPI
      .lookup()
      .then((res) => {
        if (cancelled) return;
        setState({ statuses: res.data, loading: false, error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, loading: false, error: getApiErrorMessage(err) }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
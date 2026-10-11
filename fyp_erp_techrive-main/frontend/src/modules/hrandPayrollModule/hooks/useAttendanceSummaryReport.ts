import { useCallback, useEffect, useState } from "react";
import { attendanceReportAPI } from "../services/attendanceReport.service";
import { getApiErrorMessage } from "../services/employee.service";
import { PAGE_SIZE_DEFAULT } from "../services/employee.constants";
import type { PaginationMeta } from "../services/employee.types";
import type {
  AttendanceSummaryReportParams,
  AttendanceSummaryReportRow,
} from "../services/attendanceReport.types";

const EMPTY_META: PaginationMeta = { total: 0, page: 1, limit: PAGE_SIZE_DEFAULT, totalPages: 1 };

// ─── useAttendanceSummaryReport ─────────────────────────────────────────────
export const useAttendanceSummaryReport = () => {
  const [filters, setFiltersState] = useState<Omit<AttendanceSummaryReportParams, "page" | "limit">>({});
  const [page, setPageState] = useState(1);
  const limit = PAGE_SIZE_DEFAULT;
  const [rows, setRows] = useState<AttendanceSummaryReportRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    attendanceReportAPI
      .attendanceSummary({ ...filters, page, limit })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
        setMeta(res.meta);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, limit, reloadToken]);

  const setFilters = useCallback((next: Omit<AttendanceSummaryReportParams, "page" | "limit">) => {
    setLoading(true);
    setFiltersState(next);
    setPageState(1);
  }, []);

  const setPage = useCallback((next: number) => {
    setLoading(true);
    setPageState(next);
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return { rows, meta, filters, setFilters, page, setPage, loading, error, refetch };
};

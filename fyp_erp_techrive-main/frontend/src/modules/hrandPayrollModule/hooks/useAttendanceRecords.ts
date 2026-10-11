import { useCallback, useEffect, useState } from "react";
import { attendanceAPI } from "../services/attendance.service";
import { getApiErrorMessage } from "../services/employee.service";
import { PAGE_SIZE_DEFAULT } from "../services/employee.constants";
import type { AttendanceRecord, ListAttendanceParams } from "../services/attendance.types";
import type { PaginationMeta } from "../services/employee.types";

interface UseAttendanceRecordsOptions {
  limit?: number;
}

export interface AttendanceFilters {
  employee_id?: number;
  branch_id?: number;
  company_id?: number;
  status?: number;
  start_date?: string;
  end_date?: string;
}

const EMPTY_META: PaginationMeta = { total: 0, page: 1, limit: PAGE_SIZE_DEFAULT, totalPages: 1 };
const EMPTY_FILTERS: AttendanceFilters = {};

// ─── useAttendanceRecords ──────────────────────────────────────────────────────
// Same shape as useHolidays.ts/useWorkShifts.ts, but filters are a small
// object instead of a single search string, since Attendance is filtered by
// employee/branch/status/date-range rather than free-text search (the table
// has no name column of its own to search against).
export const useAttendanceRecords = (options: UseAttendanceRecordsOptions = {}) => {
  const limit = options.limit ?? PAGE_SIZE_DEFAULT;

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [page, setPageState] = useState(1);
  const [filters, setFiltersState] = useState<AttendanceFilters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const params: ListAttendanceParams = { page, limit, ...filters };

    attendanceAPI
      .list(params)
      .then((res) => {
        if (cancelled) return;
        setRecords(res.data);
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
  }, [page, limit, JSON.stringify(filters), reloadToken]);

  const setPage = useCallback((next: number) => {
    setLoading(true);
    setPageState(next);
  }, []);

  const changeFilters = useCallback((next: AttendanceFilters) => {
    setLoading(true);
    setFiltersState(next);
    setPageState(1);
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return {
    records,
    meta,
    page,
    setPage,
    filters,
    changeFilters,
    loading,
    error,
    refetch,
  };
};
import { useCallback, useEffect, useState } from "react";
import { attendanceSummaryAPI } from "../services/attendanceSummary.service";
import { getApiErrorMessage } from "../services/employee.service";
import { PAGE_SIZE_DEFAULT } from "../services/employee.constants";
import type { AttendanceSummary, ListAttendanceSummariesParams } from "../services/attendanceSummary.types";
import type { PaginationMeta } from "../services/employee.types";

interface UseAttendanceSummariesOptions {
  limit?: number;
}

export interface AttendanceSummaryFilters {
  staff_id?: number;
  branch_id?: number;
  company_id?: number;
  month_id?: number;
  year_id?: number;
  pay_status?: string;
  approved_status?: string;
}

const EMPTY_META: PaginationMeta = { total: 0, page: 1, limit: PAGE_SIZE_DEFAULT, totalPages: 1 };
const EMPTY_FILTERS: AttendanceSummaryFilters = {};

export const useAttendanceSummaries = (options: UseAttendanceSummariesOptions = {}) => {
  const limit = options.limit ?? PAGE_SIZE_DEFAULT;

  const [summaries, setSummaries] = useState<AttendanceSummary[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [page, setPageState] = useState(1);
  const [filters, setFiltersState] = useState<AttendanceSummaryFilters>(EMPTY_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const params: ListAttendanceSummariesParams = { page, limit, ...filters };

    attendanceSummaryAPI
      .list(params)
      .then((res) => {
        if (cancelled) return;
        setSummaries(res.data);
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

  const changeFilters = useCallback((next: AttendanceSummaryFilters) => {
    setLoading(true);
    setFiltersState(next);
    setPageState(1);
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return { summaries, meta, page, setPage, filters, changeFilters, loading, error, refetch };
};

import { useCallback, useEffect, useState } from "react";
import { employeeAPI, getApiErrorMessage } from "../services/employee.service";
import { PAGE_SIZE_DEFAULT } from "../services/employee.constants";
import type { Employee, PaginationMeta } from "../services/employee.types";

interface UseEmployeesOptions {
  limit?: number;
}

const EMPTY_META: PaginationMeta = { total: 0, page: 1, limit: PAGE_SIZE_DEFAULT, totalPages: 1 };

// ─── useEmployees ─────────────────────────────────────────────────────────────
// Owns all list-page state: current page, search term, the fetched rows, and
// loading/error status. Changing the search term resets back to page 1 (the
// usual expected UX). `refetch` lets the page force a reload after a delete.
//
// NOTE on the loading flag: `loading` starts `true` (initial mount fetch) and
// is otherwise flipped to `true` by the *handlers* below (setPage/changeSearch
// /refetch) — i.e. by the user action that causes the effect to re-run — not
// synchronously inside the effect body itself. It's only ever cleared from
// within the promise's .then()/.catch() callbacks. This keeps every setState
// call either in an event handler or inside an async callback, satisfying
// react-hooks/set-state-in-effect (which flags setState called synchronously
// at the top level of an effect body) while still showing a spinner
// immediately on every page/search change, not just on first mount.
export const useEmployees = (options: UseEmployeesOptions = {}) => {
  const limit = options.limit ?? PAGE_SIZE_DEFAULT;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META);
  const [page, setPageState] = useState(1);
  const [search, setSearchState] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    employeeAPI
      .list({ page, limit, search: search || undefined })
      .then((res) => {
        if (cancelled) return;
        setEmployees(res.data);
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
  }, [page, limit, search, reloadToken]);

  const setPage = useCallback((next: number) => {
    setLoading(true);
    setPageState(next);
  }, []);

  // Resets to page 1 whenever the search term changes — otherwise the user
  // could land on a page number that no longer exists for the new results.
  const changeSearch = useCallback((value: string) => {
    setLoading(true);
    setSearchState(value);
    setPageState(1);
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return {
    employees,
    meta,
    page,
    setPage,
    search,
    changeSearch,
    loading,
    error,
    refetch,
  };
};
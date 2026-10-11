import { useEffect, useState } from "react";
import { monthAPI } from "../services/month.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { Month } from "../services/month.types";

interface MonthsLookupState {
  months: Month[];
  loading: boolean;
  error: string | null;
}

export const useMonthsLookup = () => {
  const [state, setState] = useState<MonthsLookupState>({ months: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    monthAPI
      .lookup()
      .then((res) => {
        if (cancelled) return;
        setState({ months: res.data, loading: false, error: null });
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

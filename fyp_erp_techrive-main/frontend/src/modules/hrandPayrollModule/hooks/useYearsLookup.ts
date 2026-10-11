import { useEffect, useState } from "react";
import { yearAPI } from "../services/year.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { Year } from "../services/year.types";

interface YearsLookupState {
  years: Year[];
  loading: boolean;
  error: string | null;
}

export const useYearsLookup = () => {
  const [state, setState] = useState<YearsLookupState>({ years: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;

    yearAPI
      .lookup()
      .then((res) => {
        if (cancelled) return;
        setState({ years: res.data, loading: false, error: null });
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

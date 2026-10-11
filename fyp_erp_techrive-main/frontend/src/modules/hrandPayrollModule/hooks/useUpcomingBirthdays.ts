import { useCallback, useEffect, useState } from "react";
import { employeeAPI, getApiErrorMessage } from "../services/employee.service";
import type { Employee } from "../services/employee.types";

// The backend caps `limit` at 100 per request (see
// backend/.../validators/employee.validator.ts -> limit: z.coerce.number()...max(100)).
// The Birthday widget is a dashboard summary, not a full directory, so a
// single 100-row fetch is intentional — it scans the same page the
// Employees list would show on "page size: 100" without adding a second,
// unbounded endpoint just for this widget.
const MAX_EMPLOYEES_SCANNED = 100;

export interface UpcomingBirthday {
  employee: Employee;
  name: string;
  nextBirthday: Date;
  daysRemaining: number;
  isToday: boolean;
}

// "First [Last]" — falls back to the email when both name fields are blank,
// mirroring the convention already used by EmployeeListPage/EmployeeTable.
const displayName = (employee: Employee): string => {
  const parts = [employee.first_name, employee.last_name].filter(
    (p): p is string => Boolean(p && p.trim())
  );
  return parts.length > 0 ? parts.join(" ") : employee.email;
};

// Projects a stored Date of Birth forward onto "this cycle's" occurrence —
// i.e. the next time that month/day comes around from today, wrapping into
// next year once this year's date has already passed. Feb 29 birthdays are
// celebrated on Feb 28 in non-leap years so someone born on a leap day still
// shows up every year instead of only every four.
const computeNextBirthday = (
  dateOfBirth: string,
  today: Date
): { nextBirthday: Date; daysRemaining: number } | null => {
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isLeapDay = dob.getMonth() === 1 && dob.getDate() === 29;

  const occurrenceIn = (year: number): Date => {
    if (isLeapDay) {
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      return isLeapYear ? new Date(year, 1, 29) : new Date(year, 1, 28);
    }
    return new Date(year, dob.getMonth(), dob.getDate());
  };

  let next = occurrenceIn(todayMidnight.getFullYear());
  if (next.getTime() < todayMidnight.getTime()) {
    next = occurrenceIn(todayMidnight.getFullYear() + 1);
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.round((next.getTime() - todayMidnight.getTime()) / msPerDay);

  return { nextBirthday: next, daysRemaining };
};

// ─── useUpcomingBirthdays ───────────────────────────────────────────────────
// Fetches employees and derives, sorts, and returns their upcoming
// birthdays (closest first) straight from the `date_of_birth` field that's
// captured on the Add/Edit Employee form — there's no separate "birthdays"
// table, so this is always in sync with whatever HR most recently saved.
//
// "Automatic" refresh model: the list re-fetches on mount (so navigating
// back to the HR Dashboard after adding/editing an employee always shows
// the latest data) and again whenever the browser tab regains focus or
// visibility — covering the common case of editing an employee in one tab
// and switching back to the dashboard tab — without needing a websocket or
// global store. `refetch` is also exposed for an explicit refresh button.
export const useUpcomingBirthdays = () => {
  const [birthdays, setBirthdays] = useState<UpcomingBirthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    employeeAPI
      .list({ page: 1, limit: MAX_EMPLOYEES_SCANNED })
      .then((res) => {
        if (cancelled) return;

        const today = new Date();
        const results: UpcomingBirthday[] = [];

        res.data.forEach((employee) => {
          if (!employee.date_of_birth) return;
          const computed = computeNextBirthday(employee.date_of_birth, today);
          if (!computed) return;

          results.push({
            employee,
            name: displayName(employee),
            nextBirthday: computed.nextBirthday,
            daysRemaining: computed.daysRemaining,
            isToday: computed.daysRemaining === 0,
          });
        });

        // Closest birthday first.
        results.sort((a, b) => a.daysRemaining - b.daysRemaining);

        setBirthdays(results);
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
  }, [reloadToken]);

  useEffect(() => {
    const handleFocus = () => setReloadToken((t) => t + 1);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") setReloadToken((t) => t + 1);
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const refetch = useCallback(() => {
    setLoading(true);
    setReloadToken((t) => t + 1);
  }, []);

  return { birthdays, loading, error, refetch };
};
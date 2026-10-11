import { useCallback, useEffect, useState } from "react";
import { emergencyContactAPI } from "../services/emergencyContact.service";
import { getApiErrorMessage } from "../services/employee.service";
import type { EmergencyContact } from "../services/emergencyContact.types";

// ─── useEmergencyContactsByStaff ──────────────────────────────────────────────
// Scoped to a single employee (staffId) — used by EmergencyContactsPanel,
// embedded inside the Employee Profile page's "Emergency Contacts" tab
// rather than the standalone EmergencyContactsPage list.
export const useEmergencyContactsByStaff = (staffId: number | undefined) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!staffId) {
      setContacts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    emergencyContactAPI
      .list({ staff_id: staffId, limit: 100 })
      .then((res) => {
        if (cancelled) return;
        setContacts(res.data);
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
  }, [staffId, reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { contacts, loading, error, refetch };
};
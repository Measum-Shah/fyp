import { useCallback, useEffect, useMemo, useState } from "react";
import feeAPI from "../services/feeApi";
import type { FeeTabKey } from "../components/FeeModuleWorkspace";

export type FeeAccessProfile = {
  fee_role: "admin" | "accountant" | "teacher" | "parent" | "student" | "denied";
  user_type: string | null;
  capabilities: string[];
  linked_student_ids: number[];
  teacher_class_ids: number[];
  branch_id: number | null;
  is_admin_console: boolean;
  is_self_service: boolean;
  is_teacher_restricted: boolean;
};

const TAB_CAPABILITY: Partial<Record<FeeTabKey, string>> = {
  overview: "VIEW_ADMIN_DASHBOARD",
  sections: "MANAGE_FEE_SETUP",
  "section-prints": "MANAGE_FEE_SETUP",
  "erp-fee-heads": "MANAGE_FEE_SETUP",
  types: "MANAGE_FEE_SETUP",
  cycles: "MANAGE_FEE_SETUP",
  structures: "MANAGE_FEE_SETUP",
  assignments: "MANAGE_ASSIGNMENTS",
  "student-records": "VIEW_STUDENT_RECORDS",
  payments: "PROCESS_PAYMENTS",
  discounts: "MANAGE_DISCOUNTS",
  "late-fees": "MANAGE_LATE_FEES",
  notifications: "MANAGE_NOTIFICATIONS",
  reports: "VIEW_REPORTS",
};

/** Teachers may open reports for defaulters/outstanding only */
const TEACHER_ALLOWED_TABS: FeeTabKey[] = ["overview", "reports"];

export const useFeeAccess = () => {
  const [profile, setProfile] = useState<FeeAccessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await feeAPI.getFeeAccessProfile();
      setProfile(res.data.data as FeeAccessProfile);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to resolve Fee Management access";
      setError(message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const can = useCallback(
    (capability: string) => !!profile?.capabilities?.includes(capability),
    [profile]
  );

  const canOpenTab = useCallback(
    (tab: FeeTabKey) => {
      if (!profile) return false;
      if (profile.is_self_service) return false;
      if (profile.fee_role === "teacher") {
        return TEACHER_ALLOWED_TABS.includes(tab);
      }
      const required = TAB_CAPABILITY[tab];
      if (!required) return profile.is_admin_console;
      // Teachers: reports tab uses VIEW_DEFAULTERS instead of VIEW_REPORTS
      if (tab === "reports" && profile.is_teacher_restricted) {
        return can("VIEW_DEFAULTERS");
      }
      return can(required);
    },
    [profile, can]
  );

  const allowedTabs = useMemo(() => {
    if (!profile) return [] as FeeTabKey[];
    return (Object.keys(TAB_CAPABILITY) as FeeTabKey[]).filter((t) => canOpenTab(t));
  }, [profile, canOpenTab]);

  return {
    profile,
    loading,
    error,
    refresh,
    can,
    canOpenTab,
    allowedTabs,
  };
};

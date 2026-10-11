import { useCallback, useEffect, useState } from "react";
import feeAPI from "../services/feeApi";

export type FeeLookups = {
  branches: Array<{ id: number; name: string; branch_code?: string | null }>;
  sessions: Array<{ id: number; title: string; status?: string }>;
  programs: Array<{ id: number; name: string; branch_id?: number | null }>;
  classes: Array<{ id: number; name: string; class_code?: string }>;
  boards: Array<{ id: number; name: string }>;
  intakes: Array<{ id: number; name: string | null }>;
  academicGroups: Array<{ id: number; name: string; program_id: number }>;
  feeSections: Array<{ id: number; title: string }>;
  feeSectionPrints: Array<{ id: number; title: string }>;
  erpFeeHeads: Array<{ id: number; title: string; description?: string | null }>;
  feeHeads: Array<{ id: number; fee_head_title: string | null }>;
  feeTerms: Array<{ id: number; term_title: string; term_number: number }>;
  installmentPlans: Array<{ id: number; name: string | null; fee_term_id: number }>;
  feeStructureCodes: Array<{
    fee_structure_code: string;
    branch_id: number;
    program_id: number;
    class_id: number;
    total_amount: number;
    line_count: number;
  }>;
  presets: {
    feeCycles: string[];
    feeTypeSuggestions: string[];
  };
};

export const useFeeLookups = (branchId?: number) => {
  const [lookups, setLookups] = useState<FeeLookups | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await feeAPI.getLookups(branchId);
      setLookups(res.data.data);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to load lookups";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { lookups, loading, error, refresh };
};

export const getErrorMessage = (err: unknown, fallback = "Something went wrong") => {
  const axiosErr = err as {
    response?: { data?: { message?: string; errors?: Array<{ message: string }> } };
  };
  if (axiosErr.response?.data?.errors?.length) {
    return axiosErr.response.data.errors.map((e) => e.message).join(", ");
  }
  return axiosErr.response?.data?.message || fallback;
};

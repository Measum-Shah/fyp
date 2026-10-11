import { prisma } from "../../../config/db";
import { AppError } from "./app-error";

// ─── Company → Branch scoping helpers ────────────────────────────────────────
// Every Branch selector in HR & Payroll must first be scoped to a Company
// (see the Company→Branch scoping task). These two helpers are the shared
// backend enforcement piece — the frontend Company dropdown narrows what the
// user *sees*, but the backend must independently guarantee a request can't
// mix a company_id with a branch_id from a different company.

/**
 * Returns every branch id belonging to the given company — used to build an
 * `{ branch_id: { in: [...] } }` filter when a list/report endpoint receives
 * only a company_id (no specific branch_id) filter.
 */
export const getBranchIdsForCompany = async (company_id: number): Promise<number[]> => {
  const branches = await prisma.erpBranches.findMany({
    where: { company_id, deleted_at: null },
    select: { id: true },
  });
  return branches.map((b) => b.id);
};

/**
 * Guards against a request that passes both a branch_id and a company_id
 * where the branch doesn't actually belong to that company — rejects with a
 * 400 rather than silently ignoring one of the two filters (see task:
 * "Backend must enforce this too, not just the frontend UI").
 */
export const assertBranchBelongsToCompany = async (
  branch_id: number,
  company_id: number
): Promise<void> => {
  const branch = await prisma.erpBranches.findFirst({
    where: { id: branch_id, deleted_at: null },
    select: { company_id: true },
  });

  if (!branch || branch.company_id !== company_id) {
    throw AppError.badRequest("Campus does not belong to the selected school / university", {
      branch_id: `Campus ${branch_id} does not belong to school / university ${company_id}`,
    });
  }
};
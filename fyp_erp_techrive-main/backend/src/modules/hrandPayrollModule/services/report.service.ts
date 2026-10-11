import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { EXPIRY_DEFAULT_WINDOW_DAYS, REPORT_MAX_ROWS } from "../constants/report.constants";
import { getBranchIdsForCompany, assertBranchBelongsToCompany } from "../utils/company-branch.util";
import {
  CnicExpiryQuery,
  ContractProbationExpiryQuery,
  EmployeeDirectoryQuery,
  JoinersExitsQuery,
} from "../validators/report.validator";

// ─── Reports Module — Service ───────────────────────────────────────────────
// Phase 1: Employee-based reports, built entirely on top of the `staff`,
// `departments` and `erp_branches`/`erp_companies` tables Employee/Branch/
// Company Management already own. No new tables, no schema changes.
//
// The generated Prisma schema has no `@relation` fields anywhere (it was
// introspected flat, one model per table — see branch/department/employee
// services for the same pattern), so every "join" here is done manually in
// JS: fetch the small lookup tables (departments/branches/companies) into
// id -> record maps, then stitch them onto the `staff` rows. This mirrors
// lookup.service.ts's approach, just applied in the other direction.

// ─── Shared row + lookup shapes ─────────────────────────────────────────────

export interface EmployeeDirectoryRow {
  id: number;
  reg_no: string | null;
  full_name: string;
  email: string;
  mobile_1: string | null;
  gender: string | null;
  cnic: string;
  designation: string | null;
  staff_type: string;
  department_id: number | null;
  department_name: string;
  branch_id: number;
  branch_name: string;
  company_name: string;
  status: string | null;
  join_date: Date | null;
}

interface DepartmentLookup {
  id: number;
  name: string;
}

interface BranchLookup {
  id: number;
  name: string;
  company_id: number;
}

interface CompanyLookup {
  id: number;
  name: string;
}

const buildFullName = (staff: {
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
}): string =>
  [staff.first_name, staff.middle_name, staff.last_name].filter(Boolean).join(" ") ||
  "(unnamed)";

/**
 * Loads departments/branches/companies as id -> record Maps in one shot.
 * Shared by every report below so we don't re-fetch these small lookup
 * tables per report. Not filtered by status/deleted_at — a report should
 * still show the correct department/branch/company name for a record even
 * if that department/branch was later deactivated.
 */
const loadLookupMaps = async () => {
  const [departments, branches, companies] = await prisma.$transaction([
    prisma.departments.findMany({ select: { id: true, name: true } }),
    prisma.erpBranches.findMany({ select: { id: true, name: true, company_id: true } }),
    prisma.erpCompanies.findMany({ select: { id: true, name: true } }),
  ]);

  return {
    departmentsById: new Map<number, DepartmentLookup>(departments.map((d) => [d.id, d])),
    branchesById: new Map<number, BranchLookup>(branches.map((b) => [b.id, b])),
    companiesById: new Map<number, CompanyLookup>(companies.map((c) => [c.id, c])),
  };
};

const toDirectoryRow = (
  staff: {
    id: number;
    reg_no: string | null;
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    email: string;
    mobile_1: string | null;
    gender: string | null;
    cnic: string;
    designation: string | null;
    staff_type: string;
    department_id: number | null;
    branch_id: number;
    status: string | null;
    join_date: Date | null;
  },
  lookups: Awaited<ReturnType<typeof loadLookupMaps>>
): EmployeeDirectoryRow => {
  const branch = lookups.branchesById.get(staff.branch_id);
  const company = branch ? lookups.companiesById.get(branch.company_id) : undefined;
  const department =
    staff.department_id != null ? lookups.departmentsById.get(staff.department_id) : undefined;

  return {
    id: staff.id,
    reg_no: staff.reg_no,
    full_name: buildFullName(staff),
    email: staff.email,
    mobile_1: staff.mobile_1,
    gender: staff.gender,
    cnic: staff.cnic,
    designation: staff.designation,
    staff_type: staff.staff_type,
    department_id: staff.department_id,
    department_name: department?.name ?? "—",
    branch_id: staff.branch_id,
    branch_name: branch?.name ?? "—",
    company_name: company?.name ?? "—",
    status: staff.status,
    join_date: staff.join_date,
  };
};

const directoryRowSelect = {
  id: true,
  reg_no: true,
  first_name: true,
  middle_name: true,
  last_name: true,
  email: true,
  mobile_1: true,
  gender: true,
  cnic: true,
  designation: true,
  staff_type: true,
  department_id: true,
  branch_id: true,
  status: true,
  join_date: true,
} satisfies Prisma.StaffSelect;

// ─── Employee Directory Report ──────────────────────────────────────────────
// Real page/limit pagination (not the flat REPORT_MAX_ROWS cap the other
// reports use) — this is the one report whose result set scales directly
// with headcount and has one row of real per-employee detail, so it's the
// one that actually needs it. Mirrors employee.service.ts's
// count()+skip/take pattern exactly.
export const getEmployeeDirectoryReport = async (
  params: EmployeeDirectoryQuery
): Promise<{ data: EmployeeDirectoryRow[]; total: number; page: number; limit: number }> => {
  const { search, department_id, branch_id, company_id, status, page, limit } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const directoryCompanyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  const where: Prisma.StaffWhereInput = {
    deleted_at: null,
    ...(department_id ? { department_id } : {}),
    ...(branch_id ? { branch_id } : directoryCompanyBranchIds ? { branch_id: { in: directoryCompanyBranchIds } } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { first_name: { contains: search, mode: "insensitive" } },
            { last_name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { reg_no: { contains: search, mode: "insensitive" } },
            { designation: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [lookups, total, rows] = await Promise.all([
    loadLookupMaps(),
    prisma.staff.count({ where }),
    prisma.staff.findMany({
      where,
      select: directoryRowSelect,
      orderBy: [{ first_name: "asc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { data: rows.map((row) => toDirectoryRow(row, lookups)), total, page, limit };
};

// ─── Headcount by Department Report ─────────────────────────────────────────
export interface HeadcountRow {
  id: number;
  name: string;
  total: number;
  active: number;
  inactive: number;
}

export const getHeadcountByDepartmentReport = async (): Promise<{
  data: HeadcountRow[];
  totalEmployees: number;
}> => {
  const [departments, staff] = await Promise.all([
    prisma.departments.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.staff.findMany({
      where: { deleted_at: null },
      select: { department_id: true, status: true },
    }),
  ]);

  const counts = new Map<number, { total: number; active: number; inactive: number }>();
  for (const s of staff) {
    if (s.department_id == null) continue;
    const bucket = counts.get(s.department_id) ?? { total: 0, active: 0, inactive: 0 };
    bucket.total += 1;
    if (s.status === "Active") bucket.active += 1;
    else bucket.inactive += 1;
    counts.set(s.department_id, bucket);
  }

  const data: HeadcountRow[] = departments.map((dept) => {
    const bucket = counts.get(dept.id) ?? { total: 0, active: 0, inactive: 0 };
    return { id: dept.id, name: dept.name, ...bucket };
  });

  return { data, totalEmployees: staff.length };
};

// ─── Headcount by Branch Report ─────────────────────────────────────────────
export interface BranchHeadcountRow extends HeadcountRow {
  company_name: string;
}

export const getHeadcountByBranchReport = async (): Promise<{
  data: BranchHeadcountRow[];
  totalEmployees: number;
}> => {
  const [branches, companies, staff] = await Promise.all([
    prisma.erpBranches.findMany({
      where: { deleted_at: null },
      select: { id: true, name: true, company_id: true },
      orderBy: { name: "asc" },
    }),
    prisma.erpCompanies.findMany({ select: { id: true, name: true } }),
    prisma.staff.findMany({
      where: { deleted_at: null },
      select: { branch_id: true, status: true },
    }),
  ]);

  const companiesById = new Map(companies.map((c) => [c.id, c]));

  const counts = new Map<number, { total: number; active: number; inactive: number }>();
  for (const s of staff) {
    const bucket = counts.get(s.branch_id) ?? { total: 0, active: 0, inactive: 0 };
    bucket.total += 1;
    if (s.status === "Active") bucket.active += 1;
    else bucket.inactive += 1;
    counts.set(s.branch_id, bucket);
  }

  const data: BranchHeadcountRow[] = branches.map((branch) => {
    const bucket = counts.get(branch.id) ?? { total: 0, active: 0, inactive: 0 };
    return {
      id: branch.id,
      name: branch.name,
      company_name: companiesById.get(branch.company_id)?.name ?? "—",
      ...bucket,
    };
  });

  return { data, totalEmployees: staff.length };
};

// ─── New Joiners & Exits Report ─────────────────────────────────────────────
// "Joiners" = staff.join_date falls inside [from, to] — every employee who
// started in the period, regardless of current status.
//
// "Exits" = staff.deleted_at falls inside [from, to]. `staff` has no
// dedicated resignation/termination date column of its own; deleteEmployee()
// in employee.service.ts is the only place that currently records a
// departure, and it always stamps deleted_at at the moment of removal — so
// deleted_at is the most accurate signal available today for "when did this
// person leave", more accurate than e.g. updated_at (which changes on every
// unrelated edit). Exits therefore intentionally queries WITHOUT the
// deleted_at: null guard the rest of Employee Management uses everywhere
// else — for this one report we need exactly the opposite.
export const getJoinersAndExitsReport = async (
  params: JoinersExitsQuery
): Promise<{ joiners: EmployeeDirectoryRow[]; exits: EmployeeDirectoryRow[] }> => {
  const from = new Date(params.from);
  // Include the entire "to" day, not just midnight.
  const to = new Date(params.to);
  to.setHours(23, 59, 59, 999);

  const [lookups, joinersRaw, exitsRaw] = await Promise.all([
    loadLookupMaps(),
    prisma.staff.findMany({
      where: { join_date: { gte: from, lte: to } },
      select: directoryRowSelect,
      orderBy: { join_date: "asc" },
      take: REPORT_MAX_ROWS,
    }),
    prisma.staff.findMany({
      where: { deleted_at: { gte: from, lte: to } },
      select: directoryRowSelect,
      orderBy: { id: "asc" },
      take: REPORT_MAX_ROWS,
    }),
  ]);

  return {
    joiners: joinersRaw.map((row) => toDirectoryRow(row, lookups)),
    exits: exitsRaw.map((row) => toDirectoryRow(row, lookups)),
  };
};
// ─── Employee Analytics Report ──────────────────────────────────────────────
// Four distributions over the same active-employee set: staff type, gender,
// designation (top 10 + "Other" bucket, since designation is free text and
// can have long tails), and tenure band (derived from join_date). This is
// one endpoint rather than four separate ones — the four breakdowns are
// always viewed together on one analytics page, so one round trip avoids
// four near-identical staff.findMany() queries for what's really one
// dataset sliced four ways.
export interface DistributionSlice {
  label: string;
  count: number;
  percentage: number; // 0-100, one decimal place
}

export interface EmployeeAnalyticsReport {
  totalEmployees: number;
  byStaffType: DistributionSlice[];
  byGender: DistributionSlice[];
  byDesignation: DistributionSlice[];
  byTenure: DistributionSlice[];
}

const MAX_DESIGNATION_SLICES = 10;

const TENURE_BANDS = [
  "Less than 1 year",
  "1–3 years",
  "3–5 years",
  "5–10 years",
  "10+ years",
  "Unknown",
] as const;

const tenureBandFor = (joinDate: Date | null): (typeof TENURE_BANDS)[number] => {
  if (!joinDate) return "Unknown";
  const years = (Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  if (years < 1) return "Less than 1 year";
  if (years < 3) return "1–3 years";
  if (years < 5) return "3–5 years";
  if (years < 10) return "5–10 years";
  return "10+ years";
};

/**
 * Turns a label -> count Map into sorted, percentage-annotated slices.
 * Sorted descending by count so the biggest group leads; ties keep
 * insertion order (Map preserves it), which for callers that build the map
 * in a fixed order (e.g. tenure bands) means a stable, sensible order.
 */
const toSortedSlices = (counts: Map<string, number>, total: number): DistributionSlice[] =>
  Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

export const getEmployeeAnalyticsReport = async (): Promise<EmployeeAnalyticsReport> => {
  const staff = await prisma.staff.findMany({
    where: { deleted_at: null },
    select: { staff_type: true, gender: true, designation: true, join_date: true },
  });

  const total = staff.length;

  const staffTypeCounts = new Map<string, number>();
  const genderCounts = new Map<string, number>();
  const designationCounts = new Map<string, number>();
  const tenureCounts = new Map<string, number>(TENURE_BANDS.map((b) => [b, 0]));

  for (const s of staff) {
    const staffType = s.staff_type?.trim() || "Unspecified";
    staffTypeCounts.set(staffType, (staffTypeCounts.get(staffType) ?? 0) + 1);

    const gender = s.gender?.trim() || "Unspecified";
    genderCounts.set(gender, (genderCounts.get(gender) ?? 0) + 1);

    const designation = s.designation?.trim() || "Unspecified";
    designationCounts.set(designation, (designationCounts.get(designation) ?? 0) + 1);

    const band = tenureBandFor(s.join_date);
    tenureCounts.set(band, (tenureCounts.get(band) ?? 0) + 1);
  }

  // Designation can have a long tail of unique free-text values — keep the
  // top N by count and fold everything past that into "Other" rather than
  // returning dozens of one-employee slices.
  const designationSlices = toSortedSlices(designationCounts, total);
  const byDesignation =
    designationSlices.length > MAX_DESIGNATION_SLICES
      ? [
          ...designationSlices.slice(0, MAX_DESIGNATION_SLICES),
          {
            label: "Other",
            count: designationSlices
              .slice(MAX_DESIGNATION_SLICES)
              .reduce((sum, slice) => sum + slice.count, 0),
            percentage:
              total > 0
                ? Math.round(
                    (designationSlices
                      .slice(MAX_DESIGNATION_SLICES)
                      .reduce((sum, slice) => sum + slice.count, 0) /
                      total) *
                      1000
                  ) / 10
                : 0,
          },
        ]
      : designationSlices;

  return {
    totalEmployees: total,
    byStaffType: toSortedSlices(staffTypeCounts, total),
    byGender: toSortedSlices(genderCounts, total),
    byDesignation,
    // Tenure keeps the fixed chronological band order rather than sorting
    // by count — "Less than 1 year" → "10+ years" reads naturally, sorting
    // by count would scramble it.
    byTenure: TENURE_BANDS.map((label) => ({
      label,
      count: tenureCounts.get(label) ?? 0,
      percentage: total > 0 ? Math.round(((tenureCounts.get(label) ?? 0) / total) * 1000) / 10 : 0,
    })),
  };
};

// ─── Date-window helpers (CNIC / Contract / Probation expiry) ──────────────
// Both reports below default to "today .. today + EXPIRY_DEFAULT_WINDOW_DAYS"
// when the caller omits from/to (see report.validator.ts) — this resolves
// that into concrete Date boundaries, inclusive of the entire "to" day.
const resolveExpiryWindow = (
  from: string | undefined,
  to: string | undefined
): { start: Date; end: Date } => {
  const start = from ? new Date(from) : new Date(new Date().toDateString());
  let end: Date;
  if (to) {
    end = new Date(to);
    end.setHours(23, 59, 59, 999);
  } else {
    end = new Date(start);
    end.setDate(end.getDate() + EXPIRY_DEFAULT_WINDOW_DAYS);
    end.setHours(23, 59, 59, 999);
  }
  return { start, end };
};

const daysBetween = (from: Date, to: Date): number =>
  Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

// ─── CNIC Expiry Report ─────────────────────────────────────────────────────
// staff.cnic_expiry_date is a real DATE column, so this is a straightforward
// range query — unlike Contract & Probation Expiry below, which has to parse
// free-text fields.
export interface CnicExpiryRow extends EmployeeDirectoryRow {
  cnic_expiry_date_value: Date;
  days_remaining: number;
}

export const getCnicExpiryReport = async (
  params: CnicExpiryQuery
): Promise<{ data: CnicExpiryRow[]; total: number }> => {
  const { branch_id, company_id, department_id } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const cnicCompanyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  const { start, end } = resolveExpiryWindow(params.from, params.to);
  const today = new Date(new Date().toDateString());

  const [lookups, rows] = await Promise.all([
    loadLookupMaps(),
    prisma.staff.findMany({
      where: {
        deleted_at: null,
        cnic_expiry_date: { gte: start, lte: end },
        ...(branch_id ? { branch_id } : cnicCompanyBranchIds ? { branch_id: { in: cnicCompanyBranchIds } } : {}),
        ...(department_id ? { department_id } : {}),
      },
      select: { ...directoryRowSelect, cnic_expiry_date: true },
      orderBy: { cnic_expiry_date: "asc" },
      take: REPORT_MAX_ROWS,
    }),
  ]);

  const data: CnicExpiryRow[] = rows.map((row) => ({
    ...toDirectoryRow(row, lookups),
    cnic_expiry_date_value: row.cnic_expiry_date as Date,
    days_remaining: daysBetween(today, row.cnic_expiry_date as Date),
  }));

  return { data, total: data.length };
};

// ─── Contract & Probation Expiry Report ─────────────────────────────────────
// end_day_contract and probation are free-text VarChar columns (no real
// DATE type behind either — see employee.validator.ts's profileTextField),
// so the date range can't be pushed down into the SQL WHERE clause. Instead
// every active employee with a non-empty value in the relevant field(s) is
// pulled back, each value is parsed with `new Date(...)`, and only rows that
// parse to a real calendar date inside the window are kept. Unparseable
// text (blank, "N/A", "Permanent", free-form notes, etc.) is silently
// skipped rather than surfaced as an error — most staff records simply
// won't have a parseable value here, and that's expected, not a fault.
export interface ContractProbationExpiryRow extends EmployeeDirectoryRow {
  expiry_type: "Contract" | "Probation";
  expiry_date_raw: string;
  expiry_date_value: Date;
  days_remaining: number;
}

const parseFreeTextDate = (value: string | null): Date | null => {
  if (!value || !value.trim()) return null;
  const parsed = new Date(value.trim());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getContractProbationExpiryReport = async (
  params: ContractProbationExpiryQuery
): Promise<{ data: ContractProbationExpiryRow[]; total: number }> => {
  const { branch_id, company_id, department_id, type } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const contractCompanyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  const { start, end } = resolveExpiryWindow(params.from, params.to);
  const today = new Date(new Date().toDateString());

  const [lookups, staff] = await Promise.all([
    loadLookupMaps(),
    prisma.staff.findMany({
      where: {
        deleted_at: null,
        ...(branch_id ? { branch_id } : contractCompanyBranchIds ? { branch_id: { in: contractCompanyBranchIds } } : {}),
        ...(department_id ? { department_id } : {}),
        OR: [
          { end_day_contract: { not: null } },
          { probation: { not: null } },
        ],
      },
      select: { ...directoryRowSelect, end_day_contract: true, probation: true },
      take: REPORT_MAX_ROWS,
    }),
  ]);

  const data: ContractProbationExpiryRow[] = [];

  for (const s of staff) {
    const candidates: Array<{ raw: string | null; expiry_type: "Contract" | "Probation" }> = [];
    if (!type || type === "contract") {
      candidates.push({ raw: s.end_day_contract, expiry_type: "Contract" });
    }
    if (!type || type === "probation") {
      candidates.push({ raw: s.probation, expiry_type: "Probation" });
    }

    for (const candidate of candidates) {
      const parsed = parseFreeTextDate(candidate.raw);
      if (!parsed) continue;
      if (parsed.getTime() < start.getTime() || parsed.getTime() > end.getTime()) continue;

      data.push({
        ...toDirectoryRow(s, lookups),
        expiry_type: candidate.expiry_type,
        expiry_date_raw: candidate.raw as string,
        expiry_date_value: parsed,
        days_remaining: daysBetween(today, parsed),
      });
    }
  }

  data.sort((a, b) => a.expiry_date_value.getTime() - b.expiry_date_value.getTime());

  return { data, total: data.length };
};

// ─── Staff Strength Report ───────────────────────────────────────────────────
// One call, four cuts of the same active-headcount number: by department,
// by branch, by staff type, and by employment/job status. Headcount by
// Department/Branch already exist as standalone endpoints (and are reused
// here rather than re-querying) — Staff Strength is the "everything in one
// place" view HR actually opens day to day, so it composes them instead of
// duplicating their queries.
export interface StaffStrengthReport {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  byDepartment: HeadcountRow[];
  byBranch: BranchHeadcountRow[];
  byStaffType: DistributionSlice[];
  byJobStatus: DistributionSlice[];
}

export const getStaffStrengthReport = async (): Promise<StaffStrengthReport> => {
  const [byDepartmentResult, byBranchResult, staff] = await Promise.all([
    getHeadcountByDepartmentReport(),
    getHeadcountByBranchReport(),
    prisma.staff.findMany({
      where: { deleted_at: null },
      select: { staff_type: true, status: true, job_status: true },
    }),
  ]);

  const total = staff.length;
  const activeEmployees = staff.filter((s) => s.status === "Active").length;

  const staffTypeCounts = new Map<string, number>();
  const jobStatusCounts = new Map<string, number>();

  for (const s of staff) {
    const staffType = s.staff_type?.trim() || "Unspecified";
    staffTypeCounts.set(staffType, (staffTypeCounts.get(staffType) ?? 0) + 1);

    const jobStatus = s.job_status?.trim() || "Unspecified";
    jobStatusCounts.set(jobStatus, (jobStatusCounts.get(jobStatus) ?? 0) + 1);
  }

  return {
    totalEmployees: total,
    activeEmployees,
    inactiveEmployees: total - activeEmployees,
    byDepartment: byDepartmentResult.data,
    byBranch: byBranchResult.data,
    byStaffType: toSortedSlices(staffTypeCounts, total),
    byJobStatus: toSortedSlices(jobStatusCounts, total),
  };
};
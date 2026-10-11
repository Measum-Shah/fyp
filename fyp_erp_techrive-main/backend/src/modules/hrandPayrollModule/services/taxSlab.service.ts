import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { rangesOverlap } from "../utils/tax-calculation.util";
import { CreateTaxSlabInput, UpdateTaxSlabInput } from "../validators/taxSlab.validator";

// ─── Shared select ────────────────────────────────────────────────────────────
const taxSlabSelect = {
  id: true,
  fiscal_year_id: true,
  slab_order: true,
  min_amount: true,
  max_amount: true,
  fixed_amount: true,
  tax_percent: true,
  status: true,
  created_at: true,
  updated_at: true,
} satisfies Prisma.HrTaxSlabsSelect;

export type TaxSlabRecord = Prisma.HrTaxSlabsGetPayload<{ select: typeof taxSlabSelect }>;

interface ListTaxSlabsParams {
  page: number;
  limit: number;
  fiscal_year_id?: number;
  status?: number;
}

interface ListTaxSlabsResult {
  data: TaxSlabRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const assertFiscalYearExists = async (fiscal_year_id: number) => {
  const fy = await prisma.erpFinancialYears.findFirst({
    where: { id: fiscal_year_id, deleted_at: null },
    select: { id: true },
  });
  if (!fy) {
    throw AppError.badRequest("Fiscal year does not exist", {
      fiscal_year_id: `No fiscal year found with id ${fiscal_year_id}`,
    });
  }
};

const findTaxSlabOrThrow = async (id: number): Promise<TaxSlabRecord> => {
  const record = await prisma.hrTaxSlabs.findFirst({
    where: { id, deleted_at: null },
    select: taxSlabSelect,
  });
  if (!record) {
    throw AppError.notFound(`Tax slab with id ${id} was not found`);
  }
  return record;
};

/**
 * Slabs within the same fiscal year must not overlap — matching a taxable
 * amount against two different slabs would be ambiguous. See
 * taxSlab.constants.ts.
 */
const assertNoOverlap = async (
  fiscal_year_id: number,
  min_amount: number,
  max_amount: number | null,
  excludeId?: number
) => {
  interface SiblingSlab {
    id: number;
    min_amount: number;
    max_amount: number | null;
    slab_order: number;
  }
  const siblings: SiblingSlab[] = await prisma.hrTaxSlabs.findMany({
    where: {
      fiscal_year_id,
      deleted_at: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, min_amount: true, max_amount: true, slab_order: true },
  });

  const overlapping = siblings.find((s: SiblingSlab) => rangesOverlap(min_amount, max_amount, s.min_amount, s.max_amount));
  if (overlapping) {
    throw AppError.conflict("This slab's range overlaps with an existing slab for the same fiscal year", {
      min_amount: `Overlaps with slab #${overlapping.slab_order}`,
    });
  }
};

const nextSlabOrder = async (fiscal_year_id: number): Promise<number> => {
  const top = await prisma.hrTaxSlabs.findFirst({
    where: { fiscal_year_id, deleted_at: null },
    orderBy: { slab_order: "desc" },
    select: { slab_order: true },
  });
  return (top?.slab_order ?? 0) + 1;
};

// ─── List tax slabs ───────────────────────────────────────────────────────────
export const listTaxSlabs = async (params: ListTaxSlabsParams): Promise<ListTaxSlabsResult> => {
  const { page, limit, fiscal_year_id, status } = params;

  const where: Prisma.HrTaxSlabsWhereInput = {
    deleted_at: null,
    ...(fiscal_year_id ? { fiscal_year_id } : {}),
    ...(status !== undefined ? { status } : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.hrTaxSlabs.count({ where }),
    prisma.hrTaxSlabs.findMany({
      where,
      select: taxSlabSelect,
      orderBy: [{ fiscal_year_id: "asc" }, { slab_order: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { data, meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) } };
};

// ─── Lookup — all active slabs for one fiscal year, unpaginated ────────────
// Used by salary.service.ts to auto-calculate tax, and by the Tax Slabs page
// to render the full ladder for a selected fiscal year without pagination.
// ─── Lookup — all active slabs for one fiscal year, unpaginated ────────────
// Used by salary.service.ts to auto-calculate tax, and by the Tax Slabs page
// to render the full ladder for a selected fiscal year without pagination.
//
// missing_unbounded_top_slab_warning (2026-08-22, fixes audit finding P-01):
// true when this fiscal year has at least one active slab but NONE of them
// has max_amount = null (an unbounded top bracket). Without an unbounded
// top slab, any taxable amount above the highest configured max_amount
// silently gets ₨0 tax (see tax-calculation.util.ts's calculateProgressiveTax
// — it only returns non-zero tax when the amount falls inside some slab's
// range). This is deliberately a WARNING, not a hard block on
// create/update/delete: forcing "must always have exactly one unbounded
// slab" would break the normal incremental workflow of building a slab
// table one bracket at a time. The Tax Slabs page surfaces this banner so
// whoever's configuring slabs notices before it silently under-taxes
// someone, without preventing legitimate in-progress data entry.
export const listTaxSlabsForFiscalYear = async (
  fiscal_year_id: number
): Promise<{ data: TaxSlabRecord[]; missing_unbounded_top_slab_warning: boolean }> => {
  const data = await prisma.hrTaxSlabs.findMany({
    where: { fiscal_year_id, deleted_at: null, status: 1 },
    select: taxSlabSelect,
    orderBy: { min_amount: "asc" },
  });

  const missing_unbounded_top_slab_warning = data.length > 0 && !data.some((s) => s.max_amount === null);

  return { data, missing_unbounded_top_slab_warning };
};

export const getTaxSlabById = async (id: number): Promise<TaxSlabRecord> => findTaxSlabOrThrow(id);

export const createTaxSlab = async (input: CreateTaxSlabInput): Promise<TaxSlabRecord> => {
  await assertFiscalYearExists(input.fiscal_year_id);
  const max_amount = input.max_amount ?? null;
  await assertNoOverlap(input.fiscal_year_id, input.min_amount, max_amount);

  return prisma.hrTaxSlabs.create({
    data: {
      fiscal_year_id: input.fiscal_year_id,
      slab_order: input.slab_order ?? (await nextSlabOrder(input.fiscal_year_id)),
      min_amount: input.min_amount,
      max_amount,
      fixed_amount: input.fixed_amount,
      tax_percent: input.tax_percent,
      status: input.status ?? 1,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: taxSlabSelect,
  });
};

export const updateTaxSlab = async (id: number, input: UpdateTaxSlabInput): Promise<TaxSlabRecord> => {
  const existing = await findTaxSlabOrThrow(id);

  if (input.fiscal_year_id !== undefined && input.fiscal_year_id !== existing.fiscal_year_id) {
    await assertFiscalYearExists(input.fiscal_year_id);
  }

  const nextFiscalYearId = input.fiscal_year_id ?? existing.fiscal_year_id;
  const nextMin = input.min_amount ?? existing.min_amount;
  const nextMax = input.max_amount !== undefined ? input.max_amount : existing.max_amount;

  if (input.fiscal_year_id !== undefined || input.min_amount !== undefined || input.max_amount !== undefined) {
    await assertNoOverlap(nextFiscalYearId, nextMin, nextMax, id);
  }

  return prisma.hrTaxSlabs.update({
    where: { id },
    data: {
      ...(input.fiscal_year_id !== undefined ? { fiscal_year_id: input.fiscal_year_id } : {}),
      ...(input.slab_order !== undefined ? { slab_order: input.slab_order } : {}),
      ...(input.min_amount !== undefined ? { min_amount: input.min_amount } : {}),
      ...(input.max_amount !== undefined ? { max_amount: input.max_amount } : {}),
      ...(input.fixed_amount !== undefined ? { fixed_amount: input.fixed_amount } : {}),
      ...(input.tax_percent !== undefined ? { tax_percent: input.tax_percent } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      updated_at: new Date(),
    },
    select: taxSlabSelect,
  });
};

// ─── Delete tax slab (soft delete — deleted_at exists on this table) ───────
export const deleteTaxSlab = async (id: number): Promise<void> => {
  await findTaxSlabOrThrow(id);

  await prisma.hrTaxSlabs.update({
    where: { id },
    data: { deleted_at: new Date(), updated_at: new Date() },
  });
};

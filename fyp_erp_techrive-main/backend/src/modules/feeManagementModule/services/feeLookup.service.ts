import { prisma } from "../../../config/db";
import { FEE_CYCLE_PRESETS, FEE_TYPE_SUGGESTIONS } from "../constants/fee.constants";

/** Read-only academic / reference lookups used by Fee Module 1 forms */
export const getFeeLookups = async (branchId?: number) => {
  const branchFilter = branchId ? { branch_id: branchId } : {};

  const [
    branches,
    sessions,
    programs,
    classes,
    boards,
    intakes,
    academicGroups,
    groupCategories,
    feeSections,
    feeSectionPrints,
    erpFeeHeads,
    feeHeads,
    feeTerms,
    installmentPlans,
    structureCodes,
  ] = await Promise.all([
    prisma.erpBranches.findMany({
      where: { status: 1, deleted_at: null },
      select: { id: true, name: true, branch_code: true, short_name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.sessions.findMany({
      where: { deleted_at: null },
      select: {
        id: true,
        title: true,
        start_year: true,
        end_year: true,
        status: true,
        active_status: true,
      },
      orderBy: { id: "desc" },
      take: 100,
    }),
    prisma.programs.findMany({
      where: { ...(branchId ? { branch_id: branchId } : {}), deleted_at: null },
      select: { id: true, name: true, code: true, branch_id: true, status: true },
      orderBy: { name: "asc" },
      take: 300,
    }),
    prisma.classes.findMany({
      where: { deleted_at: null },
      select: { id: true, name: true, class_code: true, status: true },
      orderBy: { name: "asc" },
      take: 300,
    }),
    prisma.boards.findMany({
      where: { deleted_at: null, ...(branchId ? { branch_id: branchId } : {}) },
      select: { id: true, name: true, board: true, status: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.intake.findMany({
      where: { deleted_at: null },
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
    prisma.academicsGroups.findMany({
      where: { deleted_at: null },
      select: { id: true, name: true, program_id: true },
      orderBy: { name: "asc" },
      take: 300,
    }),
    prisma.groupCategories.findMany({
      where: branchId ? { branch_id: branchId } : undefined,
      select: { id: true, title: true, branch_id: true, status: true },
      orderBy: { title: "asc" },
      take: 100,
    }),
    prisma.feeSections.findMany({
      where: {
        ...(branchId ? { branch_id: branchId } : {}),
        status: "1",
      },
      select: { id: true, title: true, branch_id: true, session_id: true },
      orderBy: { title: "asc" },
      take: 200,
    }),
    prisma.feeSectionPrintIds.findMany({
      where: { status: "1" },
      select: { id: true, title: true },
      orderBy: { id: "asc" },
      take: 200,
    }),
    prisma.erpFeeHead.findMany({
      where: { status: 1, deleted_at: null },
      select: { id: true, title: true, description: true },
      orderBy: { title: "asc" },
      take: 300,
    }),
    prisma.feeHeads.findMany({
      where: {
        ...(branchId ? { branch_id: branchId } : {}),
        status: 1,
      },
      select: {
        id: true,
        fee_head_title: true,
        fee_section_id: true,
        class_id: true,
        program_id: true,
      },
      orderBy: { fee_head_title: "asc" },
      take: 500,
    }),
    prisma.feeTerms.findMany({
      where: {
        ...(branchId ? { branch_id: branchId } : {}),
        status: "1",
      },
      select: {
        id: true,
        term_title: true,
        term_number: true,
        program_id: true,
        class_id: true,
        group_id: true,
        starting_date: true,
        ending_date: true,
      },
      orderBy: { term_number: "asc" },
      take: 300,
    }),
    prisma.installmentPlans.findMany({
      where: {
        ...(branchId ? { branch_id: branchId } : {}),
        status: "1",
      },
      select: {
        id: true,
        name: true,
        installment_no: true,
        fee_term_id: true,
        program_id: true,
        class_id: true,
        group_id: true,
      },
      orderBy: { installment_no: "asc" },
      take: 300,
    }),
    prisma.feeStructures.findMany({
      where: {
        ...(branchId ? { branch_id: branchId } : {}),
        status: 1,
      },
      select: {
        fee_structure_code: true,
        branch_id: true,
        program_id: true,
        class_id: true,
        fee_amount: true,
      },
      take: 1000,
    }),
  ]);

  const codeMap: Record<
    string,
    {
      fee_structure_code: string;
      branch_id: number;
      program_id: number;
      class_id: number;
      total_amount: number;
      line_count: number;
    }
  > = {};
  for (const row of structureCodes) {
    const code = row.fee_structure_code || "";
    if (!code) continue;
    if (!codeMap[code]) {
      codeMap[code] = {
        fee_structure_code: code,
        branch_id: row.branch_id,
        program_id: row.program_id,
        class_id: row.class_id,
        total_amount: 0,
        line_count: 0,
      };
    }
    codeMap[code].total_amount += Number(row.fee_amount || 0);
    codeMap[code].line_count += 1;
  }

  return {
    branches,
    sessions,
    programs,
    classes,
    boards,
    intakes,
    academicGroups,
    groupCategories,
    feeSections,
    feeSectionPrints,
    erpFeeHeads,
    feeHeads,
    feeTerms,
    installmentPlans,
    feeStructureCodes: Object.values(codeMap),
    presets: {
      feeCycles: FEE_CYCLE_PRESETS,
      feeTypeSuggestions: FEE_TYPE_SUGGESTIONS,
    },
    filtersApplied: branchFilter,
  };
};

export const searchStudents = async (params: {
  search?: string;
  branch_id?: number;
  program_id?: number;
  class_id?: number;
  limit?: number;
}) => {
  const limit = params.limit || 30;
  const where: Record<string, unknown> = {
    deleted_at: null,
  };
  if (params.branch_id) where.branch_id = params.branch_id;
  if (params.program_id) where.program_id = params.program_id;
  if (params.class_id) where.class_id = params.class_id;
  if (params.search) {
    const term = params.search.trim();
    const parts = term.split(/\s+/).filter(Boolean);
    const asId = Number(term);
    const isNumericId = /^\d+$/.test(term) && Number.isInteger(asId) && asId > 0;

    if (isNumericId) {
      const orFilters: Record<string, unknown>[] = [{ id: asId }];
      if (term.length >= 3) {
        orFilters.push(
          { walkin_reg_no: { contains: term, mode: "insensitive" as const } },
          { reg_no: { contains: term, mode: "insensitive" as const } }
        );
      }
      where.OR = orFilters;
    } else {
      const nameOrRegMatchers = (value: string) => [
        { first_name: { contains: value, mode: "insensitive" as const } },
        { middle_name: { contains: value, mode: "insensitive" as const } },
        { last_name: { contains: value, mode: "insensitive" as const } },
        { reg_no: { contains: value, mode: "insensitive" as const } },
        { walkin_reg_no: { contains: value, mode: "insensitive" as const } },
        { email: { contains: value, mode: "insensitive" as const } },
      ];

      const orFilters: Record<string, unknown>[] = [...nameOrRegMatchers(term)];
      if (parts.length > 1) {
        orFilters.push({
          AND: parts.map((part) => ({
            OR: [
              { first_name: { contains: part, mode: "insensitive" as const } },
              { middle_name: { contains: part, mode: "insensitive" as const } },
              { last_name: { contains: part, mode: "insensitive" as const } },
            ],
          })),
        });
      }
      where.OR = orFilters;
    }
  }

  const students = await prisma.students.findMany({
    where,
    select: {
      id: true,
      first_name: true,
      middle_name: true,
      last_name: true,
      reg_no: true,
      walkin_reg_no: true,
      branch_id: true,
      program_id: true,
      class_id: true,
      board_id: true,
      intake_id: true,
      academic_group_id: true,
      email: true,
    },
    orderBy: { id: "desc" },
    take: limit,
  });

  return students.map((s) => ({
    ...s,
    name:
      [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ") ||
      `Student #${s.id}`,
    reg_no: s.reg_no || s.walkin_reg_no,
  }));
};

export const getModuleOverview = async (branchId?: number) => {
  const whereBranch = branchId ? { branch_id: branchId } : {};
  const [
    sections,
    heads,
    terms,
    installments,
    structures,
    assignments,
  ] = await Promise.all([
    prisma.feeSections.count({ where: { ...whereBranch, status: "1" } }),
    prisma.feeHeads.count({ where: { ...whereBranch, status: 1 } }),
    prisma.feeTerms.count({ where: { ...whereBranch, status: "1" } }),
    prisma.installmentPlans.count({ where: { ...whereBranch, status: "1" } }),
    prisma.feeStructures.count({ where: { ...whereBranch, status: 1 } }),
    prisma.feeMasterBasics.count({ where: { ...whereBranch, status: "1" } }),
  ]);

  return {
    active_sections: sections,
    active_fee_types: heads,
    active_fee_cycles: terms,
    active_installments: installments,
    active_structure_lines: structures,
    active_assignments: assignments,
  };
};

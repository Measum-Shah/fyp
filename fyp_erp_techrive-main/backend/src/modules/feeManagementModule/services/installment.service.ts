import { prisma } from "../../../config/db";
import { AppError, parseDateOnly } from "../utils/fee.helpers";

export type InstallmentListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  branch_id?: number;
  fee_term_id?: number;
  program_id?: number;
  class_id?: number;
  group_id?: number;
};

export const listInstallments = async (params: InstallmentListParams) => {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params.branch_id) where.branch_id = params.branch_id;
  if (params.fee_term_id) where.fee_term_id = params.fee_term_id;
  if (params.program_id) where.program_id = params.program_id;
  if (params.class_id) where.class_id = params.class_id;
  if (params.group_id !== undefined) where.group_id = params.group_id;
  if (params.status !== undefined && params.status !== "") {
    where.status = params.status;
  }
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { description: { contains: params.search, mode: "insensitive" } },
    ];
  }

  const [rawItems, total] = await Promise.all([
    prisma.installmentPlans.findMany({
      where,
      orderBy: [{ installment_no: "asc" }, { id: "desc" }],
      skip,
      take: limit,
    }),
    prisma.installmentPlans.count({ where }),
  ]);

  const termIds = [...new Set(rawItems.map((i) => i.fee_term_id))];
  const terms = termIds.length
    ? await prisma.feeTerms.findMany({
        where: { id: { in: termIds } },
        select: { id: true, term_title: true, term_number: true },
      })
    : [];
  const termMap = Object.fromEntries(terms.map((t) => [t.id, t]));

  const instIds = rawItems.map((i) => i.id);
  const assignments = instIds.length
    ? await prisma.feeMasterBasics.findMany({
        where: { installment_id: { in: instIds }, status: "1" },
        select: { id: true, installment_id: true, student_id: true, fee_structure_code: true, class_id: true },
      })
    : [];

  const studentIds = [
    ...new Set(
      assignments.map((a) => a.student_id).filter((id): id is number => id != null)
    ),
  ];
  const students = studentIds.length
    ? await prisma.students.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, first_name: true, last_name: true, reg_no: true },
      })
    : [];
  const studentMap = Object.fromEntries(
    students.map((s) => [
      s.id,
      {
        id: s.id,
        name: [s.first_name, s.last_name].filter(Boolean).join(" ") || `Student #${s.id}`,
        reg_no: s.reg_no,
      },
    ])
  );

  const assignmentsByInst = new Map<number, Array<{ id: number; student_id: number | null; student: { id: number; name: string; reg_no: string | null } | null; fee_structure_code: number; class_id: number | null }>>();
  for (const a of assignments) {
    const key = a.installment_id!;
    if (!assignmentsByInst.has(key)) assignmentsByInst.set(key, []);
    assignmentsByInst.get(key)!.push({
      id: a.id,
      student_id: a.student_id,
      student: a.student_id ? studentMap[a.student_id] || null : null,
      fee_structure_code: a.fee_structure_code,
      class_id: a.class_id,
    });
  }

  const exclusions = instIds.length
    ? await prisma.studentInstallmentExclusions.findMany({
        where: { installment_id: { in: instIds } },
      })
    : [];
  const exclStudentIds = [
    ...new Set(exclusions.map((e) => e.student_id)),
  ];
  const exclStudents = exclStudentIds.length
    ? await prisma.students.findMany({
        where: { id: { in: exclStudentIds } },
        select: { id: true, first_name: true, last_name: true, reg_no: true },
      })
    : [];
  const exclStudentMap = Object.fromEntries(
    exclStudents.map((s) => [
      s.id,
      {
        id: s.id,
        name: [s.first_name, s.last_name].filter(Boolean).join(" ") || `Student #${s.id}`,
        reg_no: s.reg_no,
      },
    ])
  );
  const exclusionsByInst = new Map<number, Array<{ id: number; student_id: number; student: { id: number; name: string; reg_no: string | null } | null; reason: string | null; created_at: Date }>>();
  for (const e of exclusions) {
    if (!exclusionsByInst.has(e.installment_id)) exclusionsByInst.set(e.installment_id, []);
    exclusionsByInst.get(e.installment_id)!.push({
      id: e.id,
      student_id: e.student_id,
      student: exclStudentMap[e.student_id] || null,
      reason: e.reason,
      created_at: e.created_at,
    });
  }

  const items = rawItems.map((item) => ({
    ...item,
    fee_term: termMap[item.fee_term_id] || null,
    linked_assignments: assignmentsByInst.get(item.id) || [],
    linked_student_count: (assignmentsByInst.get(item.id) || []).filter((a) => a.student_id).length,
    linked_assignment_count: (assignmentsByInst.get(item.id) || []).length,
    exclusions: exclusionsByInst.get(item.id) || [],
    excluded_student_count: (exclusionsByInst.get(item.id) || []).length,
  }));

  return {
    items,
    meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
  };
};

export const getInstallmentById = async (id: number) => {
  const item = await prisma.installmentPlans.findUnique({ where: { id } });
  if (!item) throw new AppError("Installment plan not found", 404);
  return item;
};

export const createInstallment = async (
  data: {
    branch_id: number;
    session_id?: number;
    program_id: number;
    class_id: number;
    board_id?: number;
    intake_id?: number;
    group_id?: number;
    fee_term_id: number;
    installment_no: number;
    installment_date: string;
    name?: string | null;
    total_days?: string | null;
    description?: string | null;
    status?: string;
  },
  userId: number
) => {
  const term = await prisma.feeTerms.findUnique({
    where: { id: data.fee_term_id },
  });
  if (!term) throw new AppError("Fee cycle / term not found", 404);

  const instDate = parseDateOnly(data.installment_date);
  if (instDate < term.starting_date || instDate > term.ending_date) {
    throw new AppError(
      "Installment date must fall within the selected fee cycle date range"
    );
  }

  const duplicate = await prisma.installmentPlans.findFirst({
    where: {
      fee_term_id: data.fee_term_id,
      installment_no: data.installment_no,
      branch_id: data.branch_id,
      program_id: data.program_id,
      class_id: data.class_id,
      group_id: data.group_id ?? term.group_id,
    },
  });
  if (duplicate) {
    throw new AppError(
      "An installment with this number already exists for the selected fee cycle"
    );
  }

  return prisma.installmentPlans.create({
    data: {
      branch_id: data.branch_id,
      session_id: data.session_id ?? term.session_id,
      program_id: data.program_id,
      class_id: data.class_id,
      board_id: data.board_id ?? term.board_id,
      intake_id: data.intake_id ?? term.intake_id,
      group_id: data.group_id ?? term.group_id,
      fee_term_id: data.fee_term_id,
      installment_no: data.installment_no,
      installment_date: instDate,
      name: data.name?.trim() || `Installment ${data.installment_no}`,
      total_days: data.total_days ?? null,
      description: data.description ?? null,
      status: data.status ?? "1",
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
};

export const updateInstallment = async (
  id: number,
  data: Partial<{
    branch_id: number;
    session_id: number;
    program_id: number;
    class_id: number;
    board_id: number;
    intake_id: number;
    group_id: number;
    fee_term_id: number;
    installment_no: number;
    installment_date: string;
    name: string | null;
    total_days: string | null;
    description: string | null;
    status: string;
  }>,
  userId: number
) => {
  const existing = await getInstallmentById(id);
  const termId = data.fee_term_id ?? existing.fee_term_id;
  const term = await prisma.feeTerms.findUnique({ where: { id: termId } });
  if (!term) throw new AppError("Fee cycle / term not found", 404);

  if (data.installment_date) {
    const instDate = parseDateOnly(data.installment_date);
    if (instDate < term.starting_date || instDate > term.ending_date) {
      throw new AppError(
        "Installment date must fall within the selected fee cycle date range"
      );
    }
  }

  return prisma.installmentPlans.update({
    where: { id },
    data: {
      ...data,
      installment_date: data.installment_date
        ? parseDateOnly(data.installment_date)
        : undefined,
      name: data.name === undefined ? undefined : data.name?.trim() || null,
      last_updated_by: userId,
      updated_at: new Date(),
    },
  });
};

export const setInstallmentStatus = async (
  id: number,
  status: string,
  userId: number
) => {
  await getInstallmentById(id);
  return prisma.installmentPlans.update({
    where: { id },
    data: { status, last_updated_by: userId, updated_at: new Date() },
  });
};

export const deleteInstallment = async (id: number) => {
  await getInstallmentById(id);
  const linked = await prisma.feeMasterBasics.count({
    where: { installment_id: id },
  });
  if (linked > 0) {
    throw new AppError(
      `Cannot delete: ${linked} fee assignment(s) use this installment. Deactivate instead.`
    );
  }
  return prisma.installmentPlans.delete({ where: { id } });
};

// ── Installment Exclusions ───────────────────────────────────────────────────

export const excludeStudentFromInstallment = async (
  data: { student_id: number; installment_id: number; reason?: string | null },
  userId: number
) => {
  const student = await prisma.students.findFirst({
    where: { id: data.student_id, deleted_at: null },
  });
  if (!student) throw new AppError("Student not found", 404);

  const plan = await prisma.installmentPlans.findUnique({
    where: { id: data.installment_id },
  });
  if (!plan) throw new AppError("Installment plan not found", 404);

  const existing = await prisma.studentInstallmentExclusions.findUnique({
    where: {
      student_id_installment_id: {
        student_id: data.student_id,
        installment_id: data.installment_id,
      },
    },
  });
  if (existing) {
    throw new AppError("Student is already excluded from this installment");
  }

  return prisma.studentInstallmentExclusions.create({
    data: {
      student_id: data.student_id,
      installment_id: data.installment_id,
      reason: data.reason?.trim() || null,
      excluded_by: userId,
    },
  });
};

export const removeInstallmentExclusion = async (
  data: { student_id: number; installment_id: number }
) => {
  const existing = await prisma.studentInstallmentExclusions.findUnique({
    where: {
      student_id_installment_id: {
        student_id: data.student_id,
        installment_id: data.installment_id,
      },
    },
  });
  if (!existing) {
    throw new AppError("No exclusion found for this student/installment", 404);
  }

  return prisma.studentInstallmentExclusions.delete({
    where: { id: existing.id },
  });
};

export const getInstallmentExclusions = async (installmentId: number) => {
  const exclusions = await prisma.studentInstallmentExclusions.findMany({
    where: { installment_id: installmentId },
  });

  if (!exclusions.length) return [];

  const studentIds = exclusions.map((e) => e.student_id);
  const students = await prisma.students.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, first_name: true, last_name: true, reg_no: true },
  });
  const studentMap = Object.fromEntries(
    students.map((s) => [
      s.id,
      {
        id: s.id,
        name: [s.first_name, s.last_name].filter(Boolean).join(" ") || `Student #${s.id}`,
        reg_no: s.reg_no,
      },
    ])
  );

  return exclusions.map((e) => ({
    ...e,
    student: studentMap[e.student_id] || null,
  }));
};

export const isStudentExcludedFromInstallment = async (
  studentId: number,
  installmentId: number
): Promise<boolean> => {
  const exclusion = await prisma.studentInstallmentExclusions.findUnique({
    where: {
      student_id_installment_id: {
        student_id: studentId,
        installment_id: installmentId,
      },
    },
  });
  return !!exclusion;
};

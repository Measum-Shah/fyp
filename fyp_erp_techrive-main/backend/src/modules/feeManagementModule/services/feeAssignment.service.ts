import { prisma } from "../../../config/db";
import { AppError, parseDateOnly } from "../utils/fee.helpers";
import { ASSIGNMENT_FEE_TYPE } from "../constants/fee.constants";

export type AssignmentListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  branch_id?: number;
  session_id?: number;
  program_id?: number;
  class_id?: number;
  student_id?: number;
  scope?: "class" | "group" | "student";
};

const scopeToFeeType = (scope: "class" | "group" | "student") => {
  if (scope === "class") return ASSIGNMENT_FEE_TYPE.CLASS;
  if (scope === "group") return ASSIGNMENT_FEE_TYPE.GROUP;
  return ASSIGNMENT_FEE_TYPE.STUDENT;
};

export const listAssignments = async (params: AssignmentListParams) => {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params.branch_id) where.branch_id = params.branch_id;
  if (params.session_id) where.session_id = params.session_id;
  if (params.program_id) where.program_id = params.program_id;
  if (params.class_id) where.class_id = params.class_id;
  if (params.student_id) where.student_id = params.student_id;
  if (params.status !== undefined && params.status !== "") {
    where.status = params.status;
  }
  if (params.scope) {
    where.fee_type = scopeToFeeType(params.scope);
  }

  const [rawItems, total] = await Promise.all([
    prisma.feeMasterBasics.findMany({
      where,
      orderBy: { id: "desc" },
      skip,
      take: limit,
    }),
    prisma.feeMasterBasics.count({ where }),
  ]);

  const studentIds = [
    ...new Set(
      rawItems
        .map((i) => i.student_id)
        .filter((id): id is number => id != null)
    ),
  ];
  const students = studentIds.length
    ? await prisma.students.findMany({
        where: { id: { in: studentIds } },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          reg_no: true,
        },
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

  const items = rawItems.map((item) => ({
    ...item,
    scope:
      item.fee_type === ASSIGNMENT_FEE_TYPE.GROUP
        ? "group"
        : item.fee_type === ASSIGNMENT_FEE_TYPE.STUDENT
          ? "student"
          : "class",
    student: item.student_id ? studentMap[item.student_id] || null : null,
  }));

  return {
    items,
    meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
  };
};

export const getAssignmentById = async (id: number) => {
  const basic = await prisma.feeMasterBasics.findUnique({ where: { id } });
  if (!basic) throw new AppError("Fee assignment not found", 404);

  const lines = await prisma.feeMasters.findMany({
    where: { fee_master_basic_id_fk: id },
    orderBy: { id: "asc" },
  });

  const structureCode = String(basic.fee_structure_code);
  const structureLines = await prisma.feeStructures.findMany({
    where: {
      OR: [
        { fee_structure_code: structureCode },
        ...(Number.isNaN(Number(structureCode))
          ? []
          : [{ fee_structure_code: structureCode }]),
      ],
    },
  });

  // Also try matching numeric codes stored as strings of digits
  const byNumeric = await prisma.feeStructures.findMany({
    where: { fee_structure_code: String(basic.fee_structure_code) },
  });

  return {
    ...basic,
    scope:
      basic.fee_type === ASSIGNMENT_FEE_TYPE.GROUP
        ? "group"
        : basic.fee_type === ASSIGNMENT_FEE_TYPE.STUDENT
          ? "student"
          : "class",
    master_lines: lines,
    structure_lines: structureLines.length ? structureLines : byNumeric,
  };
};

export const createAssignment = async (
  data: {
    scope: "class" | "group" | "student";
    branch_id: number;
    session_id?: number;
    program_id: number;
    class_id: number;
    board_id: number;
    intake_id?: number;
    fee_structure_code: number;
    installment_id?: number;
    group_id?: number;
    student_id?: number;
    basic_fee?: string | null;
    total_fee?: string | null;
    discount_fee?: string | null;
    discount_type?: number;
    special_discount_comment?: string | null;
    fee_due_date_start?: string | null;
    fee_due_date_end?: string | null;
    status?: string;
  },
  userId: number
) => {
  const structureCodeStr = String(data.fee_structure_code);
  let structureLines = await prisma.feeStructures.findMany({
    where: {
      fee_structure_code: structureCodeStr,
      status: 1,
    },
  });

  // Support structures whose code is purely numeric and stored as that number string
  if (!structureLines.length) {
    structureLines = await prisma.feeStructures.findMany({
      where: {
        fee_structure_code: structureCodeStr,
      },
    });
  }

  // Also allow looking up by matching any structure whose code equals the numeric id grouping
  // when users pass the numeric portion from UI selections
  if (!structureLines.length) {
    const allActive = await prisma.feeStructures.findMany({
      where: {
        branch_id: data.branch_id,
        program_id: data.program_id,
        class_id: data.class_id,
        status: 1,
      },
      take: 500,
    });
    structureLines = allActive.filter(
      (l) =>
        l.fee_structure_code === structureCodeStr ||
        Number(l.fee_structure_code) === data.fee_structure_code
    );
  }

  if (!structureLines.length) {
    throw new AppError(
      "No active fee structure lines found for the selected structure code"
    );
  }

  if (data.installment_id) {
    const plan = await prisma.installmentPlans.findUnique({
      where: { id: data.installment_id },
    });
    if (!plan) throw new AppError("Installment plan not found", 404);
  }

  if (data.scope === "student") {
    if (!data.student_id) {
      throw new AppError("student_id is required for student assignment");
    }
    const student = await prisma.students.findUnique({
      where: { id: data.student_id },
    });
    if (!student) throw new AppError("Student not found", 404);

    const existing = await prisma.feeMasterBasics.findFirst({
      where: {
        student_id: data.student_id,
        fee_structure_code: data.fee_structure_code,
        status: "1",
      },
    });
    if (existing) {
      throw new AppError(
        "This student already has an active assignment for the selected fee structure"
      );
    }
  }

  if (data.scope === "class") {
    const existing = await prisma.feeMasterBasics.findFirst({
      where: {
        fee_type: ASSIGNMENT_FEE_TYPE.CLASS,
        class_id: data.class_id,
        program_id: data.program_id,
        branch_id: data.branch_id,
        fee_structure_code: data.fee_structure_code,
        student_id: null,
        status: "1",
      },
    });
    if (existing) {
      throw new AppError(
        "This class already has an active assignment for the selected fee structure"
      );
    }
  }

  if (data.scope === "group") {
    if (!data.group_id) {
      throw new AppError("group_id is required for group assignment");
    }
    const group = await prisma.academicsGroups.findUnique({
      where: { id: data.group_id },
    });
    if (!group) throw new AppError("Student group not found", 404);
  }

  const computedTotal =
    data.total_fee ??
    String(
      structureLines.reduce((sum, line) => sum + Number(line.fee_amount || 0), 0)
    );

  const basic = await prisma.feeMasterBasics.create({
    data: {
      branch_id: data.branch_id,
      session_id: data.session_id ?? null,
      program_id: data.program_id,
      class_id: data.class_id,
      board_id: data.board_id,
      intake_id: data.intake_id ?? 0,
      student_id:
        data.scope === "student" ? data.student_id! : null,
      installment_id: data.installment_id ?? null,
      fee_structure_code: data.fee_structure_code,
      fee_type: scopeToFeeType(data.scope),
      basic_fee: data.basic_fee ?? computedTotal,
      total_fee: computedTotal,
      discount_fee: data.discount_fee ?? "0",
      total_after_discount: String(
        Math.max(
          0,
          Number(computedTotal) - Number(data.discount_fee || 0)
        )
      ),
      discount_type: data.discount_type ?? 1,
      special_discount_comment: data.special_discount_comment ?? null,
      fee_due_date_start: data.fee_due_date_start
        ? parseDateOnly(data.fee_due_date_start)
        : null,
      fee_due_date_end: data.fee_due_date_end
        ? parseDateOnly(data.fee_due_date_end)
        : null,
      status: data.status ?? "1",
      fee_master_basic_id:
        data.scope === "group" ? `GROUP:${data.group_id}` : null,
      created_by: userId,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  const headIds = structureLines.map((l) => l.fee_head_id);
  const heads = await prisma.feeHeads.findMany({
    where: { id: { in: headIds } },
  });
  const headMap = Object.fromEntries(
    heads.map((h) => [h.id, h.fee_head_title || `Head-${h.id}`])
  );

  const masterLines = await prisma.$transaction(
    structureLines.map((line) =>
      prisma.feeMasters.create({
        data: {
          branch_id: data.branch_id,
          session_id: data.session_id ?? null,
          program_id: data.program_id,
          class_id: data.class_id,
          board_id: data.board_id,
          intake_id: data.intake_id ?? null,
          students_id: data.scope === "student" ? data.student_id! : 0,
          fee_head: headMap[line.fee_head_id] || String(line.fee_head_id),
          fee_structure_code: data.fee_structure_code,
          fee_head_term: line.term_id ?? 1,
          fee_amount: Math.round(Number(line.fee_amount || 0)),
          fee_discount_percentage: 0,
          scholarship: 0,
          scholarship_no_of_a: 0,
          discount_type: data.discount_type ?? 1,
          status: 1,
          created_by: userId,
          fee_master_basic_id: String(basic.id),
          fee_master_basic_id_fk: basic.id,
          fee_paid_amount: 0,
          created_at: new Date(),
          updated_at: new Date(),
        },
      })
    )
  );

  // Keep student_fee_settings in sync for individual assignments
  if (data.scope === "student" && data.student_id) {
    const existingSettings = await prisma.studentFeeSettings.findFirst({
      where: {
        student_id: data.student_id,
        program_id: data.program_id,
      },
    });
    if (existingSettings) {
      await prisma.studentFeeSettings.update({
        where: { id: existingSettings.id },
        data: {
          installment_id: data.installment_id ?? existingSettings.installment_id,
          basic_fee: computedTotal,
          discount: data.discount_fee ?? "0",
          status: "1",
          updated_at: new Date(),
        },
      });
    } else {
      await prisma.studentFeeSettings.create({
        data: {
          student_id: data.student_id,
          program_id: data.program_id,
          installment_id: data.installment_id ?? null,
          basic_fee: computedTotal,
          discount: data.discount_fee ?? "0",
          status: "1",
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }
  }

  return { ...basic, master_lines: masterLines };
};

export const updateAssignment = async (
  id: number,
  data: Partial<{
    status: string;
    installment_id: number;
    basic_fee: string | null;
    total_fee: string | null;
    discount_fee: string | null;
    discount_type: number;
    special_discount_comment: string | null;
    fee_due_date_start: string | null;
    fee_due_date_end: string | null;
  }>,
  userId: number
) => {
  await getAssignmentById(id);

  return prisma.feeMasterBasics.update({
    where: { id },
    data: {
      status: data.status,
      installment_id: data.installment_id,
      basic_fee: data.basic_fee,
      total_fee: data.total_fee,
      discount_fee: data.discount_fee,
      discount_type: data.discount_type,
      special_discount_comment: data.special_discount_comment,
      fee_due_date_start:
        data.fee_due_date_start === null
          ? null
          : data.fee_due_date_start
            ? parseDateOnly(data.fee_due_date_start)
            : undefined,
      fee_due_date_end:
        data.fee_due_date_end === null
          ? null
          : data.fee_due_date_end
            ? parseDateOnly(data.fee_due_date_end)
            : undefined,
      last_updated_by: userId,
      updated_at: new Date(),
    },
  });
};

export const setAssignmentStatus = async (
  id: number,
  status: string,
  userId: number
) => {
  await getAssignmentById(id);
  const updated = await prisma.feeMasterBasics.update({
    where: { id },
    data: { status, last_updated_by: userId, updated_at: new Date() },
  });

  await prisma.feeMasters.updateMany({
    where: { fee_master_basic_id_fk: id },
    data: {
      status: status === "1" ? 1 : 0,
      last_updated_by: userId,
      updated_at: new Date(),
    },
  });

  return updated;
};

export const deleteAssignment = async (id: number) => {
  const basic = await prisma.feeMasterBasics.findUnique({ where: { id } });
  if (!basic) throw new AppError("Fee assignment not found", 404);

  await prisma.$transaction([
    prisma.feeMasters.deleteMany({ where: { fee_master_basic_id_fk: id } }),
    prisma.feeMasterBasics.delete({ where: { id } }),
  ]);

  return { id };
};

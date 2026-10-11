import { prisma } from "../../../config/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  ADMISSION_STATUS,
  FEE_PAYMENT_STATUS,
} from "../constants/studentEnrollment.constants";

const num = (v: unknown) => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

const studentDisplayName = (s: {
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
  id: number;
}) =>
  [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ").trim() ||
  `Student #${s.id}`;

/**
 * Read-only fee summary for a student using existing Fee tables.
 * Does not import or modify Fee Management module code.
 */
export async function getStudentFeePaymentStatus(studentId: number) {
  const [basics, lines, collections] = await Promise.all([
    prisma.feeMasterBasics.findMany({
      where: { student_id: studentId },
      select: {
        id: true,
        total_fee: true,
        total_after_discount: true,
        basic_fee: true,
        fee_due_date_end: true,
        status: true,
        bill_no: true,
      },
    }),
    prisma.feeMasters.findMany({
      where: { students_id: studentId },
      select: {
        id: true,
        fee_master_basic_id_fk: true,
        fee_amount: true,
        fee_paid_amount: true,
        status: true,
      },
    }),
    prisma.feeCollections.findMany({
      where: { students_id: studentId },
      select: {
        id: true,
        paid_amount: true,
        total_amount: true,
        all_paid: true,
        fee_status: true,
        active_status: true,
      },
    }),
  ]);

  const activeBasics = basics.filter(
    (b) => b.status === "1" || b.status === "Active" || b.status == null
  );
  const relevantBasics = activeBasics.length ? activeBasics : basics;

  let totalDues = 0;
  let totalPaid = 0;
  let overdue = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const basic of relevantBasics) {
    const basicLines = lines.filter((l) => l.fee_master_basic_id_fk === basic.id);
    const due =
      num(basic.total_after_discount) ||
      num(basic.total_fee) ||
      basicLines.reduce((s, l) => s + num(l.fee_amount), 0);
    const paidFromLines = basicLines.reduce(
      (s, l) => s + num(l.fee_paid_amount),
      0
    );
    totalDues += due;
    totalPaid += paidFromLines;

    const dueEnd = basic.fee_due_date_end
      ? new Date(basic.fee_due_date_end)
      : null;
    if (dueEnd) dueEnd.setHours(0, 0, 0, 0);
    const balance = Math.max(0, due - paidFromLines);
    if (balance > 0 && dueEnd && dueEnd < today) overdue += balance;
  }

  const collectionPaid = collections
    .filter((c) => c.active_status === 1 || c.active_status == null)
    .reduce((s, c) => s + num(c.paid_amount), 0);
  if (totalPaid === 0 && collectionPaid > 0) {
    totalPaid = collectionPaid;
  }

  const outstanding = Math.max(0, totalDues - totalPaid);
  const fullyPaidFlag = collections.some(
    (c) => c.all_paid === 1 && (c.active_status === 1 || c.active_status == null)
  );

  let fee_status: string = FEE_PAYMENT_STATUS.NO_RECORD;
  if (
    relevantBasics.length === 0 &&
    lines.length === 0 &&
    collections.length === 0
  ) {
    fee_status = FEE_PAYMENT_STATUS.NO_RECORD;
  } else if ((outstanding <= 0 && totalDues > 0) || fullyPaidFlag) {
    fee_status = FEE_PAYMENT_STATUS.PAID;
  } else if (overdue > 0) {
    fee_status = FEE_PAYMENT_STATUS.OVERDUE;
  } else if (totalPaid > 0 && outstanding > 0) {
    fee_status = FEE_PAYMENT_STATUS.PARTIAL;
  } else if (relevantBasics.length === 0 && collections.length === 0) {
    fee_status = FEE_PAYMENT_STATUS.NO_RECORD;
  } else {
    fee_status = FEE_PAYMENT_STATUS.UNPAID;
  }

  return {
    fee_status,
    is_paid: fee_status === FEE_PAYMENT_STATUS.PAID,
    total_dues: totalDues,
    total_paid: totalPaid,
    outstanding_balance: outstanding,
    has_fee_assignment: relevantBasics.length > 0 || lines.length > 0,
    assignment_count: relevantBasics.length,
    collection_count: collections.length,
  };
}

export type ParentEnrollmentInput = {
  father_first_name?: string | null;
  father_middle_name?: string | null;
  father_last_name?: string | null;
  father_cnic?: string | null;
  father_occupation?: string | null;
  father_office?: string | null;
  father_office_number?: string | null;
  father_mobile_1?: string | null;
  father_email?: string | null;
  father_is_staff?: number | string | boolean | null;
  father_staff_ref?: string | null;

  mother_first_name?: string | null;
  mother_middle_name?: string | null;
  mother_last_name?: string | null;
  mother_cnic?: string | null;
  mother_occupation?: string | null;
  mother_office?: string | null;
  mother_office_number?: string | null;
  mother_mobile_1?: string | null;
  mother_email?: string | null;
  mother_is_staff?: number | string | boolean | null;
  mother_staff_ref?: string | null;

  guardian_is?: string | null;
  guardian_first_name?: string | null;
  guardian_middle_name?: string | null;
  guardian_last_name?: string | null;
  guardian_cnic?: string | null;
  guardian_occupation?: string | null;
  guardian_relation?: string | null;
  guardian_mobile_1?: string | null;
  guardian_email?: string | null;
  guardian_address?: string | null;
  guardian_is_staff?: number | string | boolean | null;
  guardian_staff_ref?: string | null;
};

export type CreateStudentEnrollmentInput = {
  first_name: string;
  middle_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  blood_group?: string | null;
  nationality?: string | null;
  mother_tongue?: string | null;
  email?: string | null;
  father_guardian_name?: string | null;
  cnic_b_form?: string | null;
  father_cnic?: string | null;
  mother_cnic?: string | null;
  mobile_1?: string | null;
  mobile_2?: string | null;
  home_phone?: string | null;
  state?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  temp_address?: string | null;
  extra_info?: string | null;
  disability?: number | string | boolean | null;
  disability_description?: string | null;
  branch_id: number;
  /** ActiveSessions.id (not Sessions.id) */
  active_session_id: number;
  /** ActiveSessionSections.id */
  active_session_section_id: number;
  board_id?: number | null;
  program_id?: number | null;
  academic_group_id?: number | null;
  class_id?: number | null;
  intake_id?: number | null;
  section_id?: number | null;
  session_id?: number | null;
  term_id?: number | null;
  reg_no?: string | null;
  reg_date?: string | null;
  previous_school?: string | null;
  previous_class?: string | null;
  /** Boards.id for previous education board (stored on academic_infos.board as boards.board code, else name) */
  previous_board_id?: number | null;
  previous_qualification?: string | null;
  previous_total_marks?: number | string | null;
  previous_obtained_marks?: number | string | null;
  previous_percentage?: number | string | null;
  previous_pass_year?: string | null;
  /** Public path under /uploads/student-enrollment-photos/... */
  student_image?: string | null;
  created_by?: number | null;
  parent?: ParentEnrollmentInput | null;
};

const optionalInt = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const optionalStr = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
};

const asYesNoFlag = (v: unknown): number => {
  if (v === true || v === 1 || v === "1" || v === "Yes" || v === "yes") return 1;
  return 0;
};

const optionalNonNegNumber = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
};

/** Safe percentage from obtained/total; returns null if not calculable. */
const calcPercentage = (
  obtained: number | null,
  total: number | null
): number | null => {
  if (obtained === null || total === null || total <= 0) return null;
  if (obtained > total) return null;
  return Math.round((obtained / total) * 100);
};

const divisionFromPercentage = (pct: number | null): string => {
  if (pct === null) return "N/A";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  if (pct > 0) return "E";
  return "N/A";
};

/** Matches academic_infos.board @db.VarChar(50) — prefer boards.board short code. */
const ACADEMIC_INFO_BOARD_MAX_LEN = 50;

/**
 * Value persisted on academic_infos.board for a selected previous_board_id.
 * Prefer boards.board (short code) so long boards.name values still fit VARCHAR(50).
 * Falls back to boards.name only when it already fits; never truncates meaningful text.
 */
const resolveAcademicInfoBoardLabel = (boardRow: {
  name: string;
  board: string | null;
}): string | null => {
  const shortCode = optionalStr(boardRow.board);
  if (shortCode) {
    if (shortCode.length > ACADEMIC_INFO_BOARD_MAX_LEN) {
      throw Object.assign(
        new Error(
          "Selected previous board code exceeds the allowed length for academic history."
        ),
        { statusCode: 400 }
      );
    }
    return shortCode;
  }
  const name = optionalStr(boardRow.name);
  if (!name) return null;
  if (name.length <= ACADEMIC_INFO_BOARD_MAX_LEN) return name;
  throw Object.assign(
    new Error(
      "Selected previous board has no short code and its name exceeds the allowed length for academic history."
    ),
    { statusCode: 400 }
  );
};

const hasPreviousEducationData = (input: CreateStudentEnrollmentInput) =>
  !!(
    optionalStr(input.previous_school) ||
    optionalStr(input.previous_class) ||
    optionalInt(input.previous_board_id) ||
    optionalStr(input.previous_qualification) ||
    optionalNonNegNumber(input.previous_total_marks) !== null ||
    optionalNonNegNumber(input.previous_obtained_marks) !== null ||
    optionalStr(input.previous_pass_year)
  );

async function nextWalkInRegNo(branchId: number): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `WI-${year}-`;
  const existing = await prisma.students.findMany({
    where: {
      branch_id: branchId,
      walkin_reg_no: { startsWith: prefix },
    },
    select: { walkin_reg_no: true },
    orderBy: { id: "desc" },
    take: 50,
  });

  let maxSeq = 0;
  for (const row of existing) {
    const raw = row.walkin_reg_no || "";
    const part = raw.slice(prefix.length);
    const n = parseInt(part, 10);
    if (Number.isFinite(n) && n > maxSeq) maxSeq = n;
  }
  return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
}

function composeName(
  first?: string | null,
  middle?: string | null,
  last?: string | null
) {
  return [first, middle, last].filter(Boolean).join(" ").trim();
}

function buildFatherGuardianName(
  parent: ParentEnrollmentInput | null | undefined,
  fallback?: string | null
) {
  const fromFather = composeName(
    parent?.father_first_name,
    parent?.father_middle_name,
    parent?.father_last_name
  );
  if (fromFather) return fromFather;
  const fromGuardian = composeName(
    parent?.guardian_first_name,
    parent?.guardian_middle_name,
    parent?.guardian_last_name
  );
  if (fromGuardian) return fromGuardian;
  return optionalStr(fallback);
}

function deriveStaffRef(parent: ParentEnrollmentInput | null | undefined) {
  if (!parent) return null;
  if (asYesNoFlag(parent.father_is_staff) && optionalStr(parent.father_staff_ref)) {
    return optionalStr(parent.father_staff_ref);
  }
  if (asYesNoFlag(parent.mother_is_staff) && optionalStr(parent.mother_staff_ref)) {
    return optionalStr(parent.mother_staff_ref);
  }
  if (
    asYesNoFlag(parent.guardian_is_staff) &&
    optionalStr(parent.guardian_staff_ref)
  ) {
    return optionalStr(parent.guardian_staff_ref);
  }
  return null;
}

/**
 * Validates ActiveSessions + ActiveSessionSections linkage and returns the rows.
 */
async function resolveActiveAcademicContext(input: {
  branch_id: number;
  active_session_id: number;
  active_session_section_id: number;
}) {
  const activeSession = await prisma.activeSessions.findFirst({
    where: {
      id: input.active_session_id,
      deleted_at: null,
      status: "Active",
    },
  });

  if (!activeSession) {
    throw Object.assign(
      new Error("Selected active session does not exist or is not Active."),
      { statusCode: 400 }
    );
  }

  if (activeSession.branch_id !== input.branch_id) {
    throw Object.assign(
      new Error("Selected active session does not belong to the selected branch."),
      { statusCode: 400 }
    );
  }

  const activeSessionSection = await prisma.activeSessionSections.findFirst({
    where: { id: input.active_session_section_id },
  });

  if (!activeSessionSection) {
    throw Object.assign(
      new Error("Selected active session section does not exist."),
      { statusCode: 400 }
    );
  }

  if (activeSessionSection.active_session_id !== activeSession.id) {
    throw Object.assign(
      new Error(
        "Selected active session section does not belong to the selected active session."
      ),
      { statusCode: 400 }
    );
  }

  const section = await prisma.sections.findFirst({
    where: {
      id: activeSessionSection.section_id,
      deleted_at: null,
    },
    select: { id: true, name: true, status: true },
  });

  if (!section) {
    throw Object.assign(
      new Error("Section linked to the active session section is invalid."),
      { statusCode: 400 }
    );
  }

  return { activeSession, activeSessionSection, section };
}

export class StudentEnrollmentService {
  static async getLookups(branchId?: number) {
    // ActiveSessions rows with status Active (seed + production convention).
    const activeSessionWhere: Record<string, unknown> = {
      deleted_at: null,
      status: "Active",
    };
    if (branchId) activeSessionWhere.branch_id = branchId;

    const [
      branches,
      activeSessions,
      programs,
      classes,
      boards,
      intakes,
      staffRows,
    ] = await Promise.all([
      prisma.erpBranches.findMany({
        where: { status: 1, deleted_at: null },
        select: { id: true, name: true, branch_code: true },
        orderBy: { name: "asc" },
        take: 200,
      }),
      prisma.activeSessions.findMany({
        where: activeSessionWhere,
        select: {
          id: true,
          title: true,
          session_id: true,
          board_id: true,
          branch_id: true,
          program_id: true,
          class_id: true,
          intake_id: true,
          status: true,
        },
        orderBy: { id: "desc" },
        take: 200,
      }),
      prisma.programs.findMany({
        where: {
          deleted_at: null,
          ...(branchId ? { branch_id: branchId } : {}),
        },
        select: {
          id: true,
          name: true,
          code: true,
          branch_id: true,
          status: true,
        },
        orderBy: { name: "asc" },
        take: 300,
      }),
      prisma.classes.findMany({
        where: { deleted_at: null },
        select: { id: true, name: true, class_code: true, status: true },
        orderBy: { name: "asc" },
        take: 300,
      }),
      // Previous education board dropdown — all boards (not branch-limited)
      prisma.boards.findMany({
        where: {
          deleted_at: null,
          NOT: {
            OR: [{ status: "Inactive" }, { status: "0" }],
          },
        },
        select: { id: true, name: true, board: true, status: true, branch_id: true },
        orderBy: { name: "asc" },
        take: 300,
      }),
      prisma.intake.findMany({
        where: { deleted_at: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
        take: 100,
      }),
      prisma.staff.findMany({
        where: { deleted_at: null, status: "Active" },
        select: {
          id: true,
          first_name: true,
          middle_name: true,
          last_name: true,
          reg_no: true,
          staff_type: true,
          branch_id: true,
        },
        orderBy: { id: "asc" },
        take: 400,
      }),
    ]);

    const activeSessionIds = activeSessions.map((a) => a.id);
    const assRows =
      activeSessionIds.length === 0
        ? []
        : await prisma.activeSessionSections.findMany({
            where: { active_session_id: { in: activeSessionIds } },
            select: {
              id: true,
              active_session_id: true,
              section_id: true,
            },
            orderBy: { id: "asc" },
            take: 1000,
          });

    const sectionIds = [...new Set(assRows.map((r) => r.section_id))];
    const sectionRows =
      sectionIds.length === 0
        ? []
        : await prisma.sections.findMany({
            where: { id: { in: sectionIds } },
            select: { id: true, name: true, status: true, deleted_at: true },
          });
    const sectionMap = Object.fromEntries(sectionRows.map((s) => [s.id, s]));

    // Keep ASS rows even if the section name lookup fails (still selectable by id)
    const active_session_sections = assRows.map((r) => ({
      id: r.id,
      active_session_id: r.active_session_id,
      section_id: r.section_id,
      name: sectionMap[r.section_id]?.name || `Section #${r.section_id}`,
      status: sectionMap[r.section_id]?.status ?? null,
    }));

    const calendarSessionIds = [
      ...new Set(activeSessions.map((a) => a.session_id)),
    ];
    const calendarSessions =
      calendarSessionIds.length === 0
        ? []
        : await prisma.sessions.findMany({
            where: { id: { in: calendarSessionIds }, deleted_at: null },
            select: {
              id: true,
              title: true,
              start_year: true,
              end_year: true,
              active_status: true,
              status: true,
            },
          });

    const staff = staffRows.map((s) => ({
      id: s.id,
      name:
        [s.first_name, s.middle_name, s.last_name].filter(Boolean).join(" ").trim() ||
        `Staff #${s.id}`,
      reg_no: s.reg_no,
      staff_type: s.staff_type,
      branch_id: s.branch_id,
      staff_ref: String(s.id),
    }));

    return {
      branches,
      active_sessions: activeSessions,
      active_session_sections,
      sessions: calendarSessions,
      programs,
      classes,
      boards,
      intakes,
      staff,
      admission_statuses: [
        ADMISSION_STATUS.WALK_IN,
        ADMISSION_STATUS.REGISTERED,
      ],
    };
  }

  static async listEnrollments(params: {
    branch_id?: number;
    admission_status?: string;
    search?: string;
    limit?: number;
  }) {
    const limit = Math.min(params.limit || 50, 100);
    const where: Record<string, unknown> = {
      deleted_at: null,
      OR: [
        { admission_status: ADMISSION_STATUS.WALK_IN },
        { admission_status: ADMISSION_STATUS.REGISTERED },
      ],
    };

    if (params.branch_id) where.branch_id = params.branch_id;
    if (params.admission_status) {
      where.OR = undefined;
      where.admission_status = params.admission_status;
    }
    if (params.search) {
      const s = params.search.trim();
      where.AND = [
        {
          OR: [
            { first_name: { contains: s, mode: "insensitive" } },
            { last_name: { contains: s, mode: "insensitive" } },
            { reg_no: { contains: s, mode: "insensitive" } },
            { walkin_reg_no: { contains: s, mode: "insensitive" } },
            { email: { contains: s, mode: "insensitive" } },
          ],
        },
      ];
    }

    const rows = await prisma.students.findMany({
      where,
      orderBy: { id: "desc" },
      take: limit,
    });

    return rows.map((r) => ({
      ...r,
      full_name: studentDisplayName(r),
    }));
  }

  static async getEnrollment(id: number) {
    const student = await prisma.students.findFirst({
      where: { id, deleted_at: null },
    });
    if (!student) {
      throw Object.assign(new Error("Student enrollment not found"), {
        statusCode: 404,
      });
    }

    const parent = await prisma.parentDetails.findFirst({
      where: {
        students_id: id,
        deleted_at: null,
      },
      orderBy: { id: "desc" },
    });

    let active_session = null;
    if (student.active_session_id) {
      active_session = await prisma.activeSessions.findFirst({
        where: { id: student.active_session_id },
      });
    }

    let active_session_section = null;
    if (student.active_session_section_id) {
      const ass = await prisma.activeSessionSections.findFirst({
        where: { id: student.active_session_section_id },
      });
      if (ass) {
        const sec = await prisma.sections.findFirst({
          where: { id: ass.section_id },
          select: { id: true, name: true },
        });
        active_session_section = {
          ...ass,
          name: sec?.name || `Section #${ass.section_id}`,
        };
      }
    }

    const active_session_student =
      await prisma.activeSessionStudents.findFirst({
        where: {
          student_id: id,
          deleted_at: null,
          ...(student.active_session_section_id
            ? { active_session_section_id: student.active_session_section_id }
            : {}),
        },
        orderBy: { id: "desc" },
      });

    const academic_info = await prisma.academicInfos.findFirst({
      where: { students_id: id, status: 1 },
      orderBy: { id: "desc" },
    });

    let previous_board_id: number | null = null;
    if (academic_info?.board) {
      const boardMatch = await prisma.boards.findFirst({
        where: {
          deleted_at: null,
          OR: [
            { name: academic_info.board },
            { board: academic_info.board },
          ],
        },
        select: { id: true },
      });
      previous_board_id = boardMatch?.id ?? null;
    }

    const fee = await getStudentFeePaymentStatus(id);
    return {
      ...student,
      full_name: studentDisplayName(student),
      parent,
      active_session,
      active_session_section,
      active_session_student,
      academic_info,
      previous_board_id,
      previous_qualification: academic_info?.qualification ?? null,
      previous_total_marks: academic_info?.total_marks ?? null,
      previous_obtained_marks: academic_info?.obtained_marks ?? null,
      previous_percentage: academic_info?.percentage ?? null,
      previous_pass_year: academic_info?.pass_year ?? null,
      fee,
      display_admission_label:
        student.admission_status === ADMISSION_STATUS.WALK_IN
          ? "Walk-in / Awaiting Fee Verification"
          : student.admission_status === ADMISSION_STATUS.REGISTERED
            ? "Registered / Verified"
            : student.admission_status || "Unknown",
    };
  }

  static async createEnrollment(input: CreateStudentEnrollmentInput) {
    const first_name = optionalStr(input.first_name);
    if (!first_name) {
      throw Object.assign(new Error("first_name is required"), {
        statusCode: 400,
      });
    }

    const branch_id = optionalInt(input.branch_id);
    if (!branch_id) {
      throw Object.assign(new Error("branch_id is required"), {
        statusCode: 400,
      });
    }

    const mobile_1 = optionalStr(input.mobile_1);
    if (!mobile_1) {
      throw Object.assign(new Error("mobile_1 (contact number) is required"), {
        statusCode: 400,
      });
    }

    const active_session_id = optionalInt(input.active_session_id);
    const active_session_section_id = optionalInt(
      input.active_session_section_id
    );
    if (!active_session_id) {
      throw Object.assign(new Error("active_session_id is required"), {
        statusCode: 400,
      });
    }
    if (!active_session_section_id) {
      throw Object.assign(
        new Error("active_session_section_id is required"),
        { statusCode: 400 }
      );
    }

    const { activeSession, activeSessionSection } =
      await resolveActiveAcademicContext({
        branch_id,
        active_session_id,
        active_session_section_id,
      });

    const disability = asYesNoFlag(input.disability);
    const disability_description =
      disability === 1 ? optionalStr(input.disability_description) : null;

    const parentInput = input.parent || null;
    const father_guardian_name = buildFatherGuardianName(
      parentInput,
      input.father_guardian_name
    );
    const father_cnic =
      optionalStr(parentInput?.father_cnic) || optionalStr(input.father_cnic);
    const mother_cnic =
      optionalStr(parentInput?.mother_cnic) || optionalStr(input.mother_cnic);
    const staff_ref = deriveStaffRef(parentInput);

    const previous_school = optionalStr(input.previous_school);
    const previous_class = optionalStr(input.previous_class);
    const previous_board_id = optionalInt(input.previous_board_id);
    const previous_qualification = optionalStr(input.previous_qualification);
    const previous_total_marks = optionalNonNegNumber(
      input.previous_total_marks
    );
    const previous_obtained_marks = optionalNonNegNumber(
      input.previous_obtained_marks
    );
    let previous_percentage = optionalNonNegNumber(input.previous_percentage);
    const calculatedPct = calcPercentage(
      previous_obtained_marks,
      previous_total_marks
    );
    if (calculatedPct !== null) {
      previous_percentage = calculatedPct;
    }

    if (
      previous_obtained_marks !== null &&
      previous_total_marks !== null &&
      previous_obtained_marks > previous_total_marks
    ) {
      throw Object.assign(
        new Error("Obtained marks cannot be greater than total marks."),
        { statusCode: 400 }
      );
    }

    let previous_board_label: string | null = null;
    if (previous_board_id) {
      const boardRow = await prisma.boards.findFirst({
        where: { id: previous_board_id, deleted_at: null },
        select: { id: true, name: true, board: true },
      });
      if (!boardRow) {
        throw Object.assign(new Error("Selected previous board is invalid."), {
          statusCode: 400,
        });
      }
      previous_board_label = resolveAcademicInfoBoardLabel(boardRow);
    }

    const walkin_reg_no = await nextWalkInRegNo(branch_id);
    const providedReg = optionalStr(input.reg_no);
    const reg_no = providedReg || walkin_reg_no;
    const today = new Date();
    const reg_date =
      optionalStr(input.reg_date) ||
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const pass_year =
      optionalStr(input.previous_pass_year)?.slice(0, 4) ||
      String(today.getFullYear());

    const created = await prisma.$transaction(async (tx) => {
      const student = await tx.students.create({
        data: {
          first_name,
          middle_name: optionalStr(input.middle_name),
          last_name: optionalStr(input.last_name),
          date_of_birth: optionalStr(input.date_of_birth),
          gender: optionalStr(input.gender),
          blood_group: optionalStr(input.blood_group),
          nationality: optionalStr(input.nationality),
          mother_tongue: optionalStr(input.mother_tongue),
          email: optionalStr(input.email),
          father_cnic,
          mother_cnic,
          mobile_1,
          mobile_2: optionalStr(input.mobile_2),
          home_phone: optionalStr(input.home_phone),
          state: optionalStr(input.state),
          country: optionalStr(input.country),
          city: optionalStr(input.city),
          address: optionalStr(input.address),
          temp_address: optionalStr(input.temp_address),
          extra_info: optionalStr(input.extra_info),
          disability,
          disability_description,
          staff_ref,
          branch_id,
          board_id: activeSession.board_id,
          program_id: activeSession.program_id,
          academic_group_id: optionalInt(input.academic_group_id),
          class_id: activeSession.class_id,
          intake_id: activeSession.intake_id ?? optionalInt(input.intake_id),
          section_id: activeSessionSection.section_id,
          session_id: activeSession.session_id,
          registered_session: activeSession.session_id,
          active_session_id: activeSession.id,
          active_session_section_id: activeSessionSection.id,
          term_id: optionalInt(input.term_id),
          reg_no,
          walkin_reg_no,
          reg_date,
          previous_school,
          previous_class,
          student_image: optionalStr(input.student_image),
          admission_status: ADMISSION_STATUS.WALK_IN,
          academic_status: "Pending",
          status: "Active",
          sos_status: "Active",
          created_by: optionalInt(input.created_by) ?? undefined,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      const parent = await tx.parentDetails.create({
        data: {
          students_id: student.id,
          filer_info: 0,
          father_first_name: optionalStr(parentInput?.father_first_name)?.slice(0, 15),
          father_middle_name: optionalStr(parentInput?.father_middle_name)?.slice(0, 15),
          father_last_name: optionalStr(parentInput?.father_last_name)?.slice(0, 15),
          father_cnic: father_cnic?.slice(0, 50),
          father_occupation: optionalStr(parentInput?.father_occupation)?.slice(0, 15),
          father_office: optionalStr(parentInput?.father_office)?.slice(0, 191),
          father_office_number: optionalStr(parentInput?.father_office_number)?.slice(0, 191),
          father_mobile_1: optionalStr(parentInput?.father_mobile_1)?.slice(0, 15),
          father_email: optionalStr(parentInput?.father_email)?.slice(0, 255),
          father_is_staff: asYesNoFlag(parentInput?.father_is_staff),
          father_staff_ref: asYesNoFlag(parentInput?.father_is_staff)
            ? optionalStr(parentInput?.father_staff_ref)
            : null,
          mother_first_name: optionalStr(parentInput?.mother_first_name)?.slice(0, 50),
          mother_middle_name: optionalStr(parentInput?.mother_middle_name)?.slice(0, 100),
          mother_last_name: optionalStr(parentInput?.mother_last_name)?.slice(0, 15),
          mother_cnic: mother_cnic?.slice(0, 15),
          mother_occupation: optionalStr(parentInput?.mother_occupation)?.slice(0, 15),
          mother_office: optionalStr(parentInput?.mother_office)?.slice(0, 191),
          mother_office_number: optionalStr(parentInput?.mother_office_number)?.slice(0, 191),
          mother_mobile_1: optionalStr(parentInput?.mother_mobile_1)?.slice(0, 15),
          mother_email: optionalStr(parentInput?.mother_email)?.slice(0, 100),
          mother_is_staff: asYesNoFlag(parentInput?.mother_is_staff),
          mother_staff_ref: asYesNoFlag(parentInput?.mother_is_staff)
            ? optionalStr(parentInput?.mother_staff_ref)
            : null,
          guardian_is: optionalStr(parentInput?.guardian_is)?.slice(0, 255),
          guardian_first_name: optionalStr(parentInput?.guardian_first_name)?.slice(0, 15),
          guardian_middle_name: optionalStr(parentInput?.guardian_middle_name)?.slice(0, 15),
          guardian_last_name: optionalStr(parentInput?.guardian_last_name)?.slice(0, 50),
          guardian_cnic: optionalStr(parentInput?.guardian_cnic)?.slice(0, 15),
          guardian_occupation: optionalStr(parentInput?.guardian_occupation)?.slice(0, 50),
          guardian_relation: optionalStr(parentInput?.guardian_relation)?.slice(0, 100),
          guardian_mobile_1: optionalStr(parentInput?.guardian_mobile_1)?.slice(0, 15),
          guardian_email: optionalStr(parentInput?.guardian_email)?.slice(0, 15),
          guardian_address: optionalStr(parentInput?.guardian_address)?.slice(0, 100),
          guardian_is_staff: asYesNoFlag(parentInput?.guardian_is_staff),
          guardian_staff_ref: asYesNoFlag(parentInput?.guardian_is_staff)
            ? optionalStr(parentInput?.guardian_staff_ref)
            : null,
          status: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      const updatedStudent = await tx.students.update({
        where: { id: student.id },
        data: {
          parent_id: parent.id,
          updated_at: new Date(),
        },
      });

      const activeSessionStudent = await tx.activeSessionStudents.create({
        data: {
          active_session_section_id: activeSessionSection.id,
          student_id: student.id,
          academics_group_id: optionalInt(input.academic_group_id),
          status: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      let academicInfo = null;
      if (hasPreviousEducationData(input)) {
        academicInfo = await tx.academicInfos.create({
          data: {
            students_id: student.id,
            created_by: optionalInt(input.created_by) ?? 0,
            institution: previous_school || "Not specified",
            board: previous_board_label,
            pass_year,
            percentage: previous_percentage ?? 0,
            division_grade: divisionFromPercentage(previous_percentage),
            total_marks:
              previous_total_marks !== null
                ? Math.round(previous_total_marks)
                : null,
            obtained_marks:
              previous_obtained_marks !== null
                ? Math.round(previous_obtained_marks)
                : null,
            qualification: previous_qualification,
            remark: previous_class
              ? `Previous class/grade: ${previous_class}`
              : null,
            status: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
      }

      let credentials = null;
      let credentials_message = null;
      const studentEmail = optionalStr(input.email);
      
      if (studentEmail) {
        const existingUser = await tx.erpUsers.findFirst({ where: { email: studentEmail } });
        if (existingUser) {
          credentials_message = "A user with this email already exists. Skipping login account creation.";
        } else {
          const rawPassword = crypto.randomBytes(6).toString("hex"); // 12 chars
          const hashedPassword = await bcrypt.hash(rawPassword, 12);
          const erpUser = await tx.erpUsers.create({
            data: {
              name: [first_name, optionalStr(input.middle_name), optionalStr(input.last_name)].filter(Boolean).join(" ").trim(),
              email: studentEmail,
              password: hashedPassword,
              string_password: rawPassword,
              user_type: "student",
              branch_id,
              active: 1,
              status: 1,
              created_at: new Date(),
              updated_at: new Date(),
            }
          });
          
          await tx.students.update({
            where: { id: student.id },
            data: { user_id: erpUser.id }
          });
          
          credentials = { email: studentEmail, password: rawPassword };
        }
      } else {
        credentials_message = "No email provided for student. Skipping login account creation.";
      }

      return {
        student: updatedStudent,
        parent,
        activeSessionStudent,
        academicInfo,
        credentials,
        credentials_message
      };
    });

    return {
      ...created.student,
      full_name: studentDisplayName(created.student),
      parent: created.parent,
      academic_info: created.academicInfo,
      previous_board_id,
      previous_qualification,
      previous_total_marks,
      previous_obtained_marks,
      previous_percentage,
      previous_pass_year: pass_year,
      active_session: activeSession,
      active_session_section: {
        ...activeSessionSection,
      },
      active_session_student: created.activeSessionStudent,
      credentials: created.credentials,
      credentials_message: created.credentials_message,
      fee: await getStudentFeePaymentStatus(created.student.id),
      display_admission_label: "Walk-in / Awaiting Fee Verification",
      message:
        "Student enrolled successfully and linked to the selected active session section. Complete fee assignment and payment in Fee Management, then verify fee here.",
    };
  }

  /**
   * Reads existing fee/payment tables. If paid, updates only students.admission_status.
   * Does not modify fee records or Fee Management code.
   */
  static async verifyFeeAndRegister(studentId: number) {
    const student = await prisma.students.findFirst({
      where: { id: studentId, deleted_at: null },
    });
    if (!student) {
      throw Object.assign(new Error("Student enrollment not found"), {
        statusCode: 404,
      });
    }

    const fee = await getStudentFeePaymentStatus(studentId);

    if (student.admission_status === ADMISSION_STATUS.REGISTERED) {
      return {
        ...student,
        full_name: studentDisplayName(student),
        fee,
        updated: false,
        display_admission_label: "Registered / Verified",
        message: "Student is already Registered.",
      };
    }

    if (!fee.is_paid) {
      return {
        ...student,
        full_name: studentDisplayName(student),
        fee,
        updated: false,
        display_admission_label:
          student.admission_status === ADMISSION_STATUS.WALK_IN
            ? "Walk-in / Awaiting Fee Verification"
            : student.admission_status || "Unknown",
        message:
          fee.fee_status === FEE_PAYMENT_STATUS.NO_RECORD
            ? "No fee assignment or payment found for this student in existing Fee Management records. Assign and collect fees first."
            : `Fee status is "${fee.fee_status}". Student remains Walk-in until fully paid.`,
      };
    }

    const updated = await prisma.students.update({
      where: { id: studentId },
      data: {
        admission_status: ADMISSION_STATUS.REGISTERED,
        academic_status: "Registered",
        updated_at: new Date(),
      },
    });

    return {
      ...updated,
      full_name: studentDisplayName(updated),
      fee,
      updated: true,
      display_admission_label: "Registered / Verified",
      message:
        "Required fee is paid. admission_status updated to Registered. Academic team may proceed with course allocation separately.",
    };
  }
}

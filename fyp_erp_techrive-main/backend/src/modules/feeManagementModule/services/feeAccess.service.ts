import { prisma } from "../../../config/db";
import { AppError } from "../utils/fee.helpers";
import {
  FEE_ROLE_CAPABILITIES,
  mapUserTypeToFeeRole,
  roleHasCapability,
  type FeeAccessRole,
  type FeeCapability,
} from "../constants/feeAccess.constants";
import { recordFeeActivity } from "./feeAudit.service";

export type FeeActor = {
  userId: number;
  userType: string | null;
  roleId: number | null;
  branchId: number | null;
  name: string | null;
  email: string | null;
  feeRole: FeeAccessRole;
  linkedStudentIds: number[];
  teacherClassIds: number[];
};

const parseClassIds = (raw?: string | null): number[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(Number).filter((n) => Number.isFinite(n) && n > 0);
    }
  } catch {
    // comma-separated fallback
  }
  return raw
    .split(/[,|;]/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
};

export const resolveFeeActor = async (user?: {
  id?: number;
  name?: string;
  email?: string;
  role_id?: number;
  branch_id?: number;
  user_type?: string;
}): Promise<FeeActor> => {
  if (!user?.id) {
    throw new AppError("Unauthorized", 401);
  }

  const staff = await prisma.staff.findFirst({
    where: { user_id: user.id },
    select: { id: true, staff_type: true, class_level: true, branch_id: true },
  });

  const feeRole = mapUserTypeToFeeRole(user.user_type, staff?.staff_type);
  const linkedStudentIds: number[] = [];
  const teacherClassIds: number[] = [];

  if (feeRole === "parent") {
    // Resolve linked students via existing contact emails (no schema change).
    // Note: parent_details.user_id is in Prisma schema but may be absent in live DB.
    if (user.email) {
      const byEmail = await prisma.parentDetails.findMany({
        where: {
          deleted_at: null,
          OR: [
            { father_email: { equals: user.email, mode: "insensitive" } },
            { mother_email: { equals: user.email, mode: "insensitive" } },
            { guardian_email: { equals: user.email, mode: "insensitive" } },
          ],
        },
        select: { students_id: true },
      });
      for (const p of byEmail) {
        if (p.students_id) linkedStudentIds.push(p.students_id);
      }
    }
  }

  if (feeRole === "student" && user.email) {
    const own = await prisma.students.findFirst({
      where: {
        deleted_at: null,
        email: { equals: user.email, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (own) linkedStudentIds.push(own.id);
  }

  if (feeRole === "teacher") {
    teacherClassIds.push(...parseClassIds(staff?.class_level));
  }

  return {
    userId: user.id,
    userType: user.user_type || null,
    roleId: user.role_id ?? null,
    branchId: user.branch_id ?? staff?.branch_id ?? null,
    name: user.name || null,
    email: user.email || null,
    feeRole,
    linkedStudentIds: [...new Set(linkedStudentIds)],
    teacherClassIds: [...new Set(teacherClassIds)],
  };
};

export const actorHasCapability = (actor: FeeActor, capability: FeeCapability) =>
  roleHasCapability(actor.feeRole, capability);

export const assertCapability = (
  actor: FeeActor,
  capability: FeeCapability,
  message = "You do not have permission to perform this Fee Management action"
) => {
  if (!actorHasCapability(actor, capability)) {
    throw new AppError(message, 403);
  }
};

/** Parent/student may only access linked student IDs */
export const assertStudentScope = (
  actor: FeeActor,
  studentId: number | null | undefined,
  message = "You can only access your own fee records"
) => {
  if (actor.feeRole === "admin" || actor.feeRole === "accountant") return;
  if (actor.feeRole === "teacher") {
    // Teachers do not get arbitrary student record access via this helper
    throw new AppError(message, 403);
  }
  if (!studentId || !actor.linkedStudentIds.includes(studentId)) {
    throw new AppError(message, 403);
  }
};

export const assertBasicBelongsToScopedStudent = async (
  actor: FeeActor,
  feeMasterBasicId: number
) => {
  if (actor.feeRole === "admin" || actor.feeRole === "accountant") return;

  const basic = await prisma.feeMasterBasics.findUnique({
    where: { id: feeMasterBasicId },
    select: { student_id: true, class_id: true },
  });
  if (!basic?.student_id) throw new AppError("Fee statement not found", 404);

  if (actor.feeRole === "teacher") {
    if (
      actor.teacherClassIds.length > 0 &&
      !actor.teacherClassIds.includes(basic.class_id)
    ) {
      throw new AppError("This fee record is outside your assigned classes", 403);
    }
    return;
  }

  assertStudentScope(actor, basic.student_id);
};

export const logUnauthorizedFeeAccess = async (
  actor: Partial<FeeActor> | null,
  endpoint: string,
  reason: string
) => {
  await recordFeeActivity({
    userId: actor?.userId ?? null,
    userName: actor?.name || actor?.email || null,
    roleId: actor?.roleId ?? null,
    branchId: actor?.branchId ?? null,
    action: "UNAUTHORIZED_ACCESS",
    recordType: "security",
    description: reason.slice(0, 500),
    endpoint,
    requestMethod: "ACCESS",
  });
};

export const getFeeAccessProfile = async (user?: {
  id?: number;
  name?: string;
  email?: string;
  role_id?: number;
  branch_id?: number;
  user_type?: string;
}) => {
  const actor = await resolveFeeActor(user);
  return {
    fee_role: actor.feeRole,
    user_type: actor.userType,
    capabilities: FEE_ROLE_CAPABILITIES[actor.feeRole],
    linked_student_ids: actor.linkedStudentIds,
    teacher_class_ids: actor.teacherClassIds,
    branch_id: actor.branchId,
    is_admin_console: actor.feeRole === "admin" || actor.feeRole === "accountant",
    is_self_service: actor.feeRole === "parent" || actor.feeRole === "student",
    is_teacher_restricted: actor.feeRole === "teacher",
  };
};

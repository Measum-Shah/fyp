import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RecordScope, isWithinScope } from "../utils/record-scope.util";
import { getBranchIdsForCompany, assertBranchBelongsToCompany } from "../utils/company-branch.util";
import { APPROVAL_STATUS } from "../constants/resignation.constants";
import {
  CreateResignationInput,
  UpdateResignationApprovalInput,
  UpdateResignationInput,
} from "../validators/resignation.validator";

const resignationSelect = {
  id: true,
  user_id: true,
  reason: true,
  join_date: true,
  notice_period: true,
  experience_letter: true,
  approved_by_ceo: true,
  approved_by_ceo_employee_id: true,
  approved_by_ceo_designation_id: true,
  approved_by_hr_head: true,
  approved_by_hr_head_employee_id: true,
  approved_by_hr_head_designation_id: true,
  class: true,
  subject: true,
  last_day_of_work: true,
  status: true,
  created_at: true,
  updated_at: true,
  branch_id: true,
  role_id: true,
} satisfies Prisma.ResignsSelect;

type RawResignationRecord = Prisma.ResignsGetPayload<{ select: typeof resignationSelect }>;

// user_id is stored as BigInt (the only BigInt column anywhere in this
// schema) — Express's res.json() cannot serialize BigInt and crashes at
// runtime if one reaches the controller. Every record is remapped here to a
// plain `staff_id: number` (staff ids are well within JS's safe integer
// range) before it ever leaves this service — both for JSON-safety and
// because "user_id" is a confusing legacy name for what is just the staff id.
export type ResignationRecord = Omit<RawResignationRecord, "user_id"> & { staff_id: number };

const toResignationRecord = (row: RawResignationRecord): ResignationRecord => {
  const { user_id, ...rest } = row;
  return { ...rest, staff_id: Number(user_id) };
};

interface ListResignationsParams {
  page: number;
  limit: number;
  search?: string;
  staff_id?: number;
  branch_id?: number;
  company_id?: number;
  status?: string;
}

interface ListResignationsResult {
  data: ResignationRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const assertStaffExists = async (staff_id: number) => {
  const staff = await prisma.staff.findFirst({ where: { id: staff_id, deleted_at: null }, select: { id: true } });
  if (!staff) {
    throw AppError.badRequest("Employee does not exist", {
      staff_id: `No active employee found with id ${staff_id}`,
    });
  }
};

const assertBranchExists = async (branch_id: number) => {
  const branch = await prisma.erpBranches.findFirst({
    where: { id: branch_id, deleted_at: null },
    select: { id: true },
  });
  if (!branch) {
    throw AppError.badRequest("Campus does not exist", { branch_id: `No campus found with id ${branch_id}` });
  }
};

/**
 * Approver Name must reference a real, active employee — Field 2 of the
 * approval stage can never be free text (see resignation.validator.ts).
 */
const assertApproverEmployeeExists = async (employeeId: number, field: string) => {
  const employee = await prisma.staff.findFirst({ where: { id: employeeId, deleted_at: null }, select: { id: true } });
  if (!employee) {
    throw AppError.badRequest("Selected approver does not exist or is inactive", {
      [field]: `No active employee found with id ${employeeId}`,
    });
  }
};

/**
 * Approver Designation must reference a real, non-deleted designation —
 * Field 3 of the approval stage can never be free text either.
 */
const assertApproverDesignationExists = async (designationId: number, field: string) => {
  const designation = await prisma.designation.findFirst({
    where: { id: designationId, deleted_at: null },
    select: { id: true },
  });
  if (!designation) {
    throw AppError.badRequest("Selected approver designation does not exist", {
      [field]: `No designation found with id ${designationId}`,
    });
  }
};

const findResignationOrThrow = async (id: number): Promise<ResignationRecord> => {
  const record = await prisma.resigns.findUnique({ where: { id }, select: resignationSelect });
  if (!record) {
    throw AppError.notFound(`Resignation with id ${id} was not found`);
  }
  return toResignationRecord(record);
};

/**
 * Overall `status` is derived from the two approval fields rather than set
 * directly: Rejected if either reviewer rejects, Approved only once BOTH
 * have approved, otherwise Pending. Computed centrally here so the two
 * columns can never drift out of sync with the summary status.
 */
const computeOverallStatus = (ceo: string, hrHead: string): string => {
  if (ceo === APPROVAL_STATUS.REJECTED || hrHead === APPROVAL_STATUS.REJECTED) return APPROVAL_STATUS.REJECTED;
  if (ceo === APPROVAL_STATUS.APPROVED && hrHead === APPROVAL_STATUS.APPROVED) return APPROVAL_STATUS.APPROVED;
  return APPROVAL_STATUS.PENDING;
};

export const listResignations = async (
  params: ListResignationsParams,
  scope?: RecordScope
): Promise<ListResignationsResult> => {
  const { page, limit, search, staff_id, branch_id, company_id, status } = params;

  if (branch_id && company_id) {
    await assertBranchBelongsToCompany(branch_id, company_id);
  }
  const companyBranchIds = !branch_id && company_id ? await getBranchIdsForCompany(company_id) : null;

  const where: Prisma.ResignsWhereInput = {
    ...(scope && scope.restrictToEmployeeId !== null
      ? { user_id: BigInt(scope.restrictToEmployeeId) }
      : staff_id
      ? { user_id: BigInt(staff_id) }
      : {}),
    ...(branch_id ? { branch_id } : companyBranchIds ? { branch_id: { in: companyBranchIds } } : {}),
    ...(status ? { status } : {}),
    ...(search ? { reason: { contains: search, mode: "insensitive" } } : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.resigns.count({ where }),
    prisma.resigns.findMany({
      where,
      select: resignationSelect,
      orderBy: { id: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: rows.map(toResignationRecord),
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

export const getResignationById = async (id: number, scope?: RecordScope): Promise<ResignationRecord> => {
  const record = await findResignationOrThrow(id);
  if (scope && !isWithinScope(scope, record.staff_id)) {
    throw AppError.notFound(`Resignation with id ${id} was not found`);
  }
  return record;
};

export const createResignation = async (input: CreateResignationInput): Promise<ResignationRecord> => {
  await assertStaffExists(input.staff_id);
  await assertBranchExists(input.branch_id);

  const created = await prisma.resigns.create({
    data: {
      user_id: BigInt(input.staff_id),
      branch_id: input.branch_id,
      role_id: input.role_id,
      reason: input.reason,
      notice_period: input.notice_period,
      last_day_of_work: input.last_day_of_work,
      join_date: input.join_date ? new Date(input.join_date) : undefined,
      experience_letter: input.experience_letter,
      class: input.class,
      subject: input.subject,
      approved_by_ceo: APPROVAL_STATUS.PENDING,
      approved_by_hr_head: APPROVAL_STATUS.PENDING,
      status: APPROVAL_STATUS.PENDING,
      created_at: new Date(),
      updated_at: new Date(),
    },
    select: resignationSelect,
  });

  return toResignationRecord(created);
};

export const updateResignation = async (
  id: number,
  input: UpdateResignationInput
): Promise<ResignationRecord> => {
  const existing = await findResignationOrThrow(id);

  if (existing.status !== APPROVAL_STATUS.PENDING) {
    throw AppError.conflict("This resignation has already been decided and can no longer be edited", {
      id: "Only Pending resignations can be edited",
    });
  }

  if (input.branch_id !== undefined) await assertBranchExists(input.branch_id);

  const updated = await prisma.resigns.update({
    where: { id },
    data: {
      ...(input.branch_id !== undefined ? { branch_id: input.branch_id } : {}),
      ...(input.role_id !== undefined ? { role_id: input.role_id } : {}),
      ...(input.reason !== undefined ? { reason: input.reason } : {}),
      ...(input.notice_period !== undefined ? { notice_period: input.notice_period } : {}),
      ...(input.last_day_of_work !== undefined ? { last_day_of_work: input.last_day_of_work } : {}),
      ...(input.join_date !== undefined ? { join_date: new Date(input.join_date) } : {}),
      ...(input.experience_letter !== undefined ? { experience_letter: input.experience_letter } : {}),
      ...(input.class !== undefined ? { class: input.class } : {}),
      ...(input.subject !== undefined ? { subject: input.subject } : {}),
      updated_at: new Date(),
    },
    select: resignationSelect,
  });

  return toResignationRecord(updated);
};

/**
 * The one place this feature has real side effects: once both approvals
 * land on Approved, the employee's staff.status flips to Inactive
 * automatically — this is what actually makes "approving a resignation"
 * mean something instead of just recording free-text notes.
 *
 * This is also symmetric now: nothing here locks the approval fields once
 * decided (unlike updateResignation, which locks the rest of the record once
 * Pending is left), so a mistaken approval can genuinely be corrected. If
 * doing so moves the overall status OFF Approved — the employee is
 * reactivated in the same transaction, mirroring the deactivation above.
 * Previously this only ever fired in the deactivate direction, so reversing
 * an approval left the employee stuck Inactive with no automatic way back.
 */
export const updateResignationApproval = async (
  id: number,
  input: UpdateResignationApprovalInput
): Promise<ResignationRecord> => {
  const existing = await findResignationOrThrow(id);

  if (input.approved_by_ceo_employee_id !== undefined) {
    await assertApproverEmployeeExists(input.approved_by_ceo_employee_id, "approved_by_ceo_employee_id");
  }
  if (input.approved_by_ceo_designation_id !== undefined) {
    await assertApproverDesignationExists(input.approved_by_ceo_designation_id, "approved_by_ceo_designation_id");
  }
  if (input.approved_by_hr_head_employee_id !== undefined) {
    await assertApproverEmployeeExists(input.approved_by_hr_head_employee_id, "approved_by_hr_head_employee_id");
  }
  if (input.approved_by_hr_head_designation_id !== undefined) {
    await assertApproverDesignationExists(input.approved_by_hr_head_designation_id, "approved_by_hr_head_designation_id");
  }

  const nextCeo = input.approved_by_ceo ?? existing.approved_by_ceo ?? APPROVAL_STATUS.PENDING;
  const nextHrHead = input.approved_by_hr_head ?? existing.approved_by_hr_head ?? APPROVAL_STATUS.PENDING;
  const nextStatus = computeOverallStatus(nextCeo, nextHrHead);

  const wasApproved = existing.status === APPROVAL_STATUS.APPROVED;
  const isNowApproved = nextStatus === APPROVAL_STATUS.APPROVED;

  const [updated] = await prisma.$transaction([
    prisma.resigns.update({
      where: { id },
      data: {
        approved_by_ceo: nextCeo,
        ...(input.approved_by_ceo_employee_id !== undefined
          ? { approved_by_ceo_employee_id: input.approved_by_ceo_employee_id }
          : {}),
        ...(input.approved_by_ceo_designation_id !== undefined
          ? { approved_by_ceo_designation_id: input.approved_by_ceo_designation_id }
          : {}),
        approved_by_hr_head: nextHrHead,
        ...(input.approved_by_hr_head_employee_id !== undefined
          ? { approved_by_hr_head_employee_id: input.approved_by_hr_head_employee_id }
          : {}),
        ...(input.approved_by_hr_head_designation_id !== undefined
          ? { approved_by_hr_head_designation_id: input.approved_by_hr_head_designation_id }
          : {}),
        status: nextStatus,
        updated_at: new Date(),
      },
      select: resignationSelect,
    }),
    ...(isNowApproved && !wasApproved
      ? [
          prisma.staff.update({
            where: { id: existing.staff_id },
            data: { status: "Inactive", updated_at: new Date() },
          }),
        ]
      : []),
    ...(wasApproved && !isNowApproved
      ? [
          prisma.staff.update({
            where: { id: existing.staff_id },
            data: { status: "Active", updated_at: new Date() },
          }),
        ]
      : []),
  ]);

  return toResignationRecord(updated);
};

/** Hard delete — no deleted_at column on this table. Only while Pending. */
export const deleteResignation = async (id: number): Promise<void> => {
  const existing = await findResignationOrThrow(id);
  if (existing.status !== APPROVAL_STATUS.PENDING) {
    throw AppError.conflict("This resignation has already been decided and can no longer be deleted", {
      id: "Only Pending resignations can be deleted",
    });
  }
  await prisma.resigns.delete({ where: { id } });
};
import { z } from "zod";
import { PHONE_REGEX } from "../constants/employee.constants";
import {
  BRANCH_ADDRESS_MAX_LENGTH,
  BRANCH_CAMBRIDGE_ACC_MAX_LENGTH,
  BRANCH_CODE_MAX_LENGTH,
  BRANCH_EXAM_CENTER_NO_MAX_LENGTH,
  BRANCH_IP_MAX_LENGTH,
  BRANCH_LOGO_MAX_LENGTH,
  BRANCH_NAME_MAX_LENGTH,
  BRANCH_ONE_BILL_PREFIX_MAX_LENGTH,
  BRANCH_OPTIONAL_ACC_MAX_LENGTH,
  BRANCH_PORT_MAX_LENGTH,
  BRANCH_SHORT_NAME_MAX_LENGTH,
  BRANCH_STATUS,
  BRANCH_WEBSITE_MAX_LENGTH,
} from "../constants/branch.constants";

const optionalId = z.coerce.number().int().positive().nullable().optional();

// ─── Create Branch ────────────────────────────────────────────────────────────
export const createBranchSchema = z.object({
  name: z
    .string({ error: "Campus name is required" })
    .trim()
    .min(1, "Campus name is required")
    .max(BRANCH_NAME_MAX_LENGTH, `Campus name must be at most ${BRANCH_NAME_MAX_LENGTH} characters`),
  company_id: z.coerce
    .number({ error: "School / University is required" })
    .int("School / University must reference a valid school / university id")
    .positive("School / University must reference a valid school / university id")
    .nullable()
    .optional(),
  phone: z
    .string({ error: "Phone is required" })
    .trim()
    .min(1, "Phone is required")
    .regex(PHONE_REGEX, "Phone number format is invalid"),
  cell: z
    .string({ error: "Mobile/Cell number is required" })
    .trim()
    .min(1, "Mobile/Cell number is required")
    .regex(PHONE_REGEX, "Mobile/Cell number format is invalid"),
  email: z
    .string({ error: "Email is required" })
    .trim()
    .min(1, "Email is required")
    .email("A valid email address is required"),
  address: z.string().trim().max(BRANCH_ADDRESS_MAX_LENGTH).optional(),
  website: z.string().trim().max(BRANCH_WEBSITE_MAX_LENGTH).optional(),
  status: z.union([z.literal(BRANCH_STATUS.ACTIVE), z.literal(BRANCH_STATUS.INACTIVE)]).optional(),

  // ─── Location / reference ids — no lookup table exists in this schema,
  // so these are plain optional integer ids, not dropdowns.
  city_id: optionalId,
  country_id: optionalId,
  bank_id: optionalId,
  other_bank: optionalId,
  voucher_id: optionalId,
  fax: optionalId,

  // ─── General branch profile fields
  branch_code: z.string().trim().max(BRANCH_CODE_MAX_LENGTH).optional(),
  short_name: z.string().trim().max(BRANCH_SHORT_NAME_MAX_LENGTH).optional(),
  logo: z.string().trim().max(BRANCH_LOGO_MAX_LENGTH).optional(),
  ip: z.string().trim().max(BRANCH_IP_MAX_LENGTH).optional(),
  port: z.string().trim().max(BRANCH_PORT_MAX_LENGTH).optional(),

  // ─── Exam & Billing (school/exam-board-specific — see branch.constants.ts)
  cambridge_acc: z.string().trim().max(BRANCH_CAMBRIDGE_ACC_MAX_LENGTH).optional(),
  optional_acc: z.string().trim().max(BRANCH_OPTIONAL_ACC_MAX_LENGTH).optional(),
  one_bill_prefix: z.string().trim().max(BRANCH_ONE_BILL_PREFIX_MAX_LENGTH).optional(),
  exam_center_no: z.string().trim().max(BRANCH_EXAM_CENTER_NO_MAX_LENGTH).optional(),
});

export type CreateBranchInput = z.infer<typeof createBranchSchema>;

// ─── Update Branch (partial, but body cannot be empty) ─────────────────────
export const updateBranchSchema = createBranchSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the campus",
  });

export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const branchIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Campus id must be a number" })
    .int("Campus id must be a valid integer")
    .positive("Campus id must be a valid integer"),
});

// ─── GET /branches query params ─────────────────────────────────────────────
export const listBranchesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  status: z.coerce.number().int().optional(),
});
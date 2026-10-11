import { z } from "zod";
import { ASSIGNMENT_FEE_TYPE } from "../constants/fee.constants";

const optionalInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().int().optional()
);

const requiredInt = z.preprocess(
  (v) => Number(v),
  z.number().int({ message: "Must be an integer" })
);

const optionalString = z.string().trim().optional().nullable();

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(20).optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  branch_id: z.coerce.number().int().optional(),
  session_id: z.coerce.number().int().optional(),
  program_id: z.coerce.number().int().optional(),
  class_id: z.coerce.number().int().optional(),
  board_id: z.coerce.number().int().optional(),
  group_id: z.coerce.number().int().optional(),
  fee_section_id: z.coerce.number().int().optional(),
  fee_structure_code: z.string().optional(),
  student_id: z.coerce.number().int().optional(),
  scope: z.enum(["class", "group", "student"]).optional(),
});

export const feeSectionCreateSchema = z.object({
  branch_id: requiredInt,
  session_id: requiredInt,
  title: z.string().trim().min(2).max(100),
  slug: z.string().trim().max(100).optional(),
  type: z.coerce.number().int().default(1),
  fee_section_print_id: z.coerce.number().int().default(0),
  status: z.enum(["1", "0"]).default("1"),
});

export const feeSectionUpdateSchema = feeSectionCreateSchema.partial();

export const feeSectionPrintCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(100),
  status: z.enum(["1", "0"]).default("1").optional(),
});

export const feeSectionPrintUpdateSchema = feeSectionPrintCreateSchema.partial();

export const feeHeadCreateSchema = z.object({
  fee_head_title: z.string().trim().min(2).max(100),
  fee_head_desc: z.string().trim().max(250).optional().nullable(),
  fee_section_id: optionalInt,
  branch_id: optionalInt,
  board_id: optionalInt,
  session_id: optionalInt,
  program_id: optionalInt,
  class_id: z.coerce.number().int().default(0),
  intake_id: optionalInt,
  erp_fees_head_id: optionalInt,
  erp_branch_id: z.coerce.number().int().optional(),
  rec_group_id: z.string().trim().max(255).optional(),
  dividable: z.coerce.number().int().optional().nullable(),
  slug: z.string().trim().max(100).optional(),
  status: z.coerce.number().int().min(0).max(1).default(1),
});

export const feeHeadUpdateSchema = feeHeadCreateSchema.partial();

/** Base object only — Zod v4 forbids .partial() on schemas with refinements */
const feeTermBaseSchema = z.object({
  branch_id: requiredInt,
  session_id: optionalInt,
  program_id: requiredInt,
  board_id: requiredInt,
  class_id: requiredInt,
  group_id: z.coerce.number().int().default(0),
  intake_id: optionalInt,
  term_number: z.coerce.number().int().min(1),
  term_title: z.string().trim().min(2).max(100),
  term_date: z.string().optional().nullable(),
  starting_date: z.string().min(1, "Starting date is required"),
  ending_date: z.string().min(1, "Ending date is required"),
  status: z.string().default("1"),
});

const feeTermDateOrder = (
  d: { starting_date?: string; ending_date?: string },
  ctx: z.RefinementCtx
) => {
  if (d.starting_date && d.ending_date) {
    if (new Date(d.ending_date) < new Date(d.starting_date)) {
      ctx.addIssue({
        code: "custom",
        message: "Ending date must be on or after starting date",
        path: ["ending_date"],
      });
    }
  }
};

export const feeTermCreateSchema = feeTermBaseSchema.superRefine(feeTermDateOrder);

export const feeTermUpdateSchema = feeTermBaseSchema.partial().superRefine(feeTermDateOrder);

export const installmentCreateSchema = z.object({
  branch_id: requiredInt,
  session_id: optionalInt,
  program_id: requiredInt,
  class_id: requiredInt,
  board_id: optionalInt,
  intake_id: optionalInt,
  group_id: z.coerce.number().int().default(0),
  fee_term_id: requiredInt,
  installment_no: z.coerce.number().int().min(1),
  installment_date: z.string().min(1),
  name: z.string().trim().max(191).optional().nullable(),
  total_days: z.string().trim().max(191).optional().nullable(),
  description: z.string().trim().max(255).optional().nullable(),
  status: z.string().default("1"),
});

export const installmentUpdateSchema = installmentCreateSchema.partial();

export const feeStructureCreateSchema = z.object({
  branch_id: requiredInt,
  session_id: optionalInt,
  program_id: requiredInt,
  class_id: requiredInt,
  board_id: optionalInt,
  intake_id: optionalInt,
  term_id: optionalInt,
  fee_head_id: requiredInt,
  fee_amount: z.coerce.number().min(0),
  fee_structure_code: z.string().trim().max(191).optional(),
  annual_minimum: z.coerce.number().int().min(0).optional().nullable(),
  monthly_minimum: z.coerce.number().int().min(0).optional().nullable(),
  description: optionalString,
  status: z.coerce.number().int().min(0).max(1).default(1),
  /** When true, generate a new shared structure code for a multi-line structure */
  generate_code: z.boolean().optional(),
});

export const feeStructureBulkCreateSchema = z.object({
  branch_id: requiredInt,
  session_id: optionalInt,
  program_id: requiredInt,
  class_id: requiredInt,
  board_id: optionalInt,
  intake_id: optionalInt,
  term_id: optionalInt,
  fee_structure_code: z.string().trim().max(191).optional(),
  description: optionalString,
  status: z.coerce.number().int().min(0).max(1).default(1),
  lines: z
    .array(
      z.object({
        fee_head_id: requiredInt,
        fee_amount: z.coerce.number().min(0),
        annual_minimum: z.coerce.number().int().min(0).optional().nullable(),
        monthly_minimum: z.coerce.number().int().min(0).optional().nullable(),
      })
    )
    .min(1, "At least one fee line is required"),
});

export const feeStructureUpdateSchema = feeStructureCreateSchema.partial();

export const assignmentCreateSchema = z.object({
  scope: z.enum(["class", "group", "student"]),
  branch_id: requiredInt,
  session_id: optionalInt,
  program_id: requiredInt,
  class_id: requiredInt,
  board_id: requiredInt,
  intake_id: z.coerce.number().int().default(0),
  fee_structure_code: z.coerce.number().int(),
  installment_id: optionalInt,
  group_id: optionalInt,
  student_id: optionalInt,
  basic_fee: z.string().optional().nullable(),
  total_fee: z.string().optional().nullable(),
  discount_fee: z.string().optional().nullable(),
  discount_type: z.coerce.number().int().default(1),
  special_discount_comment: z.string().max(191).optional().nullable(),
  fee_due_date_start: z.string().optional().nullable(),
  fee_due_date_end: z.string().optional().nullable(),
  status: z.string().default("1"),
}).superRefine((data, ctx) => {
  if (data.scope === "student" && !data.student_id) {
    ctx.addIssue({
      code: "custom",
      message: "student_id is required for student assignment",
      path: ["student_id"],
    });
  }
  if (data.scope === "group" && !data.group_id) {
    ctx.addIssue({
      code: "custom",
      message: "group_id is required for group assignment",
      path: ["group_id"],
    });
  }
});

export const assignmentUpdateSchema = z.object({
  status: z.string().optional(),
  installment_id: optionalInt,
  basic_fee: z.string().optional().nullable(),
  total_fee: z.string().optional().nullable(),
  discount_fee: z.string().optional().nullable(),
  discount_type: z.coerce.number().int().optional(),
  special_discount_comment: z.string().max(191).optional().nullable(),
  fee_due_date_start: z.string().optional().nullable(),
  fee_due_date_end: z.string().optional().nullable(),
  last_updated_by: optionalInt,
});

export const erpFeeHeadCreateSchema = z.object({
  title: z.string().trim().min(2).max(191),
  description: z.string().trim().max(500).optional().nullable(),
  fee_section_id: z.coerce.number().int().optional().nullable(),
  status: z.coerce.number().int().default(1),
});

export const erpFeeHeadUpdateSchema = erpFeeHeadCreateSchema.partial();

export { ASSIGNMENT_FEE_TYPE };

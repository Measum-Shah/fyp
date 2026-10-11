import { z } from "zod";

const requiredInt = z.preprocess(
  (v) => Number(v),
  z.number().int({ message: "Must be an integer" })
);

const optionalInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().int().optional()
);

/** Encoded in discount_types.description without schema changes */
export const CALCULATION_MODES = ["PERCENT", "FIXED"] as const;

/** Base object only — Zod v4 forbids .partial() on schemas with refinements */
const discountTypeBaseSchema = z.object({
  name: z.string().trim().min(2).max(191),
  description: z.string().trim().max(170).optional().nullable(),
  calculation_mode: z.enum(CALCULATION_MODES).default("PERCENT"),
  /** Percentage (0–100) or default fixed amount when mode is FIXED */
  value: z.coerce.number().min(0).max(1_000_000),
  status: z.enum(["Active", "Inactive"]).default("Active"),
});

const discountPercentRefine = (
  d: { calculation_mode?: string; value?: number },
  ctx: z.RefinementCtx
) => {
  if (d.calculation_mode === "PERCENT" && d.value !== undefined && d.value > 100) {
    ctx.addIssue({
      code: "custom",
      message: "Percentage cannot exceed 100",
      path: ["value"],
    });
  }
};

export const discountTypeCreateSchema =
  discountTypeBaseSchema.superRefine(discountPercentRefine);

export const discountTypeUpdateSchema = discountTypeBaseSchema
  .partial()
  .superRefine(discountPercentRefine);

export const scholarshipCatalogCreateSchema = z
  .object({
    session_id: requiredInt,
    branch_id: requiredInt,
    program_id: requiredInt,
    title: z.string().trim().min(2).max(191),
    no_of_a: z.coerce.number().int().min(0).default(0),
    term_percentage: z.coerce.number().min(0).max(100).default(0),
    status: z.enum(["1", "0"]).default("1"),
    details: z
      .array(
        z.object({
          fee_head_id: requiredInt,
          discount_percentage: z.coerce.number().min(0).max(100),
          status: z.enum(["1", "0"]).default("1"),
        })
      )
      .optional()
      .default([]),
  })
  .superRefine((d, ctx) => {
    const heads = new Set<number>();
    for (const row of d.details || []) {
      if (heads.has(row.fee_head_id)) {
        ctx.addIssue({
          code: "custom",
          message: "Duplicate fee head in scholarship details",
          path: ["details"],
        });
        break;
      }
      heads.add(row.fee_head_id);
    }
  });

export const scholarshipCatalogUpdateSchema = z
  .object({
    session_id: optionalInt,
    branch_id: optionalInt,
    program_id: optionalInt,
    title: z.string().trim().min(2).max(191).optional(),
    no_of_a: z.coerce.number().int().min(0).optional(),
    term_percentage: z.coerce.number().min(0).max(100).optional(),
    status: z.enum(["1", "0"]).optional(),
    details: z
      .array(
        z.object({
          fee_head_id: requiredInt,
          discount_percentage: z.coerce.number().min(0).max(100),
          status: z.enum(["1", "0"]).default("1"),
        })
      )
      .optional(),
  })
  .superRefine((d, ctx) => {
    if (!d.details) return;
    const heads = new Set<number>();
    for (const row of d.details) {
      if (heads.has(row.fee_head_id)) {
        ctx.addIssue({
          code: "custom",
          message: "Duplicate fee head in scholarship details",
          path: ["details"],
        });
        break;
      }
      heads.add(row.fee_head_id);
    }
  });

export const scholarshipRuleCreateSchema = z.object({
  session_id: optionalInt,
  branch_id: requiredInt,
  board_id: optionalInt,
  program_id: requiredInt,
  class_id: optionalInt,
  title: z.string().trim().min(2).max(200),
  no_of_a: z.coerce.number().int().min(0).default(0),
  term_percentage: z.coerce.number().min(0).max(100).default(0),
  status: z.coerce.number().int().min(0).max(1).default(1),
});

export const scholarshipRuleUpdateSchema = scholarshipRuleCreateSchema.partial();

export const scholarshipSettingsUpsertSchema = z.object({
  id: optionalInt,
  session_id: optionalInt,
  branch_id: optionalInt,
  program_id: optionalInt,
  maximum_limit: z.coerce.number().int().min(0).max(100),
  status: z.coerce.number().int().min(0).max(1).default(1),
});

export const applyDiscountSchema = z
  .object({
    student_id: requiredInt,
    fee_master_basic_id: requiredInt,
    discount_type_id: requiredInt,
    calculation_mode: z.enum(CALCULATION_MODES),
    value: z.coerce.number().min(0).max(1_000_000),
    comment: z.string().trim().max(191).optional().nullable(),
    replace_existing: z.boolean().optional().default(false),
  })
  .superRefine((d, ctx) => {
    if (d.calculation_mode === "PERCENT" && d.value > 100) {
      ctx.addIssue({
        code: "custom",
        message: "Percentage cannot exceed 100",
        path: ["value"],
      });
    }
  });

export const applyScholarshipSchema = z.object({
  student_id: requiredInt,
  fee_master_basic_id: requiredInt,
  /** Prefer catalog (plural) id; rule (singular) used when catalog_id omitted */
  scholarship_catalog_id: optionalInt,
  scholarship_rule_id: optionalInt,
  replace_existing: z.boolean().optional().default(false),
  comment: z.string().trim().max(191).optional().nullable(),
});

export const applyConcessionSchema = z
  .object({
    student_id: requiredInt,
    fee_master_basic_id: requiredInt,
    calculation_mode: z.enum(CALCULATION_MODES),
    value: z.coerce.number().min(0).max(1_000_000),
    concession_label: z.string().trim().min(2).max(191),
    comment: z.string().trim().max(191).optional().nullable(),
    replace_existing: z.boolean().optional().default(true),
  })
  .superRefine((d, ctx) => {
    if (d.calculation_mode === "PERCENT" && d.value > 100) {
      ctx.addIssue({
        code: "custom",
        message: "Percentage cannot exceed 100",
        path: ["value"],
      });
    }
  });

export const applyNoDiscountSchema = z.object({
  student_id: requiredInt,
  fee_master_basic_id: requiredInt,
  comment: z.string().trim().max(191).optional().nullable(),
});

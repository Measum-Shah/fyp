import { z } from "zod";
import { LATE_FEE_CALC_TYPES, LATE_FEE_RULE_STATUS } from "../constants/lateFee.constants";

const calcType = z.enum([
  LATE_FEE_CALC_TYPES.FIXED,
  LATE_FEE_CALC_TYPES.PERCENT,
  LATE_FEE_CALC_TYPES.PER_DAY,
]);

const optionalInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().int().optional()
);

const lateFeeRuleBase = z.object({
  name: z.string().trim().min(1).max(191),
  branch_id: optionalInt,
  program_id: optionalInt,
  class_id: optionalInt,
  calculation_type: calcType,
  fixed_amount: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().min(0).optional()
  ),
  percentage: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().min(0).max(100).optional()
  ),
  per_day_amount: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
    z.number().min(0).optional()
  ),
  max_cap: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? null : Number(v)),
    z.number().min(0).nullable().optional()
  ),
  grace_period_days: z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? 0 : Number(v)),
    z.number().int().min(0).max(365)
  ),
  effective_from: z.string().optional().nullable(),
  effective_to: z.string().optional().nullable(),
  status: z.enum([LATE_FEE_RULE_STATUS.ACTIVE, LATE_FEE_RULE_STATUS.INACTIVE]).default(
    LATE_FEE_RULE_STATUS.ACTIVE
  ),
});

const validateCalcFields = (
  data: z.infer<typeof lateFeeRuleBase>,
  ctx: z.RefinementCtx
) => {
  if (data.calculation_type === LATE_FEE_CALC_TYPES.FIXED) {
    if (data.fixed_amount === undefined || data.fixed_amount <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Fixed amount is required for FIXED late fee type",
        path: ["fixed_amount"],
      });
    }
  }
  if (data.calculation_type === LATE_FEE_CALC_TYPES.PERCENT) {
    if (data.percentage === undefined || data.percentage <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Percentage is required for PERCENT late fee type",
        path: ["percentage"],
      });
    }
  }
  if (data.calculation_type === LATE_FEE_CALC_TYPES.PER_DAY) {
    if (data.per_day_amount === undefined || data.per_day_amount <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "Per-day amount is required for PER_DAY late fee type",
        path: ["per_day_amount"],
      });
    }
  }
  if (data.effective_from && data.effective_to) {
    const from = new Date(data.effective_from);
    const to = new Date(data.effective_to);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && from > to) {
      ctx.addIssue({
        code: "custom",
        message: "Effective from must be on or before effective to",
        path: ["effective_to"],
      });
    }
  }
};

export const lateFeeRuleCreateSchema = lateFeeRuleBase.superRefine(validateCalcFields);

export const lateFeeRuleUpdateSchema = lateFeeRuleBase
  .partial()
  .extend({ name: z.string().trim().min(1).max(191).optional() })
  .superRefine((data, ctx) => {
    if (data.calculation_type) {
      validateCalcFields(
        {
          name: data.name || "rule",
          grace_period_days: data.grace_period_days ?? 0,
          calculation_type: data.calculation_type,
          fixed_amount: data.fixed_amount,
          percentage: data.percentage,
          per_day_amount: data.per_day_amount,
          max_cap: data.max_cap,
          effective_from: data.effective_from,
          effective_to: data.effective_to,
          status: data.status ?? LATE_FEE_RULE_STATUS.ACTIVE,
        },
        ctx
      );
    }
  });

export const lateFeePreviewSchema = z.object({
  fee_master_basic_id: z.coerce.number().int().positive(),
  as_of_date: z.string().optional(),
});

import { z } from "zod";

const optionalInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().int().optional()
);

const requiredInt = z.preprocess(
  (v) => Number(v),
  z.number().int({ message: "Must be an integer" })
);

export const studentFeeSettingsUpsertSchema = z.object({
  student_id: requiredInt,
  program_id: optionalInt,
  installment_id: optionalInt,
  basic_fee: z.string().trim().max(191).optional().nullable(),
  discount: z.string().trim().max(191).optional().nullable(),
  status: z.string().default("1"),
});

export const feeAutomateUpsertSchema = z.object({
  student_id: z.string().trim().min(1),
  branch_id: optionalInt,
  board_id: optionalInt,
  program_id: optionalInt,
  class_id: optionalInt,
  intake_id: optionalInt,
  total_fee: z.string().optional().nullable(),
  tuition_fee: z.string().optional().nullable(),
  annual_fee: z.string().optional().nullable(),
  safety_fee: z.string().optional().nullable(),
  id_card: z.string().optional().nullable(),
  computer_fee: z.coerce.number().int().default(0),
  lms_fee: z.string().optional().nullable(),
  ib_fee: z.coerce.number().int().default(0),
  party_fee: z.coerce.number().int().optional().nullable(),
  no_of_installments: z.coerce.number().int().optional().nullable(),
  per_month_fee: z.string().trim().max(11).default("0"),
  status: z.coerce.number().int().default(1),
  fee_structure_code: z.string().optional().nullable(),
});

export const recordPaymentSchema = z.object({
  fee_master_basic_id: requiredInt,
  /** Distribute payment across unpaid lines, or target a specific fee_masters.id */
  fee_masters_id: optionalInt,
  amount: z.coerce.number().positive("Payment amount must be greater than 0"),
  note: z.string().trim().max(250).optional().nullable(),
});

export const studentRecordQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(20).optional(),
  search: z.string().optional(),
  branch_id: z.coerce.number().int().optional(),
  program_id: z.coerce.number().int().optional(),
  class_id: z.coerce.number().int().optional(),
  status: z.string().optional(),
});

import { z } from "zod";

export const PAYMENT_MODES = [
  "Cash",
  "Cheque",
  "Bank Transfer",
  "Stripe",
  "PayPal",
] as const;

export type PaymentMode = (typeof PAYMENT_MODES)[number];

const requiredInt = z.preprocess(
  (v) => Number(v),
  z.number().int({ message: "Must be an integer" })
);

const optionalInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().int().optional()
);

export const processPaymentSchema = z.object({
  student_id: requiredInt,
  fee_master_basic_id: requiredInt,
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  payment_mode: z.enum(PAYMENT_MODES),
  fee_masters_id: optionalInt,
  note: z.string().trim().max(100).optional().nullable(),
  /** Cheque / bank reference */
  reference_no: z.string().trim().max(100).optional().nullable(),
  /** Cheque date / transfer date (ISO) */
  paid_date: z.string().optional().nullable(),
});

export const initiateOnlinePaymentSchema = z.object({
  student_id: requiredInt,
  fee_master_basic_id: requiredInt,
  amount: z.coerce.number().positive(),
  payment_mode: z.enum(["Stripe", "PayPal"]),
  fee_masters_id: optionalInt,
  return_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
});

export const completeOnlinePaymentSchema = z.object({
  transaction_number: z.string().min(3),
  status: z.enum(["success", "failed", "cancelled"]),
  gateway_reference: z.string().optional().nullable(),
});

import { z } from "zod";
import {
  BANK_ACCOUNT_NUMBER_MAX_LENGTH,
  BANK_ACCOUNT_TITLE_MAX_LENGTH,
  BANK_ACCOUNT_STATUS,
  BANK_BRANCH_MAX_LENGTH,
} from "../constants/bankAccount.constants";

const optionalId = z.coerce.number().int().positive().nullable().optional();

// ─── Create Bank Account ─────────────────────────────────────────────────────
export const createBankAccountSchema = z.object({
  staff_id: z.coerce
    .number({ error: "Employee is required" })
    .int("Employee must reference a valid staff id")
    .positive("Employee must reference a valid staff id"),
  account_title: z
    .string({ error: "Account title is required" })
    .trim()
    .min(1, "Account title is required")
    .max(BANK_ACCOUNT_TITLE_MAX_LENGTH, `Account title must be at most ${BANK_ACCOUNT_TITLE_MAX_LENGTH} characters`),
  account_number: z
    .string({ error: "Account number is required" })
    .trim()
    .min(1, "Account number is required")
    .max(BANK_ACCOUNT_NUMBER_MAX_LENGTH, `Account number must be at most ${BANK_ACCOUNT_NUMBER_MAX_LENGTH} characters`),
  bank_branch: z
    .string({ error: "Bank branch is required" })
    .trim()
    .min(1, "Bank branch is required")
    .max(BANK_BRANCH_MAX_LENGTH, `Bank branch must be at most ${BANK_BRANCH_MAX_LENGTH} characters`),
  status: z
    .union([z.literal(BANK_ACCOUNT_STATUS.ACTIVE), z.literal(BANK_ACCOUNT_STATUS.INACTIVE)])
    .optional(),
  // No relation exists to confirm this against staff_basic_information — see
  // bankAccount.constants.ts. Accepted as a plain optional id, unvalidated
  // beyond "is a positive integer".
  staff_bi_id: optionalId,
});

export type CreateBankAccountInput = z.infer<typeof createBankAccountSchema>;

// ─── Update Bank Account (partial, but body cannot be empty) ────────────────
export const updateBankAccountSchema = createBankAccountSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the bank account",
  });

export type UpdateBankAccountInput = z.infer<typeof updateBankAccountSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const bankAccountIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Bank account id must be a number" })
    .int("Bank account id must be a valid integer")
    .positive("Bank account id must be a valid integer"),
});

// ─── GET /bank-accounts query params ────────────────────────────────────────
export const listBankAccountsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  staff_id: z.coerce.number().int().positive().optional(),
  status: z
    .union([z.literal(BANK_ACCOUNT_STATUS.ACTIVE), z.literal(BANK_ACCOUNT_STATUS.INACTIVE)])
    .optional(),
});

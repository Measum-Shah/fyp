import { z } from "zod";
import {
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_PASSWORD_MIN_LENGTH,
  USER_TYPE_OPTIONS,
} from "../constants/user.constants";

// ─── Create User ─────────────────────────────────────────────────────────────
export const createUserSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(USER_NAME_MAX_LENGTH, `Name must be at most ${USER_NAME_MAX_LENGTH} characters`),
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(USER_EMAIL_MAX_LENGTH, `Email must be at most ${USER_EMAIL_MAX_LENGTH} characters`),
  password: z
    .string({ error: "Password is required" })
    .min(USER_PASSWORD_MIN_LENGTH, `Password must be at least ${USER_PASSWORD_MIN_LENGTH} characters`),
  branch_id: z.coerce.number().int().positive().optional().nullable(),
  // Links this login to its own HR record — every HR & Payroll login
  // (admin/hr) reaches the module in full regardless of whether it's
  // linked to a staff record, so this stays optional.
  employee_id: z.coerce.number().int().positive().optional().nullable(),
  user_type: z.enum(USER_TYPE_OPTIONS).optional().default("staff"),
  active: z.coerce.number().int().min(0).max(1).optional().default(1),
});

export type CreateUserBody = z.infer<typeof createUserSchema>;

// ─── Update User (password NOT included here — see resetPasswordSchema) ────
export const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(USER_NAME_MAX_LENGTH, `Name must be at most ${USER_NAME_MAX_LENGTH} characters`)
      .optional(),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Enter a valid email address")
      .max(USER_EMAIL_MAX_LENGTH, `Email must be at most ${USER_EMAIL_MAX_LENGTH} characters`)
      .optional(),
    branch_id: z.coerce.number().int().positive().nullable().optional(),
    employee_id: z.coerce.number().int().positive().nullable().optional(),
    user_type: z.enum(USER_TYPE_OPTIONS).optional(),
    active: z.coerce.number().int().min(0).max(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the user",
  });

export type UpdateUserBody = z.infer<typeof updateUserSchema>;

// ─── Reset Password ──────────────────────────────────────────────────────────
export const resetPasswordSchema = z.object({
  password: z
    .string({ error: "Password is required" })
    .min(USER_PASSWORD_MIN_LENGTH, `Password must be at least ${USER_PASSWORD_MIN_LENGTH} characters`),
});

export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const userIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "User id must be a number" })
    .int("User id must be a valid integer")
    .positive("User id must be a valid integer"),
});

// ─── GET /users query params ─────────────────────────────────────────────────
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

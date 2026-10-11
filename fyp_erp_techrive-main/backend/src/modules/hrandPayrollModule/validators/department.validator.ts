import { z } from "zod";
import {
  DEPARTMENT_DESCRIPTION_MAX_LENGTH,
  DEPARTMENT_NAME_MAX_LENGTH,
} from "../constants/department.constants";

// ─── Create Department ───────────────────────────────────────────────────────
export const createDepartmentSchema = z.object({
  name: z
    .string({ error: "Department name is required" })
    .trim()
    .min(1, "Department name is required")
    .max(
      DEPARTMENT_NAME_MAX_LENGTH,
      `Department name must be at most ${DEPARTMENT_NAME_MAX_LENGTH} characters`
    ),
  description: z
    .string()
    .trim()
    .max(
      DEPARTMENT_DESCRIPTION_MAX_LENGTH,
      `Description must be at most ${DEPARTMENT_DESCRIPTION_MAX_LENGTH} characters`
    )
    .optional(),
  // A Department must belong to exactly one Campus (branch_id), and that
  // Campus must belong to the given School (company_id) — see
  // company-branch.util.ts#assertBranchBelongsToCompany, which enforces the
  // relationship server-side (mirrors createBranchSchema's company_id, one
  // level down the School → Campus → Department cascade). Required on
  // create; optional on update (see updateDepartmentSchema below) since the
  // frontend keeps these fields disabled while editing.
  company_id: z.coerce
    .number({ error: "School is required" })
    .int("School id must be a valid integer")
    .positive("School is required"),
  branch_id: z.coerce
    .number({ error: "Campus is required" })
    .int("Campus id must be a valid integer")
    .positive("Campus is required"),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;

// ─── Update Department (partial, but body cannot be empty) ─────────────────
export const updateDepartmentSchema = createDepartmentSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update the department",
  });

export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

// ─── :id route param ────────────────────────────────────────────────────────
export const departmentIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "Department id must be a number" })
    .int("Department id must be a valid integer")
    .positive("Department id must be a valid integer"),
});

// ─── GET /departments query params ──────────────────────────────────────────
export const listDepartmentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
});
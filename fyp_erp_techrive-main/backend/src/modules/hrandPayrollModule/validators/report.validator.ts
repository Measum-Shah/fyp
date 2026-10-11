import { z } from "zod";
import { DATE_REGEX, EMPLOYEE_STATUS } from "../constants/employee.constants";

// ─── Reports Module — Validators ────────────────────────────────────────────
// Phase 1: Employee-based reports only (Directory, Headcount by Department,
// Headcount by Branch, Joiners & Exits). These read from the same `staff`
// table Employee Management already owns — no new DB objects are introduced
// here, so there is nothing new to guard against at the schema level beyond
// the query params below.

// ─── GET /reports/employee-directory ────────────────────────────────────────
// page/limit mirror employee.validator.ts's listing schema exactly (same
// defaults, same coercion, same max) — this report is a real paginated list
// over `staff`, same as Employee Management's own list endpoint, so it gets
// the same pagination contract rather than the "return everything, cap at
// REPORT_MAX_ROWS" approach the aggregate reports below use.
export const employeeDirectoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  department_id: z.coerce.number().int().positive().optional(),
  branch_id: z.coerce.number().int().positive().optional(),
  company_id: z.coerce.number().int().positive().optional(),
  status: z.enum([EMPLOYEE_STATUS.ACTIVE, EMPLOYEE_STATUS.INACTIVE]).optional(),
});

export type EmployeeDirectoryQuery = z.infer<typeof employeeDirectoryQuerySchema>;

// ─── GET /reports/headcount-by-department & /reports/headcount-by-branch ───
// No filters for now — these are small aggregate tables (one row per
// department/branch), so there's nothing meaningful to paginate or search.

// ─── GET /reports/joiners-exits ─────────────────────────────────────────────
const reportDateField = (label: string) =>
  z
    .string({ error: `${label} date is required` })
    .trim()
    .regex(DATE_REGEX, `${label} date must be in YYYY-MM-DD format`)
    .refine((val) => !Number.isNaN(new Date(val).getTime()), {
      message: `${label} date must be a valid calendar date`,
    });

export const joinersExitsQuerySchema = z
  .object({
    from: reportDateField("From"),
    to: reportDateField("To"),
  })
  .refine((data) => new Date(data.from).getTime() <= new Date(data.to).getTime(), {
    message: "'from' date must be on or before 'to' date",
    path: ["from"],
  });

export type JoinersExitsQuery = z.infer<typeof joinersExitsQuerySchema>;

// ─── GET /reports/cnic-expiry ────────────────────────────────────────────────
// Unlike joiners-exits, from/to are both OPTIONAL here — this report is
// primarily "what's expiring soon" for a dashboard widget as well as a full
// report page, so the service applies a sensible default window
// (today .. today + EXPIRY_DEFAULT_WINDOW_DAYS) when either is omitted,
// rather than forcing the caller to compute and pass one every time.
const optionalReportDateField = (label: string) =>
  z
    .string()
    .trim()
    .regex(DATE_REGEX, `${label} date must be in YYYY-MM-DD format`)
    .refine((val) => !Number.isNaN(new Date(val).getTime()), {
      message: `${label} date must be a valid calendar date`,
    })
    .optional();

export const cnicExpiryQuerySchema = z
  .object({
    from: optionalReportDateField("From"),
    to: optionalReportDateField("To"),
    branch_id: z.coerce.number().int().positive().optional(),
    company_id: z.coerce.number().int().positive().optional(),
    department_id: z.coerce.number().int().positive().optional(),
  })
  .refine((data) => !data.from || !data.to || new Date(data.from).getTime() <= new Date(data.to).getTime(), {
    message: "'from' date must be on or before 'to' date",
    path: ["from"],
  });

export type CnicExpiryQuery = z.infer<typeof cnicExpiryQuerySchema>;

// ─── GET /reports/contract-probation-expiry ─────────────────────────────────
// staff.end_day_contract and staff.probation are free-text VarChar columns
// (see employee.validator.ts's profileTextField for both — there is no real
// DATE column backing either one), so `type` lets the caller ask for just
// one kind rather than always getting both mixed together.
export const contractProbationExpiryQuerySchema = z
  .object({
    from: optionalReportDateField("From"),
    to: optionalReportDateField("To"),
    branch_id: z.coerce.number().int().positive().optional(),
    company_id: z.coerce.number().int().positive().optional(),
    department_id: z.coerce.number().int().positive().optional(),
    type: z.enum(["contract", "probation"]).optional(),
  })
  .refine((data) => !data.from || !data.to || new Date(data.from).getTime() <= new Date(data.to).getTime(), {
    message: "'from' date must be on or before 'to' date",
    path: ["from"],
  });

export type ContractProbationExpiryQuery = z.infer<typeof contractProbationExpiryQuerySchema>;
import { Request, Response } from "express";
import * as lookupService from "../services/lookup.service";

// ─── Shared error responder ──────────────────────────────────────────────────
// Mirrors employee.controller.ts's handleError. Kept as a small local copy
// rather than importing across controllers, so this file has no dependency
// on employee.controller.ts internals.
const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /employees/lookups/departments ─────────────────────────────────────
// ─── GET /employees/lookups/departments?branch_id=… ──────────────────────────
export const getDepartments = async (req: Request, res: Response) => {
  try {
    const { branch_id } = req.query as unknown as { branch_id?: number };
    const data = await lookupService.listDepartments(branch_id !== undefined ? Number(branch_id) : undefined);
    return res.status(200).json({ message: "Departments fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetDepartments error:");
  }
};

// ─── GET /employees/lookups/branches?company_id=… ─────────────────────────────
export const getBranches = async (req: Request, res: Response) => {
  try {
    const { company_id } = req.query as unknown as { company_id?: number };
    const data = await lookupService.listBranches(
      company_id !== undefined ? Number(company_id) : undefined
    );
    return res.status(200).json({ message: "Campuses fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetBranches error:");
  }
};

// ─── GET /employees/lookups/designations ─────────────────────────────────────
export const getDesignations = async (_req: Request, res: Response) => {
  try {
    const data = await lookupService.listDesignations();
    return res.status(200).json({ message: "Designations fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetDesignations error:");
  }
};

// ─── GET /employees/lookups/staff-types ──────────────────────────────────────
export const getStaffTypes = async (_req: Request, res: Response) => {
  try {
    const data = await lookupService.listStaffTypes();
    return res.status(200).json({ message: "Staff types fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetStaffTypes error:");
  }
};

// ─── GET /employees/lookups/search?q=… ───────────────────────────────────────
// Feeds the Attendance module's employee picker (see attendance.constants.ts
// for why this is a search endpoint rather than a lookup dump).
export const getEmployeesSearch = async (req: Request, res: Response) => {
  try {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : undefined;
    const data = await lookupService.searchEmployees(query || undefined);
    return res.status(200).json({ message: "Employees fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetEmployeesSearch error:");
  }
};

// ─── GET /employees/lookups/staff ────────────────────────────────────────────
// Shared "pick an employee" dropdown for every Payroll & Salary feature
// (Bank Accounts, Salary Sheet, Loans, Increments, EOBI/EPF Register).
export const getStaff = async (_req: Request, res: Response) => {
  try {
    const data = await lookupService.listStaff();
    return res.status(200).json({ message: "Staff fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetStaff error:");
  }
};
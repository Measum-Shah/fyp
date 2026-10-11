import { Request, Response } from "express";
import * as reportService from "../services/report.service";
import {
  CnicExpiryQuery,
  ContractProbationExpiryQuery,
  EmployeeDirectoryQuery,
  JoinersExitsQuery,
} from "../validators/report.validator";

// ─── Shared error responder ──────────────────────────────────────────────────
// Mirrors employee.controller.ts's/department.controller.ts's handleError.
// Reports are read-only, so there's no AppError/P2002/P2025 path to handle
// here — any failure is an unexpected one.
const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /reports/employee-directory ────────────────────────────────────────
export const getEmployeeDirectoryReport = async (req: Request, res: Response) => {
  try {
    const query = req.query as unknown as EmployeeDirectoryQuery;
    const result = await reportService.getEmployeeDirectoryReport(query);

    return res.status(200).json({
      message: "Employee directory report generated successfully",
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
      },
    });
  } catch (error) {
    return handleError(res, error, "GetEmployeeDirectoryReport error:");
  }
};

// ─── GET /reports/headcount-by-department ───────────────────────────────────
export const getHeadcountByDepartmentReport = async (_req: Request, res: Response) => {
  try {
    const result = await reportService.getHeadcountByDepartmentReport();

    return res.status(200).json({
      message: "Headcount by department report generated successfully",
      data: result.data,
      meta: { totalEmployees: result.totalEmployees },
    });
  } catch (error) {
    return handleError(res, error, "GetHeadcountByDepartmentReport error:");
  }
};

// ─── GET /reports/headcount-by-branch ───────────────────────────────────────
export const getHeadcountByBranchReport = async (_req: Request, res: Response) => {
  try {
    const result = await reportService.getHeadcountByBranchReport();

    return res.status(200).json({
      message: "Headcount by campus report generated successfully",
      data: result.data,
      meta: { totalEmployees: result.totalEmployees },
    });
  } catch (error) {
    return handleError(res, error, "GetHeadcountByBranchReport error:");
  }
};
// ─── GET /reports/employee-analytics ────────────────────────────────────────
export const getEmployeeAnalyticsReport = async (_req: Request, res: Response) => {
  try {
    const result = await reportService.getEmployeeAnalyticsReport();

    return res.status(200).json({
      message: "Employee analytics report generated successfully",
      data: result,
      meta: { totalEmployees: result.totalEmployees },
    });
  } catch (error) {
    return handleError(res, error, "GetEmployeeAnalyticsReport error:");
  }
};

// ─── GET /reports/joiners-exits ─────────────────────────────────────────────
export const getJoinersAndExitsReport = async (req: Request, res: Response) => {
  try {
    const query = req.query as unknown as JoinersExitsQuery;
    const result = await reportService.getJoinersAndExitsReport(query);

    return res.status(200).json({
      message: "Joiners & exits report generated successfully",
      data: result,
      meta: {
        joinersCount: result.joiners.length,
        exitsCount: result.exits.length,
        from: query.from,
        to: query.to,
      },
    });
  } catch (error) {
    return handleError(res, error, "GetJoinersAndExitsReport error:");
  }
};

// ─── GET /reports/cnic-expiry ────────────────────────────────────────────────
export const getCnicExpiryReport = async (req: Request, res: Response) => {
  try {
    const query = req.query as unknown as CnicExpiryQuery;
    const result = await reportService.getCnicExpiryReport(query);

    return res.status(200).json({
      message: "CNIC expiry report generated successfully",
      data: result.data,
      meta: { total: result.total },
    });
  } catch (error) {
    return handleError(res, error, "GetCnicExpiryReport error:");
  }
};

// ─── GET /reports/contract-probation-expiry ─────────────────────────────────
export const getContractProbationExpiryReport = async (req: Request, res: Response) => {
  try {
    const query = req.query as unknown as ContractProbationExpiryQuery;
    const result = await reportService.getContractProbationExpiryReport(query);

    return res.status(200).json({
      message: "Contract & probation expiry report generated successfully",
      data: result.data,
      meta: { total: result.total },
    });
  } catch (error) {
    return handleError(res, error, "GetContractProbationExpiryReport error:");
  }
};

// ─── GET /reports/staff-strength ─────────────────────────────────────────────
export const getStaffStrengthReport = async (_req: Request, res: Response) => {
  try {
    const result = await reportService.getStaffStrengthReport();

    return res.status(200).json({
      message: "Staff strength report generated successfully",
      data: result,
      meta: { totalEmployees: result.totalEmployees },
    });
  } catch (error) {
    return handleError(res, error, "GetStaffStrengthReport error:");
  }
};
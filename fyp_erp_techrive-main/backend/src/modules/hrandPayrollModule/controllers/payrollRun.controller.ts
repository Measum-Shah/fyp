import { Response } from "express";
import { AppError } from "../utils/app-error";
import { assertBranchBelongsToCompany } from "../utils/company-branch.util";
import * as payrollRunService from "../services/payrollRun.service";
import { CreatePayrollRunInput } from "../validators/payrollRun.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /payroll-runs/eligible-staff ────────────────────────────────────────
export const getEligibleStaff = async (req: AuthRequest, res: Response) => {
  try {
    const { branch_id, company_id, month_year } = req.query as unknown as {
      branch_id: number;
      company_id?: number;
      month_year: string;
    };
    if (company_id) {
      await assertBranchBelongsToCompany(branch_id, company_id);
    }
    const data = await payrollRunService.listEligibleStaff(branch_id, month_year);
    return res.status(200).json({ message: "Eligible employees fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetEligibleStaff error:");
  }
};

// ─── POST /payroll-runs ───────────────────────────────────────────────────────
export const createPayrollRun = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreatePayrollRunInput;
    const actorId = req.user?.id;

    if (!actorId) {
      return res.status(401).json({ message: "Unauthorized: missing authenticated user" });
    }

    if (input.company_id) {
      await assertBranchBelongsToCompany(input.branch_id, input.company_id);
    }

    const result = await payrollRunService.runPayrollBatch(input, actorId);

    return res.status(201).json({
      message: `Generated ${result.generated.length} salary sheet(s), skipped ${result.skipped.length}.`,
      data: result,
    });
  } catch (error) {
    return handleError(res, error, "CreatePayrollRun error:");
  }
};

// ─── GET /payroll-runs ────────────────────────────────────────────────────────
export const getPayrollRun = async (req: AuthRequest, res: Response) => {
  try {
    const { branch_id, company_id, month_year, page, limit } = req.query as unknown as {
      branch_id: number;
      company_id?: number;
      month_year: string;
      page: number;
      limit: number;
    };
    if (company_id) {
      await assertBranchBelongsToCompany(branch_id, company_id);
    }

    const result = await payrollRunService.listRunMembers(branch_id, month_year, page, limit);

    return res.status(200).json({
      message: "Payroll run fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetPayrollRun error:");
  }
};

// ─── DELETE /payroll-runs/:id ─────────────────────────────────────────────────
export const removeRunMember = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await payrollRunService.removeRunMember(id);
    return res.status(200).json({ message: "Employee removed from the payroll run successfully" });
  } catch (error) {
    return handleError(res, error, "RemoveRunMember error:");
  }
};

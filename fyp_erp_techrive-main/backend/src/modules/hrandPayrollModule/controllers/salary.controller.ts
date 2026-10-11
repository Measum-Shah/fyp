import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as salaryService from "../services/salary.service";
import {
  CreateSalaryInput,
  UpdateSalaryApprovalInput,
  UpdateSalaryInput,
} from "../validators/salary.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRecordScope } from "../utils/record-scope.util";

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A salary sheet with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Salary sheet not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /salary-sheets ───────────────────────────────────────────────────────
export const getSalarySheets = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, staff_id, branch_id, company_id, month_id, year_id, salary_status } =
      req.query as unknown as {
        page: number;
        limit: number;
        search?: string;
        staff_id?: number;
        branch_id?: number;
        company_id?: number;
        month_id?: string;
        year_id?: number;
        salary_status?: string;
      };

    const scope = await resolveRecordScope(req, "salary");
    const result = await salaryService.listSalarySheets(
      {
        page,
        limit,
        search,
        staff_id,
        branch_id,
        company_id,
        month_id,
        year_id,
        salary_status,
      },
      scope
    );

    return res.status(200).json({
      message: "Salary sheets fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetSalarySheets error:");
  }
};

// ─── GET /salary-sheets/:id ───────────────────────────────────────────────────
export const getSalarySheetById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "salary");
    const record = await salaryService.getSalarySheetById(id, scope);

    return res.status(200).json({ message: "Salary sheet fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetSalarySheetById error:");
  }
};

// ─── POST /salary-sheets ──────────────────────────────────────────────────────
export const createSalarySheet = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateSalaryInput;
    const record = await salaryService.createSalarySheet(input);

    return res.status(201).json({ message: "Salary sheet created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateSalarySheet error:");
  }
};

// ─── PUT /salary-sheets/:id ───────────────────────────────────────────────────
export const updateSalarySheet = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateSalaryInput;

    const record = await salaryService.updateSalarySheet(id, input);

    return res.status(200).json({ message: "Salary sheet updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateSalarySheet error:");
  }
};

// ─── PATCH /salary-sheets/:id/approval ───────────────────────────────────────
export const updateSalaryApproval = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateSalaryApprovalInput;

    const record = await salaryService.updateSalaryApproval(id, input);

    return res.status(200).json({ message: "Approval status updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateSalaryApproval error:");
  }
};

// ─── DELETE /salary-sheets/:id ────────────────────────────────────────────────
export const deleteSalarySheet = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await salaryService.deleteSalarySheet(id);

    return res.status(200).json({ message: "Salary sheet deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteSalarySheet error:");
  }
};

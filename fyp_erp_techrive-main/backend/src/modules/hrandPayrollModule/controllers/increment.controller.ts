import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as incrementService from "../services/increment.service";
import {
  CreateIncrementInput,
  UpdateIncrementInput,
  UpdateIncrementStatusInput,
} from "../validators/increment.validator";
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
      return res.status(409).json({ message: "An increment request with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Increment request not found" });
    }
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getIncrements = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, staff_id, branch_id, company_id } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      staff_id?: number;
      branch_id?: number;
      company_id?: number;
    };

    const scope = await resolveRecordScope(req, "increment");
    const result = await incrementService.listIncrements({ page, limit, search, staff_id, branch_id, company_id }, scope);

    return res.status(200).json({ message: "Increment requests fetched successfully", data: result.data, meta: result.meta });
  } catch (error) {
    return handleError(res, error, "GetIncrements error:");
  }
};

export const getIncrementById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "increment");
    const record = await incrementService.getIncrementById(id, scope);
    return res.status(200).json({ message: "Increment request fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetIncrementById error:");
  }
};

// ─── GET /increments/staff/:staffId/salary-snapshot ─────────────────────────
// Feeds the New Increment Request form: auto-fills Current Basic Salary and
// Previous Gross Salary (and the employee's actual School/Campus) the moment
// an Employee is selected — see increment.service.ts#getStaffSalarySnapshot.
export const getStaffSalarySnapshotHandler = async (req: AuthRequest, res: Response) => {
  try {
    const { staffId } = req.params as unknown as { staffId: number };
    const { branch_id } = req.query as unknown as { branch_id?: number };
    const snapshot = await incrementService.getStaffSalarySnapshot(staffId, branch_id);
    return res.status(200).json({ message: "Employee salary snapshot fetched successfully", data: snapshot });
  } catch (error) {
    return handleError(res, error, "GetStaffSalarySnapshot error:");
  }
};

export const createIncrement = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateIncrementInput;
    const record = await incrementService.createIncrement(input, req.user?.id);
    return res.status(201).json({ message: "Increment request created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateIncrement error:");
  }
};

export const updateIncrement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateIncrementInput;
    const record = await incrementService.updateIncrement(id, input);
    return res.status(200).json({ message: "Increment request updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateIncrement error:");
  }
};

export const updateIncrementStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateIncrementStatusInput;
    const record = await incrementService.updateIncrementStatus(id, input);
    return res.status(200).json({ message: "Status updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateIncrementStatus error:");
  }
};

export const deleteIncrement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await incrementService.deleteIncrement(id);
    return res.status(200).json({ message: "Increment request deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteIncrement error:");
  }
};
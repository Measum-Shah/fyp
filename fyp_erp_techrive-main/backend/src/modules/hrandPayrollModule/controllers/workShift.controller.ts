import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as workShiftService from "../services/workShift.service";
import { CreateWorkShiftInput, UpdateWorkShiftInput } from "../validators/workShift.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRoleBranchIds } from "../utils/branch-scope.util";

// ─── Shared error responder ──────────────────────────────────────────────────
// Mirrors branch.controller.ts's/employee.controller.ts's handleError.
const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A shift with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Work shift not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /work-shifts ─────────────────────────────────────────────────────────
export const getWorkShifts = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, branch_id, company_id, status } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      branch_id?: number;
      company_id?: number;
      status?: number;
    };

    const roleBranchIds = await resolveRoleBranchIds(req);
    const result = await workShiftService.listWorkShifts({ page, limit, search, branch_id, company_id, status }, roleBranchIds);

    return res.status(200).json({
      message: "Work shifts fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetWorkShifts error:");
  }
};

// ─── GET /work-shifts/:id ─────────────────────────────────────────────────────
export const getWorkShiftById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const roleBranchIds = await resolveRoleBranchIds(req);
    const shift = await workShiftService.getWorkShiftById(id, roleBranchIds);

    return res.status(200).json({ message: "Work shift fetched successfully", data: shift });
  } catch (error) {
    return handleError(res, error, "GetWorkShiftById error:");
  }
};

// ─── POST /work-shifts ────────────────────────────────────────────────────────
export const createWorkShift = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateWorkShiftInput;
    const shift = await workShiftService.createWorkShift(input, req.user?.id);

    return res.status(201).json({ message: "Work shift created successfully", data: shift });
  } catch (error) {
    return handleError(res, error, "CreateWorkShift error:");
  }
};

// ─── PUT /work-shifts/:id ──────────────────────────────────────────────────────
export const updateWorkShift = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateWorkShiftInput;

    const shift = await workShiftService.updateWorkShift(id, input, req.user?.id);

    return res.status(200).json({ message: "Work shift updated successfully", data: shift });
  } catch (error) {
    return handleError(res, error, "UpdateWorkShift error:");
  }
};

// ─── DELETE /work-shifts/:id ────────────────────────────────────────────────────
export const deleteWorkShift = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await workShiftService.deleteWorkShift(id, req.user?.id);

    return res.status(200).json({ message: "Work shift deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteWorkShift error:");
  }
};
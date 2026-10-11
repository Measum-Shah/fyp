import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as leaveTypeService from "../services/leaveType.service";
import {
  CreateLeaveTypeInput,
  UpdateLeaveTypeInput,
} from "../validators/leaveType.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRoleBranchIds } from "../utils/branch-scope.util";

// ─── Shared error responder — mirrors department.controller.ts's handleError ──
const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A leave type with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Leave type not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /leave-types ─────────────────────────────────────────────────────────
export const getLeaveTypes = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, status } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      status?: number;
    };

    const branchIds = await resolveRoleBranchIds(req);
    const result = await leaveTypeService.listLeaveTypes({ page, limit, search, status }, branchIds);

    return res.status(200).json({
      message: "Leave types fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetLeaveTypes error:");
  }
};

// ─── GET /leave-types/lookup ─────────────────────────────────────────────────
export const getLeaveTypesLookup = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await leaveTypeService.listActiveLookup();
    return res.status(200).json({ message: "Leave types fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetLeaveTypesLookup error:");
  }
};

// ─── GET /leave-types/:id ─────────────────────────────────────────────────────
export const getLeaveTypeById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const branchIds = await resolveRoleBranchIds(req);
    const leaveType = await leaveTypeService.getLeaveTypeById(id, branchIds);

    return res.status(200).json({ message: "Leave type fetched successfully", data: leaveType });
  } catch (error) {
    return handleError(res, error, "GetLeaveTypeById error:");
  }
};

// ─── POST /leave-types ────────────────────────────────────────────────────────
export const createLeaveType = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateLeaveTypeInput;
    const leaveType = await leaveTypeService.createLeaveType(input, req.user?.id);

    return res.status(201).json({ message: "Leave type created successfully", data: leaveType });
  } catch (error) {
    return handleError(res, error, "CreateLeaveType error:");
  }
};

// ─── PUT /leave-types/:id ─────────────────────────────────────────────────────
export const updateLeaveType = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateLeaveTypeInput;

    const leaveType = await leaveTypeService.updateLeaveType(id, input, req.user?.id);

    return res.status(200).json({ message: "Leave type updated successfully", data: leaveType });
  } catch (error) {
    return handleError(res, error, "UpdateLeaveType error:");
  }
};

// ─── DELETE /leave-types/:id ──────────────────────────────────────────────────
export const deleteLeaveType = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await leaveTypeService.deleteLeaveType(id, req.user?.id);

    return res.status(200).json({ message: "Leave type deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteLeaveType error:");
  }
};
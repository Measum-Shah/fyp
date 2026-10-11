import { Request, Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRoleBranchIds } from "../utils/branch-scope.util";
import * as staffTypeService from "../services/staffType.service";
import { CreateStaffTypeInput, UpdateStaffTypeInput } from "../validators/staffType.validator";

// ─── Shared error responder ──────────────────────────────────────────────────
// Mirrors department.controller.ts's handleError exactly.
const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A staff type with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Staff type not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /staff-types ─────────────────────────────────────────────────────────
export const getStaffTypes = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
    };

    const branchIds = await resolveRoleBranchIds(req);
    const result = await staffTypeService.listStaffTypes({ page, limit, search }, branchIds);

    return res.status(200).json({
      message: "Staff types fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetStaffTypes error:");
  }
};

// ─── GET /staff-types/:id ─────────────────────────────────────────────────────
export const getStaffTypeById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const branchIds = await resolveRoleBranchIds(req);
    const staffType = await staffTypeService.getStaffTypeById(id, branchIds);

    return res.status(200).json({
      message: "Staff type fetched successfully",
      data: staffType,
    });
  } catch (error) {
    return handleError(res, error, "GetStaffTypeById error:");
  }
};

// ─── POST /staff-types ────────────────────────────────────────────────────────
export const createStaffType = async (req: Request, res: Response) => {
  try {
    const input = req.body as CreateStaffTypeInput;
    const staffType = await staffTypeService.createStaffType(input);

    return res.status(201).json({
      message: "Staff type created successfully",
      data: staffType,
    });
  } catch (error) {
    return handleError(res, error, "CreateStaffType error:");
  }
};

// ─── PUT /staff-types/:id ─────────────────────────────────────────────────────
export const updateStaffType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateStaffTypeInput;

    const staffType = await staffTypeService.updateStaffType(id, input);

    return res.status(200).json({
      message: "Staff type updated successfully",
      data: staffType,
    });
  } catch (error) {
    return handleError(res, error, "UpdateStaffType error:");
  }
};

// ─── DELETE /staff-types/:id ──────────────────────────────────────────────────
export const deleteStaffType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await staffTypeService.deleteStaffType(id);

    return res.status(200).json({ message: "Staff type deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteStaffType error:");
  }
};

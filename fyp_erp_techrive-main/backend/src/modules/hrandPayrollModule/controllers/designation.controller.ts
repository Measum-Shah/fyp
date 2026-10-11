import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRoleBranchIds } from "../utils/branch-scope.util";
import * as designationService from "../services/designation.service";
import { CreateDesignationInput, UpdateDesignationInput } from "../validators/designation.validator";

// ─── Shared error responder ──────────────────────────────────────────────────
const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A designation with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Designation not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /designations ─────────────────────────────────────────────────────────
export const getDesignations = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
    };

    const branchIds = await resolveRoleBranchIds(req);
    const result = await designationService.listDesignations({ page, limit, search }, branchIds);

    return res.status(200).json({
      message: "Designations fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetDesignations error:");
  }
};

// ─── GET /designations/:id ───────────────────────────────────────────────────
export const getDesignationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const branchIds = await resolveRoleBranchIds(req);
    const designation = await designationService.getDesignationById(id, branchIds);

    return res.status(200).json({
      message: "Designation fetched successfully",
      data: designation,
    });
  } catch (error) {
    return handleError(res, error, "GetDesignationById error:");
  }
};

// ─── POST /designations ──────────────────────────────────────────────────────
export const createDesignation = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateDesignationInput;
    const designation = await designationService.createDesignation(input, req.user?.id);

    return res.status(201).json({
      message: "Designation created successfully",
      data: designation,
    });
  } catch (error) {
    return handleError(res, error, "CreateDesignation error:");
  }
};

// ─── PUT /designations/:id ────────────────────────────────────────────────────
export const updateDesignation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateDesignationInput;

    const designation = await designationService.updateDesignation(id, input, req.user?.id);

    return res.status(200).json({
      message: "Designation updated successfully",
      data: designation,
    });
  } catch (error) {
    return handleError(res, error, "UpdateDesignation error:");
  }
};

// ─── DELETE /designations/:id ─────────────────────────────────────────────────
export const deleteDesignation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await designationService.deleteDesignation(id, req.user?.id);

    return res.status(200).json({ message: "Designation deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteDesignation error:");
  }
};

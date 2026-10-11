import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as branchService from "../services/branch.service";
import { CreateBranchInput, UpdateBranchInput } from "../validators/branch.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";

// ─── Shared error responder ──────────────────────────────────────────────────
// Mirrors employee.controller.ts's/department.controller.ts's handleError.
const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A campus with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Campus not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /branches/lookups/companies ──────────────────────────────────────────
export const getCompanies = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await branchService.listCompanies();
    return res.status(200).json({ message: "School / University fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetCompanies error:");
  }
};

// ─── GET /branches ────────────────────────────────────────────────────────────
export const getBranches = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, status } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      status?: number;
    };

    const result = await branchService.listBranches({ page, limit, search, status });

    return res.status(200).json({
      message: "Campuses fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetBranches error:");
  }
};

// ─── GET /branches/:id ────────────────────────────────────────────────────────
export const getBranchById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const branch = await branchService.getBranchById(id);

    return res.status(200).json({ message: "Campus fetched successfully", data: branch });
  } catch (error) {
    return handleError(res, error, "GetBranchById error:");
  }
};

// ─── POST /branches ───────────────────────────────────────────────────────────
export const createBranch = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateBranchInput;
    const branch = await branchService.createBranch(input, req.user?.id);

    return res.status(201).json({ message: "Campus created successfully", data: branch });
  } catch (error) {
    return handleError(res, error, "CreateBranch error:");
  }
};

// ─── PUT /branches/:id ─────────────────────────────────────────────────────────
export const updateBranch = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateBranchInput;

    const branch = await branchService.updateBranch(id, input, req.user?.id);

    return res.status(200).json({ message: "Campus updated successfully", data: branch });
  } catch (error) {
    return handleError(res, error, "UpdateBranch error:");
  }
};

// ─── DELETE /branches/:id ──────────────────────────────────────────────────────
export const deleteBranch = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await branchService.deleteBranch(id, req.user?.id);

    return res.status(200).json({ message: "Campus deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteBranch error:");
  }
};
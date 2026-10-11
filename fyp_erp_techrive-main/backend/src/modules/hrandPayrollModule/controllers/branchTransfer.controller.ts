import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as branchTransferService from "../services/branchTransfer.service";
import {
  CreateBranchTransferInput,
  UpdateBranchTransferApprovalInput,
  UpdateBranchTransferInput,
} from "../validators/branchTransfer.validator";
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
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Campus transfer not found" });
    }
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getBranchTransfers = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, staff_id, status } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      staff_id?: number;
      status?: string;
    };
    const scope = await resolveRecordScope(req, "branch_transfer");
    const result = await branchTransferService.listBranchTransfers({ page, limit, search, staff_id, status }, scope);
    return res.status(200).json({ message: "Campus transfers fetched successfully", data: result.data, meta: result.meta });
  } catch (error) {
    return handleError(res, error, "GetBranchTransfers error:");
  }
};

export const getBranchTransferById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "branch_transfer");
    const record = await branchTransferService.getBranchTransferById(id, scope);
    return res.status(200).json({ message: "Campus transfer fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetBranchTransferById error:");
  }
};

export const createBranchTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateBranchTransferInput;
    const actorId = req.user?.id;
    if (!actorId) return res.status(401).json({ message: "Unauthorized: missing authenticated user" });

    const record = await branchTransferService.createBranchTransfer(input, actorId);
    return res.status(201).json({ message: "Campus transfer request created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateBranchTransfer error:");
  }
};

export const updateBranchTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateBranchTransferInput;
    const record = await branchTransferService.updateBranchTransfer(id, input);
    return res.status(200).json({ message: "Campus transfer updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateBranchTransfer error:");
  }
};

export const updateBranchTransferApproval = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateBranchTransferApprovalInput;
    const actorId = req.user?.id;
    if (!actorId) return res.status(401).json({ message: "Unauthorized: missing authenticated user" });

    const record = await branchTransferService.updateBranchTransferApproval(id, input, actorId);
    return res.status(200).json({ message: "Approval status updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateBranchTransferApproval error:");
  }
};

export const deleteBranchTransfer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await branchTransferService.deleteBranchTransfer(id);
    return res.status(200).json({ message: "Campus transfer deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteBranchTransfer error:");
  }
};
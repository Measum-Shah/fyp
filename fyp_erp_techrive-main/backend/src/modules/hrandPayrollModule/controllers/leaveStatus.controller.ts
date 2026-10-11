import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as leaveStatusService from "../services/leaveStatus.service";
import {
  CreateLeaveStatusInput,
  UpdateLeaveStatusInput,
} from "../validators/leaveStatus.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A leave status with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Leave status not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /leave-statuses ──────────────────────────────────────────────────────
export const getLeaveStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, status } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      status?: number;
    };

    const result = await leaveStatusService.listLeaveStatuses({ page, limit, search, status });

    return res.status(200).json({
      message: "Leave statuses fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetLeaveStatuses error:");
  }
};

// ─── GET /leave-statuses/lookup ──────────────────────────────────────────────
export const getLeaveStatusesLookup = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await leaveStatusService.listActiveLookup();
    return res.status(200).json({ message: "Leave statuses fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetLeaveStatusesLookup error:");
  }
};

// ─── GET /leave-statuses/:id ──────────────────────────────────────────────────
export const getLeaveStatusById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const leaveStatus = await leaveStatusService.getLeaveStatusById(id);

    return res
      .status(200)
      .json({ message: "Leave status fetched successfully", data: leaveStatus });
  } catch (error) {
    return handleError(res, error, "GetLeaveStatusById error:");
  }
};

// ─── POST /leave-statuses ─────────────────────────────────────────────────────
export const createLeaveStatus = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateLeaveStatusInput;
    const leaveStatus = await leaveStatusService.createLeaveStatus(input, req.user?.id);

    return res
      .status(201)
      .json({ message: "Leave status created successfully", data: leaveStatus });
  } catch (error) {
    return handleError(res, error, "CreateLeaveStatus error:");
  }
};

// ─── PUT /leave-statuses/:id ──────────────────────────────────────────────────
export const updateLeaveStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateLeaveStatusInput;

    const leaveStatus = await leaveStatusService.updateLeaveStatus(id, input, req.user?.id);

    return res
      .status(200)
      .json({ message: "Leave status updated successfully", data: leaveStatus });
  } catch (error) {
    return handleError(res, error, "UpdateLeaveStatus error:");
  }
};

// ─── DELETE /leave-statuses/:id ───────────────────────────────────────────────
export const deleteLeaveStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await leaveStatusService.deleteLeaveStatus(id, req.user?.id);

    return res.status(200).json({ message: "Leave status deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteLeaveStatus error:");
  }
};
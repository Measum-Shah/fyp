import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as performanceService from "../services/performance.service";
import { CreatePerformanceInput, UpdatePerformanceInput } from "../validators/performance.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRecordScope } from "../utils/record-scope.util";

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message, ...(error.details ? { errors: error.details } : {}) });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return res.status(404).json({ message: "Performance record not found" });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getPerformances = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, staff_id, month } = req.query as unknown as { page: number; limit: number; staff_id?: number; month?: string };
    const scope = await resolveRecordScope(req, "performance");
    const result = await performanceService.listPerformances({ page, limit, staff_id, month }, scope);
    return res.status(200).json({ message: "Performance records fetched successfully", data: result.data, meta: result.meta });
  } catch (error) {
    return handleError(res, error, "GetPerformances error:");
  }
};

export const getPerformanceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "performance");
    const record = await performanceService.getPerformanceById(id, scope);
    return res.status(200).json({ message: "Performance record fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetPerformanceById error:");
  }
};

export const createPerformance = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreatePerformanceInput;
    const record = await performanceService.createPerformance(input, req.user?.id);
    return res.status(201).json({ message: "Performance record created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreatePerformance error:");
  }
};

export const updatePerformance = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdatePerformanceInput;
    const record = await performanceService.updatePerformance(id, input, req.user?.id);
    return res.status(200).json({ message: "Performance record updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdatePerformance error:");
  }
};

export const deletePerformance = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await performanceService.deletePerformance(id, req.user?.id);
    return res.status(200).json({ message: "Performance record deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeletePerformance error:");
  }
};

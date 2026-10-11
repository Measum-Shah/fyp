import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as terminationService from "../services/termination.service";
import { CreateTerminationInput, UpdateTerminationInput } from "../validators/termination.validator";
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
      return res.status(404).json({ message: "Termination not found" });
    }
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getTerminations = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, staff_id } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      staff_id?: number;
    };
    const scope = await resolveRecordScope(req, "termination");
    const result = await terminationService.listTerminations({ page, limit, search, staff_id }, scope);
    return res.status(200).json({ message: "Terminations fetched successfully", data: result.data, meta: result.meta });
  } catch (error) {
    return handleError(res, error, "GetTerminations error:");
  }
};

export const getTerminationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "termination");
    const record = await terminationService.getTerminationById(id, scope);
    return res.status(200).json({ message: "Termination fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetTerminationById error:");
  }
};

export const createTermination = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateTerminationInput;
    const record = await terminationService.createTermination(input);
    return res.status(201).json({ message: "Termination recorded successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateTermination error:");
  }
};

export const updateTermination = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateTerminationInput;
    const record = await terminationService.updateTermination(id, input);
    return res.status(200).json({ message: "Termination updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateTermination error:");
  }
};

export const deleteTermination = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await terminationService.deleteTermination(id);
    return res.status(200).json({ message: "Termination deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteTermination error:");
  }
};

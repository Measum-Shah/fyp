import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as yearService from "../services/year.service";
import { CreateYearInput, UpdateYearInput } from "../validators/year.validator";
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
      return res.status(409).json({ message: "A year with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Year not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getYears = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, status } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      status?: number;
    };

    const result = await yearService.listYears({ page, limit, search, status });

    return res.status(200).json({ message: "Years fetched successfully", data: result.data, meta: result.meta });
  } catch (error) {
    return handleError(res, error, "GetYears error:");
  }
};

// Active-only, unpaginated — feeds the Attendance Summary form's year dropdown.
export const getActiveYears = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await yearService.listActiveYears();
    return res.status(200).json({ message: "Years fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetActiveYears error:");
  }
};

export const getYearById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const record = await yearService.getYearById(id);
    return res.status(200).json({ message: "Year fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetYearById error:");
  }
};

export const createYear = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateYearInput;
    const record = await yearService.createYear(input, req.user?.id);
    return res.status(201).json({ message: "Year created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateYear error:");
  }
};

export const updateYear = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateYearInput;
    const record = await yearService.updateYear(id, input, req.user?.id);
    return res.status(200).json({ message: "Year updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateYear error:");
  }
};

export const setCurrentYear = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const record = await yearService.setCurrentYear(id, req.user?.id);
    return res.status(200).json({ message: `${record.title} was set as the current year`, data: record });
  } catch (error) {
    return handleError(res, error, "SetCurrentYear error:");
  }
};

export const deleteYear = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await yearService.deleteYear(id);
    return res.status(200).json({ message: "Year deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteYear error:");
  }
};

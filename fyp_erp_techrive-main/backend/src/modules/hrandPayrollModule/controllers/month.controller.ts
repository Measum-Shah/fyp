import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as monthService from "../services/month.service";
import { CreateMonthInput, UpdateMonthInput } from "../validators/month.validator";
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
      return res.status(409).json({ message: "A month with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Month not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getMonths = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, status } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      status?: number;
    };

    const result = await monthService.listMonths({ page, limit, search, status });

    return res.status(200).json({ message: "Months fetched successfully", data: result.data, meta: result.meta });
  } catch (error) {
    return handleError(res, error, "GetMonths error:");
  }
};

// Active-only, unpaginated — feeds the Attendance Summary form's month dropdown.
export const getActiveMonths = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await monthService.listActiveMonths();
    return res.status(200).json({ message: "Months fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetActiveMonths error:");
  }
};

export const getMonthById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const record = await monthService.getMonthById(id);
    return res.status(200).json({ message: "Month fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetMonthById error:");
  }
};

export const createMonth = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateMonthInput;
    const record = await monthService.createMonth(input, req.user?.id);
    return res.status(201).json({ message: "Month created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateMonth error:");
  }
};

export const updateMonth = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateMonthInput;
    const record = await monthService.updateMonth(id, input, req.user?.id);
    return res.status(200).json({ message: "Month updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateMonth error:");
  }
};

export const deleteMonth = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await monthService.deleteMonth(id);
    return res.status(200).json({ message: "Month deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteMonth error:");
  }
};

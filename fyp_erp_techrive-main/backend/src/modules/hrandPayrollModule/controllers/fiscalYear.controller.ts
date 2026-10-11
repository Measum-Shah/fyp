import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as fiscalYearService from "../services/fiscalYear.service";
import { CreateFiscalYearInput, UpdateFiscalYearInput } from "../validators/fiscalYear.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message, ...(error.details ? { errors: error.details } : {}) });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return res.status(409).json({ message: "A fiscal year with these details already exists" });
    if (error.code === "P2025") return res.status(404).json({ message: "Fiscal year not found" });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getFiscalYears = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, status } = req.query as unknown as {
      page: number; limit: number; search?: string; status?: number;
    };
    const result = await fiscalYearService.listFiscalYears({ page, limit, search, status });
    return res.status(200).json({ message: "Fiscal years fetched successfully", data: result.data, meta: result.meta });
  } catch (error) {
    return handleError(res, error, "GetFiscalYears error:");
  }
};

// GET /fiscal-years/lookup — MUST be registered before "/:id" in the router.
export const getFiscalYearLookup = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await fiscalYearService.listFiscalYearLookup();
    return res.status(200).json({ message: "Fiscal years fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetFiscalYearLookup error:");
  }
};

export const getFiscalYearById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const record = await fiscalYearService.getFiscalYearById(id);
    return res.status(200).json({ message: "Fiscal year fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetFiscalYearById error:");
  }
};

export const createFiscalYear = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateFiscalYearInput;
    const record = await fiscalYearService.createFiscalYear(input);
    return res.status(201).json({ message: "Fiscal year created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateFiscalYear error:");
  }
};

export const updateFiscalYear = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateFiscalYearInput;
    const record = await fiscalYearService.updateFiscalYear(id, input);
    return res.status(200).json({ message: "Fiscal year updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateFiscalYear error:");
  }
};

export const deleteFiscalYear = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await fiscalYearService.deleteFiscalYear(id);
    return res.status(200).json({ message: "Fiscal year deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteFiscalYear error:");
  }
};

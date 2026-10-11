import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as deductionFormulaService from "../services/payrollDeductionFormula.service";
import {
  CreateDeductionFormulaInput,
  UpdateDeductionFormulaInput,
} from "../validators/payrollDeductionFormula.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res
      .status(error.statusCode)
      .json({ message: error.message, ...(error.details ? { errors: error.details } : {}) });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return res.status(409).json({ message: "A deduction formula with these details already exists" });
    if (error.code === "P2025") return res.status(404).json({ message: "Deduction formula not found" });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getDeductionFormulas = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, status } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      status?: number;
    };
    const result = await deductionFormulaService.listDeductionFormulas({ page, limit, search, status });
    return res
      .status(200)
      .json({ message: "Deduction formulas fetched successfully", data: result.data, meta: result.meta });
  } catch (error) {
    return handleError(res, error, "GetDeductionFormulas error:");
  }
};

export const getDeductionFormulaById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const record = await deductionFormulaService.getDeductionFormulaById(id);
    return res.status(200).json({ message: "Deduction formula fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetDeductionFormulaById error:");
  }
};

export const createDeductionFormula = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateDeductionFormulaInput;
    const record = await deductionFormulaService.createDeductionFormula(input);
    return res.status(201).json({ message: "Deduction formula created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateDeductionFormula error:");
  }
};

export const updateDeductionFormula = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateDeductionFormulaInput;
    const record = await deductionFormulaService.updateDeductionFormula(id, input);
    return res.status(200).json({ message: "Deduction formula updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateDeductionFormula error:");
  }
};

export const deleteDeductionFormula = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await deductionFormulaService.deleteDeductionFormula(id);
    return res.status(200).json({ message: "Deduction formula deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteDeductionFormula error:");
  }
};

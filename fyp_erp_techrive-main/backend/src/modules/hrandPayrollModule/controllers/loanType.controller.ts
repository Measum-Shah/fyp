import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as loanTypeService from "../services/loanType.service";
import { CreateLoanTypeInput, UpdateLoanTypeInput } from "../validators/loanType.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRoleBranchIds } from "../utils/branch-scope.util";

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A loan type with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Loan type not found" });
    }
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getLoanTypes = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search } = req.query as unknown as { page: number; limit: number; search?: string };
    const branchIds = await resolveRoleBranchIds(req);
    const result = await loanTypeService.listLoanTypes({ page, limit, search }, branchIds);
    return res.status(200).json({ message: "Loan types fetched successfully", data: result.data, meta: result.meta });
  } catch (error) {
    return handleError(res, error, "GetLoanTypes error:");
  }
};

// GET /loan-types/lookup — MUST be registered before "/:id" in the router.
export const getLoanTypeLookup = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await loanTypeService.listLoanTypeLookup();
    return res.status(200).json({ message: "Loan types fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetLoanTypeLookup error:");
  }
};

export const getLoanTypeById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const branchIds = await resolveRoleBranchIds(req);
    const record = await loanTypeService.getLoanTypeById(id, branchIds);
    return res.status(200).json({ message: "Loan type fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetLoanTypeById error:");
  }
};

export const createLoanType = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateLoanTypeInput;
    const record = await loanTypeService.createLoanType(input);
    return res.status(201).json({ message: "Loan type created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateLoanType error:");
  }
};

export const updateLoanType = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateLoanTypeInput;
    const record = await loanTypeService.updateLoanType(id, input);
    return res.status(200).json({ message: "Loan type updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateLoanType error:");
  }
};

export const deleteLoanType = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await loanTypeService.deleteLoanType(id);
    return res.status(200).json({ message: "Loan type deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteLoanType error:");
  }
};

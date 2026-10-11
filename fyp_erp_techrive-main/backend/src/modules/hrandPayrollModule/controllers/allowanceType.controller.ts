import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as allowanceTypeService from "../services/allowanceType.service";
import { CreateAllowanceTypeInput, UpdateAllowanceTypeInput } from "../validators/allowanceType.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message, ...(error.details ? { errors: error.details } : {}) });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return res.status(409).json({ message: "An allowance type with these details already exists" });
    if (error.code === "P2025") return res.status(404).json({ message: "Allowance type not found" });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getAllowanceTypes = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, status } = req.query as unknown as {
      page: number; limit: number; search?: string; status?: number;
    };
    const result = await allowanceTypeService.listAllowanceTypes({ page, limit, search, status });
    return res.status(200).json({ message: "Allowance types fetched successfully", data: result.data, meta: result.meta });
  } catch (error) {
    return handleError(res, error, "GetAllowanceTypes error:");
  }
};

// GET /allowance-types/lookup — MUST be registered before "/:id" in the router.
export const getAllowanceTypeLookup = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await allowanceTypeService.listAllowanceTypeLookup();
    return res.status(200).json({ message: "Allowance types fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetAllowanceTypeLookup error:");
  }
};

export const getAllowanceTypeById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const record = await allowanceTypeService.getAllowanceTypeById(id);
    return res.status(200).json({ message: "Allowance type fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetAllowanceTypeById error:");
  }
};

export const createAllowanceType = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateAllowanceTypeInput;
    const record = await allowanceTypeService.createAllowanceType(input);
    return res.status(201).json({ message: "Allowance type created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateAllowanceType error:");
  }
};

export const updateAllowanceType = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateAllowanceTypeInput;
    const record = await allowanceTypeService.updateAllowanceType(id, input);
    return res.status(200).json({ message: "Allowance type updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateAllowanceType error:");
  }
};

export const deleteAllowanceType = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await allowanceTypeService.deleteAllowanceType(id);
    return res.status(200).json({ message: "Allowance type deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteAllowanceType error:");
  }
};

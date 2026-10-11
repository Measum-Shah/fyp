import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as familyService from "../services/family.service";
import { CreateFamilyInput, UpdateFamilyInput } from "../validators/family.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRecordScope } from "../utils/record-scope.util";

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message, ...(error.details ? { errors: error.details } : {}) });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return res.status(404).json({ message: "Family record not found" });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getFamilies = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, staff_id } = req.query as unknown as { page: number; limit: number; search?: string; staff_id?: number };
    const scope = await resolveRecordScope(req, "family");
    const result = await familyService.listFamilies({ page, limit, search, staff_id }, scope);
    return res.status(200).json({ message: "Family records fetched successfully", data: result.data, meta: result.meta });
  } catch (error) {
    return handleError(res, error, "GetFamilies error:");
  }
};

export const getFamilyById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "family");
    const record = await familyService.getFamilyById(id, scope);
    return res.status(200).json({ message: "Family record fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetFamilyById error:");
  }
};

export const createFamily = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateFamilyInput;
    const record = await familyService.createFamily(input);
    return res.status(201).json({ message: "Family record created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateFamily error:");
  }
};

export const updateFamily = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateFamilyInput;
    const record = await familyService.updateFamily(id, input);
    return res.status(200).json({ message: "Family record updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateFamily error:");
  }
};

export const deleteFamily = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await familyService.deleteFamily(id);
    return res.status(200).json({ message: "Family record deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteFamily error:");
  }
};

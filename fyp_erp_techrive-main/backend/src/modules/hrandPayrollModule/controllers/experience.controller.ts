import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as experienceService from "../services/experience.service";
import { CreateExperienceInput, UpdateExperienceInput } from "../validators/experience.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRecordScope } from "../utils/record-scope.util";

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message, ...(error.details ? { errors: error.details } : {}) });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return res.status(404).json({ message: "Experience record not found" });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getExperiences = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, staff_id } = req.query as unknown as { page: number; limit: number; search?: string; staff_id?: number };
    const scope = await resolveRecordScope(req, "experience");
    const result = await experienceService.listExperiences({ page, limit, search, staff_id }, scope);
    return res.status(200).json({ message: "Experience records fetched successfully", data: result.data, meta: result.meta });
  } catch (error) {
    return handleError(res, error, "GetExperiences error:");
  }
};

export const getExperienceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "experience");
    const record = await experienceService.getExperienceById(id, scope);
    return res.status(200).json({ message: "Experience record fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetExperienceById error:");
  }
};

export const createExperience = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateExperienceInput;
    const record = await experienceService.createExperience(input);
    return res.status(201).json({ message: "Experience record created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateExperience error:");
  }
};

export const updateExperience = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateExperienceInput;
    const record = await experienceService.updateExperience(id, input);
    return res.status(200).json({ message: "Experience record updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateExperience error:");
  }
};

export const deleteExperience = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await experienceService.deleteExperience(id);
    return res.status(200).json({ message: "Experience record deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteExperience error:");
  }
};

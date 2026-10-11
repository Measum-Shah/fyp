import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as emergencyContactService from "../services/emergencyContact.service";
import { CreateEmergencyContactInput, UpdateEmergencyContactInput } from "../validators/emergencyContact.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRecordScope } from "../utils/record-scope.util";

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({ message: error.message, ...(error.details ? { errors: error.details } : {}) });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return res.status(404).json({ message: "Emergency contact not found" });
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getEmergencyContacts = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, staff_id } = req.query as unknown as { page: number; limit: number; search?: string; staff_id?: number };
    const scope = await resolveRecordScope(req, "emergency_contact");
    const result = await emergencyContactService.listEmergencyContacts({ page, limit, search, staff_id }, scope);
    return res.status(200).json({ message: "Emergency contacts fetched successfully", data: result.data, meta: result.meta });
  } catch (error) {
    return handleError(res, error, "GetEmergencyContacts error:");
  }
};

export const getEmergencyContactById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "emergency_contact");
    const record = await emergencyContactService.getEmergencyContactById(id, scope);
    return res.status(200).json({ message: "Emergency contact fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetEmergencyContactById error:");
  }
};

export const createEmergencyContact = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateEmergencyContactInput;
    const record = await emergencyContactService.createEmergencyContact(input);
    return res.status(201).json({ message: "Emergency contact created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateEmergencyContact error:");
  }
};

export const updateEmergencyContact = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateEmergencyContactInput;
    const record = await emergencyContactService.updateEmergencyContact(id, input);
    return res.status(200).json({ message: "Emergency contact updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateEmergencyContact error:");
  }
};

export const deleteEmergencyContact = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await emergencyContactService.deleteEmergencyContact(id);
    return res.status(200).json({ message: "Emergency contact deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteEmergencyContact error:");
  }
};

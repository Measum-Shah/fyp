import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as eobiService from "../services/eobi.service";
import { CreateEobiEntryInput, UpdateEobiEntryInput } from "../validators/eobi.validator";
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
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A register entry with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Register entry not found" });
    }
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getEobiEntries = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, staff_id, branch_id, company_id, status } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      staff_id?: number;
      branch_id?: number;
      company_id?: number;
      status?: string;
    };

    const scope = await resolveRecordScope(req, "eobi");
    const result = await eobiService.listEobiEntries({ page, limit, search, staff_id, branch_id, company_id, status }, scope);

    return res.status(200).json({ message: "Register entries fetched successfully", data: result.data, meta: result.meta });
  } catch (error) {
    return handleError(res, error, "GetEobiEntries error:");
  }
};

export const getEobiEntryById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "eobi");
    const record = await eobiService.getEobiEntryById(id, scope);
    return res.status(200).json({ message: "Register entry fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetEobiEntryById error:");
  }
};

export const createEobiEntry = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateEobiEntryInput;
    const record = await eobiService.createEobiEntry(input);
    return res.status(201).json({ message: "Register entry created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateEobiEntry error:");
  }
};

export const updateEobiEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateEobiEntryInput;
    const record = await eobiService.updateEobiEntry(id, input);
    return res.status(200).json({ message: "Register entry updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateEobiEntry error:");
  }
};

export const deleteEobiEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await eobiService.deleteEobiEntry(id);
    return res.status(200).json({ message: "Register entry deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteEobiEntry error:");
  }
};
import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as resignationService from "../services/resignation.service";
import {
  CreateResignationInput,
  UpdateResignationApprovalInput,
  UpdateResignationInput,
} from "../validators/resignation.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRecordScope } from "../utils/record-scope.util";
import { RESIGNATION_EXPERIENCE_LETTER_UPLOAD_SUBDIR } from "../constants/resignation.constants";
import { toPublicUploadPath } from "../middlewares/upload.middleware";

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Resignation not found" });
    }
  }
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getResignations = async (req: AuthRequest, res: Response) => {
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
    const scope = await resolveRecordScope(req, "resignation");
    const result = await resignationService.listResignations({ page, limit, search, staff_id, branch_id, company_id, status }, scope);
    return res.status(200).json({ message: "Resignations fetched successfully", data: result.data, meta: result.meta });
  } catch (error) {
    return handleError(res, error, "GetResignations error:");
  }
};

export const getResignationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const record = await resignationService.getResignationById(id);
    return res.status(200).json({ message: "Resignation fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetResignationById error:");
  }
};

export const createResignation = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateResignationInput;
    const record = await resignationService.createResignation(input);
    return res.status(201).json({ message: "Resignation created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateResignation error:");
  }
};

export const updateResignation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateResignationInput;
    const record = await resignationService.updateResignation(id, input);
    return res.status(200).json({ message: "Resignation updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateResignation error:");
  }
};

export const updateResignationApproval = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateResignationApprovalInput;
    const record = await resignationService.updateResignationApproval(id, input);
    return res.status(200).json({ message: "Approval status updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateResignationApproval error:");
  }
};

export const deleteResignation = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await resignationService.deleteResignation(id);
    return res.status(200).json({ message: "Resignation deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteResignation error:");
  }
};

// Mirrors staffQualification.controller.ts#uploadStaffQualificationAttachment
// — the multer middleware (see resignation.routes.ts) has already validated
// type/size and written the file to disk by the time this runs; this just
// hands back the public path to store on the resignation record.
export const uploadResignationExperienceLetter = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file was uploaded" });
    }

    const experience_letter = toPublicUploadPath(RESIGNATION_EXPERIENCE_LETTER_UPLOAD_SUBDIR, req.file.filename);

    return res.status(201).json({
      message: "Experience letter uploaded successfully",
      data: { experience_letter },
    });
  } catch (error) {
    return handleError(res, error, "UploadResignationExperienceLetter error:");
  }
};
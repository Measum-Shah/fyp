import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as staffQualificationService from "../services/staffQualification.service";
import {
  CreateStaffQualificationInput,
  UpdateStaffQualificationInput,
} from "../validators/staffQualification.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRecordScope } from "../utils/record-scope.util";
import { STAFF_QUALIFICATION_UPLOAD_SUBDIR } from "../constants/staffQualification.constants";
import { toPublicUploadPath } from "../middlewares/upload.middleware";

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A qualification with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Qualification not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getStaffQualifications = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, staff_id, status } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      staff_id?: number;
      status?: number;
    };

    const scope = await resolveRecordScope(req, "staff_qualification");
    const result = await staffQualificationService.listStaffQualifications(
      {
        page,
        limit,
        search,
        staff_id,
        status,
      },
      scope
    );

    return res.status(200).json({
      message: "Qualifications fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetStaffQualifications error:");
  }
};

export const getStaffQualificationById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "staff_qualification");
    const record = await staffQualificationService.getStaffQualificationById(id, scope);

    return res.status(200).json({ message: "Qualification fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetStaffQualificationById error:");
  }
};

export const createStaffQualification = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateStaffQualificationInput;
    const record = await staffQualificationService.createStaffQualification(input, req.user?.id);

    return res.status(201).json({ message: "Qualification added successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateStaffQualification error:");
  }
};

export const updateStaffQualification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateStaffQualificationInput;

    const record = await staffQualificationService.updateStaffQualification(id, input, req.user?.id);

    return res.status(200).json({ message: "Qualification updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateStaffQualification error:");
  }
};

export const deleteStaffQualification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await staffQualificationService.deleteStaffQualification(id, req.user?.id);

    return res.status(200).json({ message: "Qualification deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteStaffQualification error:");
  }
};

// ─── Upload a qualification attachment (degree/certificate scan, etc.) ────────
// Standalone endpoint: the file is uploaded first, the returned public path
// is then sent as the `attachment` field on the normal create/update JSON
// request. Keeps the create/update payloads plain JSON (matching every
// other module in this codebase) instead of mixing multipart everywhere.
export const uploadStaffQualificationAttachment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file was uploaded" });
    }

    const attachment = toPublicUploadPath(STAFF_QUALIFICATION_UPLOAD_SUBDIR, req.file.filename);

    return res.status(201).json({
      message: "Attachment uploaded successfully",
      data: { attachment },
    });
  } catch (error) {
    return handleError(res, error, "UploadStaffQualificationAttachment error:");
  }
};
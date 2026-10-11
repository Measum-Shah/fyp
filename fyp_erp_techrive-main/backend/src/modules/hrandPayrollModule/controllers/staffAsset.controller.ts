import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as staffAssetService from "../services/staffAsset.service";
import { CreateStaffAssetInput, UpdateStaffAssetInput } from "../validators/staffAsset.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRecordScope } from "../utils/record-scope.util";
import { STAFF_ASSET_UPLOAD_SUBDIR } from "../constants/staffAsset.constants";
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
      return res.status(409).json({ message: "An asset record with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Asset record not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getStaffAssets = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, staff_id, status } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      staff_id?: number;
      status?: number;
    };

    const scope = await resolveRecordScope(req, "staff_asset");
    const result = await staffAssetService.listStaffAssets({ page, limit, search, staff_id, status }, scope);

    return res.status(200).json({
      message: "Assets fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetStaffAssets error:");
  }
};

export const getStaffAssetById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "staff_asset");
    const record = await staffAssetService.getStaffAssetById(id, scope);

    return res.status(200).json({ message: "Asset fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetStaffAssetById error:");
  }
};

export const createStaffAsset = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateStaffAssetInput;
    const record = await staffAssetService.createStaffAsset(input, req.user?.id);

    return res.status(201).json({ message: "Asset added successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateStaffAsset error:");
  }
};

export const updateStaffAsset = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateStaffAssetInput;

    const record = await staffAssetService.updateStaffAsset(id, input, req.user?.id);

    return res.status(200).json({ message: "Asset updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateStaffAsset error:");
  }
};

export const deleteStaffAsset = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await staffAssetService.deleteStaffAsset(id, req.user?.id);

    return res.status(200).json({ message: "Asset deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteStaffAsset error:");
  }
};

// ─── Upload an asset attachment (proof-of-issue photo, receipt, etc.) ─────────
// Same pattern as uploadStaffQualificationAttachment: upload the file first,
// then send the returned public path as `attachment` on the plain-JSON
// create/update request.
export const uploadStaffAssetAttachment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file was uploaded" });
    }

    const attachment = toPublicUploadPath(STAFF_ASSET_UPLOAD_SUBDIR, req.file.filename);

    return res.status(201).json({
      message: "Attachment uploaded successfully",
      data: { attachment },
    });
  } catch (error) {
    return handleError(res, error, "UploadStaffAssetAttachment error:");
  }
};
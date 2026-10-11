import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as biometricDeviceService from "../services/biometricDevice.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";

// ─── Shared error responder ──────────────────────────────────────────────────
// Mirrors attendance.controller.ts's/branch.controller.ts's handleError.
const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Campus not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── POST /biometric/branches/:branchId/test-connection ─────────────────────
export const testDeviceConnection = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId } = req.params as unknown as { branchId: number };
    const info = await biometricDeviceService.testDeviceConnection(branchId);

    return res.status(200).json({ message: "Device connected successfully", data: info });
  } catch (error) {
    return handleError(res, error, "TestDeviceConnection error:");
  }
};

// ─── POST /biometric/branches/:branchId/clear-device ─────────────────────────
export const clearDevice = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId } = req.params as unknown as { branchId: number };
    await biometricDeviceService.clearDevice(branchId);

    return res.status(200).json({ message: "Device users and attendance log cleared successfully" });
  } catch (error) {
    return handleError(res, error, "ClearDevice error:");
  }
};

// ─── POST /biometric/branches/:branchId/upload-staff ─────────────────────────
export const uploadStaffToDevice = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId } = req.params as unknown as { branchId: number };
    const result = await biometricDeviceService.uploadStaffToDevice(branchId);

    return res.status(200).json({
      message: `Staff added successfully! Uploaded ${result.uploaded} of ${result.total}.`,
      data: result,
    });
  } catch (error) {
    return handleError(res, error, "UploadStaffToDevice error:");
  }
};

// ─── POST /biometric/branches/:branchId/sync-attendance ─────────────────────
export const syncAttendanceFromDevice = async (req: AuthRequest, res: Response) => {
  try {
    const { branchId } = req.params as unknown as { branchId: number };
    const result = await biometricDeviceService.syncAttendanceFromDevice(branchId, req.user?.id);

    return res.status(200).json({ message: result.message, data: result });
  } catch (error) {
    return handleError(res, error, "SyncAttendanceFromDevice error:");
  }
};
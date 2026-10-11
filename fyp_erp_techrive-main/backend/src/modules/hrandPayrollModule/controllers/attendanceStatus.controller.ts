import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as attendanceStatusService from "../services/attendanceStatus.service";
import {
  CreateAttendanceStatusInput,
  UpdateAttendanceStatusInput,
} from "../validators/attendanceStatus.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";

// ─── Shared error responder ──────────────────────────────────────────────────
const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "An attendance status with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Attendance status not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /attendance-statuses ─────────────────────────────────────────────────
export const getAttendanceStatuses = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, status } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      status?: number;
    };

    const result = await attendanceStatusService.listAttendanceStatuses({ page, limit, search, status });

    return res.status(200).json({
      message: "Attendance statuses fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetAttendanceStatuses error:");
  }
};

// ─── GET /attendance-statuses/lookup ─────────────────────────────────────────
// Active-only, unpaginated — feeds the Attendance form's status dropdown.
export const getActiveAttendanceStatuses = async (_req: AuthRequest, res: Response) => {
  try {
    const data = await attendanceStatusService.listActiveAttendanceStatuses();
    return res.status(200).json({ message: "Attendance statuses fetched successfully", data });
  } catch (error) {
    return handleError(res, error, "GetActiveAttendanceStatuses error:");
  }
};

// ─── GET /attendance-statuses/:id ──────────────────────────────────────────────
export const getAttendanceStatusById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const record = await attendanceStatusService.getAttendanceStatusById(id);

    return res.status(200).json({ message: "Attendance status fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetAttendanceStatusById error:");
  }
};

// ─── POST /attendance-statuses ─────────────────────────────────────────────────
export const createAttendanceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateAttendanceStatusInput;
    const record = await attendanceStatusService.createAttendanceStatus(input, req.user?.id);

    return res.status(201).json({ message: "Attendance status created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateAttendanceStatus error:");
  }
};

// ─── PUT /attendance-statuses/:id ────────────────────────────────────────────────
export const updateAttendanceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateAttendanceStatusInput;

    const record = await attendanceStatusService.updateAttendanceStatus(id, input, req.user?.id);

    return res.status(200).json({ message: "Attendance status updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateAttendanceStatus error:");
  }
};

// ─── DELETE /attendance-statuses/:id ──────────────────────────────────────────────
export const deleteAttendanceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await attendanceStatusService.deleteAttendanceStatus(id);

    return res.status(200).json({ message: "Attendance status deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteAttendanceStatus error:");
  }
};
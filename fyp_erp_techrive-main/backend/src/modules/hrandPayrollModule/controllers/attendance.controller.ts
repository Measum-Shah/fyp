import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as attendanceService from "../services/attendance.service";
import {
  CreateAttendanceInput,
  ReviewAttendanceInput,
  UpdateAttendanceInput,
} from "../validators/attendance.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRecordScope } from "../utils/record-scope.util";

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
      return res.status(409).json({ message: "An attendance record with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Attendance record not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /attendance ──────────────────────────────────────────────────────────
export const getAttendanceRecords = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, employee_id, branch_id, company_id, status, start_date, end_date } = req.query as unknown as {
      page: number;
      limit: number;
      employee_id?: number;
      branch_id?: number;
      company_id?: number;
      status?: number;
      start_date?: string;
      end_date?: string;
    };

    const scope = await resolveRecordScope(req, "attendance");
    const result = await attendanceService.listAttendance(
      {
        page,
        limit,
        employee_id,
        branch_id,
        company_id,
        status,
        start_date,
        end_date,
      },
      scope
    );

    return res.status(200).json({
      message: "Attendance records fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetAttendanceRecords error:");
  }
};

// ─── GET /attendance/:id ───────────────────────────────────────────────────────
export const getAttendanceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "attendance");
    const record = await attendanceService.getAttendanceById(id, scope);

    return res.status(200).json({ message: "Attendance record fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetAttendanceById error:");
  }
};

// ─── POST /attendance ─────────────────────────────────────────────────────────
export const createAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateAttendanceInput;
    const record = await attendanceService.createAttendance(input, req.user?.id);

    return res.status(201).json({ message: "Attendance record created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateAttendance error:");
  }
};

// ─── PUT /attendance/:id ────────────────────────────────────────────────────────
export const updateAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateAttendanceInput;

    const record = await attendanceService.updateAttendance(id, input, req.user?.id);

    return res.status(200).json({ message: "Attendance record updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateAttendance error:");
  }
};

// ─── PATCH /attendance/:id/review-status ─────────────────────────────────────
export const setAttendanceReviewStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const { reviewed } = req.body as ReviewAttendanceInput;

    const record = await attendanceService.setAttendanceReviewStatus(id, reviewed, req.user?.id);

    return res.status(200).json({
      message: reviewed ? "Attendance record marked as reviewed" : "Attendance record marked as unreviewed",
      data: record,
    });
  } catch (error) {
    return handleError(res, error, "SetAttendanceReviewStatus error:");
  }
};

// ─── DELETE /attendance/:id ──────────────────────────────────────────────────────
export const deleteAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await attendanceService.deleteAttendance(id, req.user?.id);

    return res.status(200).json({ message: "Attendance record deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteAttendance error:");
  }
};
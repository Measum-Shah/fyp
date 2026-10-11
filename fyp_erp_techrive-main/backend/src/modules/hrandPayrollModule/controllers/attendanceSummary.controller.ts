import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as attendanceSummaryService from "../services/attendanceSummary.service";
import {
  CreateAttendanceSummaryInput,
  SetApprovalInput,
  UpdateAttendanceSummaryInput,
} from "../validators/attendanceSummary.validator";
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
      return res.status(409).json({ message: "An attendance summary with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Attendance summary not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

export const getAttendanceSummaries = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, staff_id, branch_id, company_id, month_id, year_id, pay_status, approved_status } =
      req.query as unknown as {
        page: number;
        limit: number;
        staff_id?: number;
        branch_id?: number;
        company_id?: number;
        month_id?: number;
        year_id?: number;
        pay_status?: string;
        approved_status?: string;
      };

    const scope = await resolveRecordScope(req, "attendance_summary");
    const result = await attendanceSummaryService.listAttendanceSummaries(
      {
        page,
        limit,
        staff_id,
        branch_id,
        company_id,
        month_id,
        year_id,
        pay_status,
        approved_status,
      },
      scope
    );

    return res.status(200).json({
      message: "Attendance summaries fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetAttendanceSummaries error:");
  }
};

export const getAttendanceSummaryById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "attendance_summary");
    const record = await attendanceSummaryService.getAttendanceSummaryById(id, scope);
    return res.status(200).json({ message: "Attendance summary fetched successfully", data: record });
  } catch (error) {
    return handleError(res, error, "GetAttendanceSummaryById error:");
  }
};

export const getAttendanceSummaryDetail = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "attendance_summary");
    const detail = await attendanceSummaryService.getAttendanceSummaryDetail(id, scope);
    return res.status(200).json({ message: "Attendance summary detail fetched successfully", data: detail });
  } catch (error) {
    return handleError(res, error, "GetAttendanceSummaryDetail error:");
  }
};

export const createAttendanceSummary = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateAttendanceSummaryInput;
    const record = await attendanceSummaryService.createAttendanceSummary(input, req.user?.id);
    return res.status(201).json({ message: "Attendance summary created successfully", data: record });
  } catch (error) {
    return handleError(res, error, "CreateAttendanceSummary error:");
  }
};

export const updateAttendanceSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateAttendanceSummaryInput;
    const record = await attendanceSummaryService.updateAttendanceSummary(id, input, req.user?.id);
    return res.status(200).json({ message: "Attendance summary updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "UpdateAttendanceSummary error:");
  }
};

export const setAttendanceSummaryApproval = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as SetApprovalInput;
    const record = await attendanceSummaryService.setAttendanceSummaryApproval(id, input, req.user?.id);
    return res.status(200).json({ message: "Attendance summary approval updated successfully", data: record });
  } catch (error) {
    return handleError(res, error, "SetAttendanceSummaryApproval error:");
  }
};

export const deleteAttendanceSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await attendanceSummaryService.deleteAttendanceSummary(id);
    return res.status(200).json({ message: "Attendance summary deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteAttendanceSummary error:");
  }
};

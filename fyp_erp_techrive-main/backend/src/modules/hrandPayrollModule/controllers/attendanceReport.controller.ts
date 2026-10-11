import { Request, Response } from "express";
import * as attendanceReportService from "../services/attendanceReport.service";
import {
  AttendanceRecordsReportQuery,
  AttendanceSummaryReportQuery,
} from "../validators/attendanceReport.validator";

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /reports/attendance-records ────────────────────────────────────────
export const getAttendanceRecordsReport = async (req: Request, res: Response) => {
  try {
    const query = req.query as unknown as AttendanceRecordsReportQuery;
    const result = await attendanceReportService.getAttendanceRecordsReport(query);

    return res.status(200).json({
      message: "Attendance records report generated successfully",
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
      },
    });
  } catch (error) {
    return handleError(res, error, "GetAttendanceRecordsReport error:");
  }
};

// ─── GET /reports/attendance-summary ────────────────────────────────────────
export const getAttendanceSummaryReport = async (req: Request, res: Response) => {
  try {
    const query = req.query as unknown as AttendanceSummaryReportQuery;
    const result = await attendanceReportService.getAttendanceSummaryReport(query);

    return res.status(200).json({
      message: "Attendance summary report generated successfully",
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
      },
    });
  } catch (error) {
    return handleError(res, error, "GetAttendanceSummaryReport error:");
  }
};

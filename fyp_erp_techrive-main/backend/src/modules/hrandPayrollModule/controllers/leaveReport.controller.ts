import { Request, Response } from "express";
import * as leaveReportService from "../services/leaveReport.service";
import { LeaveBalancesReportQuery, LeaveRequestsReportQuery } from "../validators/leaveReport.validator";

const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /reports/leave-requests ────────────────────────────────────────────
export const getLeaveRequestsReport = async (req: Request, res: Response) => {
  try {
    const query = req.query as unknown as LeaveRequestsReportQuery;
    const result = await leaveReportService.getLeaveRequestsReport(query);

    return res.status(200).json({
      message: "Leave requests report generated successfully",
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
      },
    });
  } catch (error) {
    return handleError(res, error, "GetLeaveRequestsReport error:");
  }
};

// ─── GET /reports/leave-balances ────────────────────────────────────────────
export const getLeaveBalancesReport = async (req: Request, res: Response) => {
  try {
    const query = req.query as unknown as LeaveBalancesReportQuery;
    const result = await leaveReportService.getLeaveBalancesReport(query);

    return res.status(200).json({
      message: "Leave balances report generated successfully",
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
      },
    });
  } catch (error) {
    return handleError(res, error, "GetLeaveBalancesReport error:");
  }
};

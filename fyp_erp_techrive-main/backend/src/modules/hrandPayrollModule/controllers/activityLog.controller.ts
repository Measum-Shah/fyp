import { Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import * as activityLogService from "../services/activityLog.service";
import { ListActivityLogsQuery } from "../validators/activityLog.validator";

// ─── Shared error responder ──────────────────────────────────────────────────
// Read-only feature, same reasoning as report.controller.ts's handleError —
// no AppError/P2002/P2025 path expected here.
const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /activity-logs ─────────────────────────────────────────────────────
export const getActivityLogs = async (req: AuthRequest, res: Response) => {
  try {
    const query = req.query as unknown as ListActivityLogsQuery;

    const result = await activityLogService.listActivityLogs({
      page: query.page,
      limit: query.limit,
      userId: query.user_id,
      module: query.module,
      action: query.action,
      recordType: query.record_type,
      recordId: query.record_id,
      dateFrom: query.date_from,
      dateTo: query.date_to,
      search: query.search,
    });

    return res.status(200).json({
      message: "Activity logs fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetActivityLogs error:");
  }
};

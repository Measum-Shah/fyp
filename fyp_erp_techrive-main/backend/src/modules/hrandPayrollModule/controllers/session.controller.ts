import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import * as sessionService from "../services/session.service";
import { ListSessionsQuery } from "../validators/session.validator";

// ─── Shared error responder — mirrors designation.controller.ts's handleError ──
const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return res.status(404).json({ message: "Session not found" });
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /sessions ─────────────────────────────────────────────────────────
export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const query = req.query as unknown as ListSessionsQuery;

    const result = await sessionService.listSessions({
      page: query.page,
      limit: query.limit,
      userId: query.user_id,
      isActive: query.is_active,
      loginStatus: query.login_status,
      search: query.search,
    });

    return res.status(200).json({
      message: "Sessions fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetSessions error:");
  }
};

// ─── GET /sessions/summary — active/online counts for a dashboard widget ──
export const getSessionsSummary = async (_req: AuthRequest, res: Response) => {
  try {
    const summary = await sessionService.getActiveSessionsSummary();

    return res.status(200).json({
      message: "Session summary fetched successfully",
      data: summary,
    });
  } catch (error) {
    return handleError(res, error, "GetSessionsSummary error:");
  }
};

// ─── PATCH /sessions/:id/force-logout ──────────────────────────────────────
export const forceLogoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const session = await sessionService.forceLogoutSession(id, req.user?.id);

    return res.status(200).json({
      message: "Session ended successfully",
      data: session,
    });
  } catch (error) {
    return handleError(res, error, "ForceLogoutSession error:");
  }
};

import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as holidayService from "../services/holiday.service";
import { CreateHolidayInput, UpdateHolidayInput } from "../validators/holiday.validator";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { resolveRoleBranchIds } from "../utils/branch-scope.util";

// ─── Shared error responder ──────────────────────────────────────────────────
// Mirrors branch.controller.ts's/workShift.controller.ts's handleError.
const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      ...(error.details ? { errors: error.details } : {}),
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ message: "A holiday with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Holiday not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /holidays ────────────────────────────────────────────────────────────
export const getHolidays = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, search, year } = req.query as unknown as {
      page: number;
      limit: number;
      search?: string;
      year?: number;
    };

    const branchIds = await resolveRoleBranchIds(req);
    const result = await holidayService.listHolidays({ page, limit, search, year }, branchIds);

    return res.status(200).json({
      message: "Holidays fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetHolidays error:");
  }
};

// ─── GET /holidays/:id ─────────────────────────────────────────────────────────
export const getHolidayById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const branchIds = await resolveRoleBranchIds(req);
    const holiday = await holidayService.getHolidayById(id, branchIds);

    return res.status(200).json({ message: "Holiday fetched successfully", data: holiday });
  } catch (error) {
    return handleError(res, error, "GetHolidayById error:");
  }
};

// ─── POST /holidays ───────────────────────────────────────────────────────────
export const createHoliday = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateHolidayInput;
    const holiday = await holidayService.createHoliday(input, req.user?.id);

    return res.status(201).json({ message: "Holiday created successfully", data: holiday });
  } catch (error) {
    return handleError(res, error, "CreateHoliday error:");
  }
};

// ─── PUT /holidays/:id ──────────────────────────────────────────────────────────
export const updateHoliday = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateHolidayInput;

    const holiday = await holidayService.updateHoliday(id, input, req.user?.id);

    return res.status(200).json({ message: "Holiday updated successfully", data: holiday });
  } catch (error) {
    return handleError(res, error, "UpdateHoliday error:");
  }
};

// ─── DELETE /holidays/:id ─────────────────────────────────────────────────────────
export const deleteHoliday = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await holidayService.deleteHoliday(id);

    return res.status(200).json({ message: "Holiday deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteHoliday error:");
  }
};
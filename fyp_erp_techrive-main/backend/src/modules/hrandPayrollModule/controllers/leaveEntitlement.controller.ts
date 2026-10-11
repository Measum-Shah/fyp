import { Response } from "express";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import * as leaveEntitlementService from "../services/leaveEntitlement.service";
import {
  CreateLeaveEntitlementInput,
  UpdateLeaveEntitlementInput,
} from "../validators/leaveEntitlement.validator";
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
      return res
        .status(409)
        .json({ message: "A leave entitlement with these details already exists" });
    }
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Leave entitlement not found" });
    }
  }

  console.error(fallbackMessage, error);
  return res.status(500).json({ message: "Internal server error" });
};

// ─── GET /leave-entitlements ──────────────────────────────────────────────────
export const getLeaveEntitlements = async (req: AuthRequest, res: Response) => {
  try {
    const { page, limit, employee_id, leave_type_id, status } = req.query as unknown as {
      page: number;
      limit: number;
      employee_id?: number;
      leave_type_id?: number;
      status?: number;
    };

    const scope = await resolveRecordScope(req, "leave_entitlement");
    const result = await leaveEntitlementService.listLeaveEntitlements(
      {
        page,
        limit,
        employee_id,
        leave_type_id,
        status,
      },
      scope
    );

    return res.status(200).json({
      message: "Leave entitlements fetched successfully",
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    return handleError(res, error, "GetLeaveEntitlements error:");
  }
};

// ─── GET /leave-entitlements/:id ──────────────────────────────────────────────
export const getLeaveEntitlementById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const scope = await resolveRecordScope(req, "leave_entitlement");
    const entitlement = await leaveEntitlementService.getLeaveEntitlementById(id, scope);

    return res
      .status(200)
      .json({ message: "Leave entitlement fetched successfully", data: entitlement });
  } catch (error) {
    return handleError(res, error, "GetLeaveEntitlementById error:");
  }
};

// ─── POST /leave-entitlements ─────────────────────────────────────────────────
export const createLeaveEntitlement = async (req: AuthRequest, res: Response) => {
  try {
    const input = req.body as CreateLeaveEntitlementInput;
    const entitlement = await leaveEntitlementService.createLeaveEntitlement(
      input,
      req.user?.id
    );

    return res
      .status(201)
      .json({ message: "Leave entitlement created successfully", data: entitlement });
  } catch (error) {
    return handleError(res, error, "CreateLeaveEntitlement error:");
  }
};

// ─── PUT /leave-entitlements/:id ──────────────────────────────────────────────
export const updateLeaveEntitlement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    const input = req.body as UpdateLeaveEntitlementInput;

    const entitlement = await leaveEntitlementService.updateLeaveEntitlement(
      id,
      input,
      req.user?.id
    );

    return res
      .status(200)
      .json({ message: "Leave entitlement updated successfully", data: entitlement });
  } catch (error) {
    return handleError(res, error, "UpdateLeaveEntitlement error:");
  }
};

// ─── DELETE /leave-entitlements/:id ───────────────────────────────────────────
export const deleteLeaveEntitlement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params as unknown as { id: number };
    await leaveEntitlementService.deleteLeaveEntitlement(id, req.user?.id);

    return res.status(200).json({ message: "Leave entitlement deleted successfully" });
  } catch (error) {
    return handleError(res, error, "DeleteLeaveEntitlement error:");
  }
};
import { Response, NextFunction } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { AppError } from "../utils/fee.helpers";
import type { FeeCapability } from "../constants/feeAccess.constants";
import {
  actorHasCapability,
  assertBasicBelongsToScopedStudent,
  assertStudentScope,
  logUnauthorizedFeeAccess,
  resolveFeeActor,
  type FeeActor,
} from "../services/feeAccess.service";

export type FeeAuthRequest = AuthRequest & { feeActor?: FeeActor };

/** Attach resolved FeeActor to the request (after authMiddleware). */
export const attachFeeActor = async (
  req: FeeAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    req.feeActor = await resolveFeeActor(req.user);
    next();
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    next(err);
  }
};

export const requireFeeCapability =
  (...capabilities: FeeCapability[]) =>
  async (req: FeeAuthRequest, res: Response, next: NextFunction) => {
    try {
      const actor = req.feeActor || (await resolveFeeActor(req.user));
      req.feeActor = actor;

      const ok = capabilities.some((c) => actorHasCapability(actor, c));
      if (!ok) {
        await logUnauthorizedFeeAccess(
          actor,
          req.originalUrl || req.url,
          `Denied Fee Management capability [${capabilities.join(", ")}] for role ${actor.feeRole}`
        );
        return res.status(403).json({
          message:
            "You do not have permission to access this Fee Management resource",
        });
      }
      next();
    } catch (err) {
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      next(err);
    }
  };

/** Ensure :studentId / body.student_id / query.student_id is in scope */
export const requireScopedStudent = async (
  req: FeeAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const actor = req.feeActor || (await resolveFeeActor(req.user));
    req.feeActor = actor;

    if (actor.feeRole === "admin" || actor.feeRole === "accountant") {
      return next();
    }

    const raw =
      req.params.studentId ||
      req.params.id ||
      (req.body && (req.body.student_id as unknown)) ||
      req.query.student_id;

    const studentId = raw !== undefined && raw !== null && raw !== ""
      ? Number(raw)
      : NaN;

    if (actor.feeRole === "teacher") {
      await logUnauthorizedFeeAccess(
        actor,
        req.originalUrl || req.url,
        "Teacher attempted student-scoped fee mutation/access without admin rights"
      );
      return res.status(403).json({
        message: "Teachers cannot access individual student fee administration",
      });
    }

    try {
      assertStudentScope(actor, Number.isFinite(studentId) ? studentId : null);
    } catch (err) {
      await logUnauthorizedFeeAccess(
        actor,
        req.originalUrl || req.url,
        `Out-of-scope student access attempt (student_id=${raw})`
      );
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      throw err;
    }
    next();
  } catch (err) {
    next(err);
  }
};

export const requireScopedFeeBasic = async (
  req: FeeAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const actor = req.feeActor || (await resolveFeeActor(req.user));
    req.feeActor = actor;

    const basicId = Number(
      req.params.basicId ||
        req.params.id ||
        req.body?.fee_master_basic_id ||
        req.query.fee_master_basic_id
    );

    if (!Number.isFinite(basicId)) {
      return res.status(400).json({ message: "Fee statement id is required" });
    }

    try {
      await assertBasicBelongsToScopedStudent(actor, basicId);
    } catch (err) {
      await logUnauthorizedFeeAccess(
        actor,
        req.originalUrl || req.url,
        `Out-of-scope fee statement access (basic_id=${basicId})`
      );
      if (err instanceof AppError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      throw err;
    }
    next();
  } catch (err) {
    next(err);
  }
};

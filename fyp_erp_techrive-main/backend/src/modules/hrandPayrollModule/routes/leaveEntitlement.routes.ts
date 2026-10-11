import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createLeaveEntitlement,
  deleteLeaveEntitlement,
  getLeaveEntitlementById,
  getLeaveEntitlements,
  updateLeaveEntitlement,
} from "../controllers/leaveEntitlement.controller";
import {
  createLeaveEntitlementSchema,
  leaveEntitlementIdParamSchema,
  listLeaveEntitlementsQuerySchema,
  updateLeaveEntitlementSchema,
} from "../validators/leaveEntitlement.validator";

const router = Router();

// All Leave Entitlement routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/leave-entitlements
router.get(
  "/",
  requireHrAccess("leave_entitlement.view"), validate(listLeaveEntitlementsQuerySchema, "query"), getLeaveEntitlements);

// GET /api/leave-entitlements/:id
router.get(
  "/:id",
  requireHrAccess("leave_entitlement.view"),
  validate(leaveEntitlementIdParamSchema, "params"),
  getLeaveEntitlementById
);

// POST /api/leave-entitlements
router.post(
  "/",
  requireHrAccess("leave_entitlement.create"), validate(createLeaveEntitlementSchema, "body"), createLeaveEntitlement);

// PUT /api/leave-entitlements/:id
router.put(
  "/:id",
  requireHrAccess("leave_entitlement.update"),
  validate(leaveEntitlementIdParamSchema, "params"),
  validate(updateLeaveEntitlementSchema, "body"),
  updateLeaveEntitlement
);

// DELETE /api/leave-entitlements/:id
router.delete(
  "/:id",
  requireHrAccess("leave_entitlement.delete"),
  validate(leaveEntitlementIdParamSchema, "params"),
  deleteLeaveEntitlement
);

export default router;
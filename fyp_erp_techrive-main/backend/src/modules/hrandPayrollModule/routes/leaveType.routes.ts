import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createLeaveType,
  deleteLeaveType,
  getLeaveTypeById,
  getLeaveTypes,
  getLeaveTypesLookup,
  updateLeaveType,
} from "../controllers/leaveType.controller";
import {
  createLeaveTypeSchema,
  leaveTypeIdParamSchema,
  listLeaveTypesQuerySchema,
  updateLeaveTypeSchema,
} from "../validators/leaveType.validator";

const router = Router();

// All Leave Type routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/leave-types
router.get(
  "/",
  requireHrAccess("leave_type.view"), validate(listLeaveTypesQuerySchema, "query"), getLeaveTypes);

// ─── Lookup for the Leave Request / Leave Entitlement form dropdowns ────────
// MUST be registered before "/:id" — same reasoning as employee.routes.ts.
// GET /api/leave-types/lookup
router.get(
  "/lookup",
  requireHrAccess("leave_type.view"), getLeaveTypesLookup);

// GET /api/leave-types/:id
router.get(
  "/:id",
  requireHrAccess("leave_type.view"), validate(leaveTypeIdParamSchema, "params"), getLeaveTypeById);

// POST /api/leave-types
router.post(
  "/",
  requireHrAccess("leave_type.create"), validate(createLeaveTypeSchema, "body"), createLeaveType);

// PUT /api/leave-types/:id
router.put(
  "/:id",
  requireHrAccess("leave_type.update"),
  validate(leaveTypeIdParamSchema, "params"),
  validate(updateLeaveTypeSchema, "body"),
  updateLeaveType
);

// DELETE /api/leave-types/:id
router.delete(
  "/:id",
  requireHrAccess("leave_type.delete"), validate(leaveTypeIdParamSchema, "params"), deleteLeaveType);

export default router;
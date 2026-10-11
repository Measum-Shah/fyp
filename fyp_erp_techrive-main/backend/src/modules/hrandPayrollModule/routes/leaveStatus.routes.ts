import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createLeaveStatus,
  deleteLeaveStatus,
  getLeaveStatusById,
  getLeaveStatuses,
  getLeaveStatusesLookup,
  updateLeaveStatus,
} from "../controllers/leaveStatus.controller";
import {
  createLeaveStatusSchema,
  leaveStatusIdParamSchema,
  listLeaveStatusesQuerySchema,
  updateLeaveStatusSchema,
} from "../validators/leaveStatus.validator";

const router = Router();

// All Leave Status routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/leave-statuses
router.get(
  "/",
  requireHrAccess("leave_status.view"), validate(listLeaveStatusesQuerySchema, "query"), getLeaveStatuses);

// ─── Lookup for the Leave Request form's status dropdown ───────────────────
// MUST be registered before "/:id".
// GET /api/leave-statuses/lookup
router.get(
  "/lookup",
  requireHrAccess("leave_status.view"), getLeaveStatusesLookup);

// GET /api/leave-statuses/:id
router.get(
  "/:id",
  requireHrAccess("leave_status.view"), validate(leaveStatusIdParamSchema, "params"), getLeaveStatusById);

// POST /api/leave-statuses
router.post(
  "/",
  requireHrAccess("leave_status.create"), validate(createLeaveStatusSchema, "body"), createLeaveStatus);

// PUT /api/leave-statuses/:id
router.put(
  "/:id",
  requireHrAccess("leave_status.update"),
  validate(leaveStatusIdParamSchema, "params"),
  validate(updateLeaveStatusSchema, "body"),
  updateLeaveStatus
);

// DELETE /api/leave-statuses/:id
router.delete(
  "/:id",
  requireHrAccess("leave_status.delete"), validate(leaveStatusIdParamSchema, "params"), deleteLeaveStatus);

export default router;
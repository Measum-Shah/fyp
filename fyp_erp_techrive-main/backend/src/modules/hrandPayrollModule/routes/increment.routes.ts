import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createIncrement,
  deleteIncrement,
  getIncrementById,
  getIncrements,
  getStaffSalarySnapshotHandler,
  updateIncrement,
  updateIncrementStatus,
} from "../controllers/increment.controller";
import {
  createIncrementSchema,
  incrementIdParamSchema,
  listIncrementsQuerySchema,
  staffIdParamSchema,
  staffSalarySnapshotQuerySchema,
  updateIncrementSchema,
  updateIncrementStatusSchema,
} from "../validators/increment.validator";

const router = Router();

router.use(authMiddleware);

// GET /api/increments
router.get(
  "/",
  requireHrAccess("increment.view"), validate(listIncrementsQuerySchema, "query"), getIncrements);

// GET /api/increments/staff/:staffId/salary-snapshot
router.get(
  "/staff/:staffId/salary-snapshot",
  requireHrAccess("increment.create"),
  validate(staffIdParamSchema, "params"),
  validate(staffSalarySnapshotQuerySchema, "query"),
  getStaffSalarySnapshotHandler
);

// GET /api/increments/:id
router.get(
  "/:id",
  requireHrAccess("increment.view"), validate(incrementIdParamSchema, "params"), getIncrementById);

// POST /api/increments
router.post(
  "/",
  requireHrAccess("increment.create"), validate(createIncrementSchema, "body"), createIncrement);

// PUT /api/increments/:id
router.put(
  "/:id",
  requireHrAccess("increment.update"),
  validate(incrementIdParamSchema, "params"),
  validate(updateIncrementSchema, "body"),
  updateIncrement
);

// PATCH /api/increments/:id/status
router.patch(
  "/:id/status",
  requireHrAccess("increment.approve"),
  validate(incrementIdParamSchema, "params"),
  validate(updateIncrementStatusSchema, "body"),
  updateIncrementStatus
);

// DELETE /api/increments/:id
router.delete(
  "/:id",
  requireHrAccess("increment.delete"), validate(incrementIdParamSchema, "params"), deleteIncrement);

export default router;
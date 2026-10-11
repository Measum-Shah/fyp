import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createWorkShift,
  deleteWorkShift,
  getWorkShiftById,
  getWorkShifts,
  updateWorkShift,
} from "../controllers/workShift.controller";
import {
  createWorkShiftSchema,
  listWorkShiftsQuerySchema,
  updateWorkShiftSchema,
  workShiftIdParamSchema,
} from "../validators/workShift.validator";

const router = Router();

// All Work Shift routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/work-shifts
router.get(
  "/",
  requireHrAccess("work_shift.view"), validate(listWorkShiftsQuerySchema, "query"), getWorkShifts);

// GET /api/work-shifts/:id
router.get(
  "/:id",
  requireHrAccess("work_shift.view"), validate(workShiftIdParamSchema, "params"), getWorkShiftById);

// POST /api/work-shifts
router.post(
  "/",
  requireHrAccess("work_shift.create"), validate(createWorkShiftSchema, "body"), createWorkShift);

// PUT /api/work-shifts/:id
router.put(
  "/:id",
  requireHrAccess("work_shift.update"),
  validate(workShiftIdParamSchema, "params"),
  validate(updateWorkShiftSchema, "body"),
  updateWorkShift
);

// DELETE /api/work-shifts/:id
router.delete(
  "/:id",
  requireHrAccess("work_shift.delete"), validate(workShiftIdParamSchema, "params"), deleteWorkShift);

export default router;
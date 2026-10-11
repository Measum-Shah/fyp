import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createAttendanceStatus,
  deleteAttendanceStatus,
  getActiveAttendanceStatuses,
  getAttendanceStatusById,
  getAttendanceStatuses,
  updateAttendanceStatus,
} from "../controllers/attendanceStatus.controller";
import {
  attendanceStatusIdParamSchema,
  createAttendanceStatusSchema,
  listAttendanceStatusesQuerySchema,
  updateAttendanceStatusSchema,
} from "../validators/attendanceStatus.validator";

const router = Router();

// All Attendance Status routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/attendance-statuses
router.get(
  "/",
  requireHrAccess("attendance_status.view"), validate(listAttendanceStatusesQuerySchema, "query"), getAttendanceStatuses);

// GET /api/attendance-statuses/lookup — MUST be registered before "/:id"
router.get(
  "/lookup",
  requireHrAccess("attendance_status.view"), getActiveAttendanceStatuses);

// GET /api/attendance-statuses/:id
router.get(
  "/:id",
  requireHrAccess("attendance_status.view"), validate(attendanceStatusIdParamSchema, "params"), getAttendanceStatusById);

// POST /api/attendance-statuses
router.post(
  "/",
  requireHrAccess("attendance_status.create"), validate(createAttendanceStatusSchema, "body"), createAttendanceStatus);

// PUT /api/attendance-statuses/:id
router.put(
  "/:id",
  requireHrAccess("attendance_status.update"),
  validate(attendanceStatusIdParamSchema, "params"),
  validate(updateAttendanceStatusSchema, "body"),
  updateAttendanceStatus
);

// DELETE /api/attendance-statuses/:id
router.delete(
  "/:id",
  requireHrAccess("attendance_status.delete"), validate(attendanceStatusIdParamSchema, "params"), deleteAttendanceStatus);

export default router;
import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createAttendance,
  deleteAttendance,
  getAttendanceById,
  getAttendanceRecords,
  setAttendanceReviewStatus,
  updateAttendance,
} from "../controllers/attendance.controller";
import {
  attendanceIdParamSchema,
  createAttendanceSchema,
  listAttendanceQuerySchema,
  reviewAttendanceSchema,
  updateAttendanceSchema,
} from "../validators/attendance.validator";

const router = Router();

// All Attendance routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/attendance
router.get(
  "/",
  requireHrAccess("attendance.view"), validate(listAttendanceQuerySchema, "query"), getAttendanceRecords);

// GET /api/attendance/:id
router.get(
  "/:id",
  requireHrAccess("attendance.view"), validate(attendanceIdParamSchema, "params"), getAttendanceById);

// POST /api/attendance
router.post(
  "/",
  requireHrAccess("attendance.create"), validate(createAttendanceSchema, "body"), createAttendance);

// PUT /api/attendance/:id
router.put(
  "/:id",
  requireHrAccess("attendance.update"),
  validate(attendanceIdParamSchema, "params"),
  validate(updateAttendanceSchema, "body"),
  updateAttendance
);

// PATCH /api/attendance/:id/review-status
router.patch(
  "/:id/review-status",
  requireHrAccess("attendance.review"),
  validate(attendanceIdParamSchema, "params"),
  validate(reviewAttendanceSchema, "body"),
  setAttendanceReviewStatus
);

// DELETE /api/attendance/:id
router.delete(
  "/:id",
  requireHrAccess("attendance.delete"), validate(attendanceIdParamSchema, "params"), deleteAttendance);

export default router;
import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createAttendanceSummary,
  deleteAttendanceSummary,
  getAttendanceSummaries,
  getAttendanceSummaryById,
  getAttendanceSummaryDetail,
  setAttendanceSummaryApproval,
  updateAttendanceSummary,
} from "../controllers/attendanceSummary.controller";
import {
  attendanceSummaryIdParamSchema,
  createAttendanceSummarySchema,
  listAttendanceSummariesQuerySchema,
  setApprovalSchema,
  updateAttendanceSummarySchema,
} from "../validators/attendanceSummary.validator";

const router = Router();

router.use(authMiddleware);

router.get(
  "/",
  requireHrAccess("attendance_summary.view"), validate(listAttendanceSummariesQuerySchema, "query"), getAttendanceSummaries);
router.get(
  "/:id",
  requireHrAccess("attendance_summary.view"), validate(attendanceSummaryIdParamSchema, "params"), getAttendanceSummaryById);
router.get(
  "/:id/detail",
  requireHrAccess("attendance_summary.view"),
  validate(attendanceSummaryIdParamSchema, "params"),
  getAttendanceSummaryDetail
);
router.post(
  "/",
  requireHrAccess("attendance_summary.create"), validate(createAttendanceSummarySchema, "body"), createAttendanceSummary);
router.put(
  "/:id",
  requireHrAccess("attendance_summary.update"),
  validate(attendanceSummaryIdParamSchema, "params"),
  validate(updateAttendanceSummarySchema, "body"),
  updateAttendanceSummary
);
router.patch(
  "/:id/approval",
  requireHrAccess("attendance_summary.approve"),
  validate(attendanceSummaryIdParamSchema, "params"),
  validate(setApprovalSchema, "body"),
  setAttendanceSummaryApproval
);
router.delete(
  "/:id",
  requireHrAccess("attendance_summary.delete"), validate(attendanceSummaryIdParamSchema, "params"), deleteAttendanceSummary);

export default router;

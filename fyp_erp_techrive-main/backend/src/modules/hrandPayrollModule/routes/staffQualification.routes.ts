import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import { createUploader } from "../middlewares/upload.middleware";
import {
  createStaffQualification,
  deleteStaffQualification,
  getStaffQualificationById,
  getStaffQualifications,
  updateStaffQualification,
  uploadStaffQualificationAttachment,
} from "../controllers/staffQualification.controller";
import {
  createStaffQualificationSchema,
  listStaffQualificationsQuerySchema,
  staffQualificationIdParamSchema,
  updateStaffQualificationSchema,
} from "../validators/staffQualification.validator";
import { STAFF_QUALIFICATION_UPLOAD_SUBDIR } from "../constants/staffQualification.constants";

const router = Router();

router.use(authMiddleware);

const qualificationUpload = createUploader(STAFF_QUALIFICATION_UPLOAD_SUBDIR);

// GET /api/staff-qualifications?staff_id=123
router.get(
  "/",
  requireHrAccess("staff_qualification.view"), validate(listStaffQualificationsQuerySchema, "query"), getStaffQualifications);

// POST /api/staff-qualifications/upload-attachment (multipart, field name "file")
// NOTE: declared before "/:id" so the literal path always wins the match.
router.post(
  "/upload-attachment",
  requireHrAccess("staff_qualification.create"), qualificationUpload.single("file"), uploadStaffQualificationAttachment);

// GET /api/staff-qualifications/:id
router.get(
  "/:id",
  requireHrAccess("staff_qualification.view"), validate(staffQualificationIdParamSchema, "params"), getStaffQualificationById);

// POST /api/staff-qualifications
router.post(
  "/",
  requireHrAccess("staff_qualification.create"), validate(createStaffQualificationSchema, "body"), createStaffQualification);

// PUT /api/staff-qualifications/:id
router.put(
  "/:id",
  requireHrAccess("staff_qualification.update"),
  validate(staffQualificationIdParamSchema, "params"),
  validate(updateStaffQualificationSchema, "body"),
  updateStaffQualification
);

// DELETE /api/staff-qualifications/:id
router.delete(
  "/:id",
  requireHrAccess("staff_qualification.delete"), validate(staffQualificationIdParamSchema, "params"), deleteStaffQualification);

export default router;
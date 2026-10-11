import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import { createUploader } from "../middlewares/upload.middleware";
import {
  createResignation,
  deleteResignation,
  getResignationById,
  getResignations,
  updateResignation,
  updateResignationApproval,
  uploadResignationExperienceLetter,
} from "../controllers/resignation.controller";
import {
  createResignationSchema,
  listResignationsQuerySchema,
  resignationIdParamSchema,
  updateResignationApprovalSchema,
  updateResignationSchema,
} from "../validators/resignation.validator";
import { RESIGNATION_EXPERIENCE_LETTER_UPLOAD_SUBDIR } from "../constants/resignation.constants";

const router = Router();

router.use(authMiddleware);

const experienceLetterUpload = createUploader(RESIGNATION_EXPERIENCE_LETTER_UPLOAD_SUBDIR);

// GET /api/resignations
router.get(
  "/",
  requireHrAccess("resignation.view"), validate(listResignationsQuerySchema, "query"), getResignations);

// POST /api/resignations/upload-experience-letter (multipart, field name "file")
// NOTE: declared before "/:id" so the literal path always wins the match.
// Wraps multer's callback the same way studentEnrollment.routes.ts does, so
// upload failures (oversized file, unsupported type) come back as a clean
// JSON error instead of falling through to Express's default HTML error
// page — this module has no global error-handling middleware registered.
router.post(
  "/upload-experience-letter",
  requireHrAccess("resignation.create"),
  (req, res, next) => {
    experienceLetterUpload.single("file")(req, res, (err) => {
      if (!err) return next();
      const status = (err as { statusCode?: number; code?: string }).statusCode || 400;
      const message =
        (err as { code?: string }).code === "LIMIT_FILE_SIZE"
          ? "Experience letter must be 5 MB or smaller."
          : (err as Error).message || "Invalid experience letter upload.";
      return res.status(status).json({ success: false, message });
    });
  },
  uploadResignationExperienceLetter
);

// GET /api/resignations/:id
router.get(
  "/:id",
  requireHrAccess("resignation.view"), validate(resignationIdParamSchema, "params"), getResignationById);

// POST /api/resignations
router.post(
  "/",
  requireHrAccess("resignation.create"), validate(createResignationSchema, "body"), createResignation);

// PUT /api/resignations/:id
router.put(
  "/:id",
  requireHrAccess("resignation.update"),
  validate(resignationIdParamSchema, "params"),
  validate(updateResignationSchema, "body"),
  updateResignation
);

// PATCH /api/resignations/:id/approval
router.patch(
  "/:id/approval",
  requireHrAccess("resignation.approve"),
  validate(resignationIdParamSchema, "params"),
  validate(updateResignationApprovalSchema, "body"),
  updateResignationApproval
);

// DELETE /api/resignations/:id
router.delete(
  "/:id",
  requireHrAccess("resignation.delete"), validate(resignationIdParamSchema, "params"), deleteResignation);

export default router;
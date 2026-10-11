import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import {
  getLookups,
  listEnrollments,
  getEnrollment,
  createEnrollment,
  verifyFee,
} from "../controllers/studentEnrollment.controller";
import { studentEnrollmentPhotoUpload } from "../middlewares/studentEnrollmentUpload.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/lookups", getLookups);
router.get("/", listEnrollments);

router.post(
  "/",
  (req, res, next) => {
    studentEnrollmentPhotoUpload.single("student_photo")(req, res, (err) => {
      if (!err) return next();
      const status =
        (err as { statusCode?: number; code?: string }).statusCode || 400;
      const message =
        (err as { code?: string }).code === "LIMIT_FILE_SIZE"
          ? "Student photo must be 2 MB or smaller."
          : (err as Error).message || "Invalid student photo upload.";
      return res.status(status).json({ success: false, message });
    });
  },
  createEnrollment
);

router.get("/:id", getEnrollment);
router.post("/:id/verify-fee", verifyFee);

export default router;

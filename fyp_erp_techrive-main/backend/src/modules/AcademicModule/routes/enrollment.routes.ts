import { Router } from "express";
import { validateEligibility, getStudentsList } from "../controllers/enrollment.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/students", getStudentsList);
router.get("/validate/:studentId/:courseId", validateEligibility);

export default router;
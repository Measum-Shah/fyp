import { Router } from "express";
import { getSummaryStats, getCourseDashboardStats } from "../controllers/dashboard.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/summary", getSummaryStats);
router.get("/courses-summary", getCourseDashboardStats);

export default router;
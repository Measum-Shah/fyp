import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { getEligibility, promoteStudents } from "../controllers/promotion.controller";

const router = Router();
router.use(authMiddleware);

router.get("/eligibility", getEligibility);
router.post("/promote", promoteStudents);

export default router;

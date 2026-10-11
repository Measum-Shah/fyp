import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import { getActivityLogs } from "../controllers/activityLog.controller";
import { listActivityLogsQuerySchema } from "../validators/activityLog.validator";

const router = Router();

// All Activity Log routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/activity-logs
router.get("/", requireHrAccess("activity_log.view"), validate(listActivityLogsQuerySchema, "query"), getActivityLogs);

export default router;

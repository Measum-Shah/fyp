import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import { forceLogoutSession, getSessions, getSessionsSummary } from "../controllers/session.controller";
import { listSessionsQuerySchema, sessionIdParamSchema } from "../validators/session.validator";

const router = Router();

// All Session Log routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/sessions/summary — must come before "/:id"-shaped routes
router.get("/summary", requireHrAccess("session.view"), getSessionsSummary);

// GET /api/sessions
router.get("/", requireHrAccess("session.view"), validate(listSessionsQuerySchema, "query"), getSessions);

// PATCH /api/sessions/:id/force-logout
router.patch(
  "/:id/force-logout",
  requireHrAccess("session.force_logout"),
  validate(sessionIdParamSchema, "params"),
  forceLogoutSession
);

export default router;

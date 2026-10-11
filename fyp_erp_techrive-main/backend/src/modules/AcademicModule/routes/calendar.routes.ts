import { Router } from "express";
import { CalendarController } from "../controllers/calendar.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /academic/calendar — list all events (all authenticated users)
router.get("/", CalendarController.list);

// POST /academic/calendar — create event (admin only, enforced in controller)
router.post("/", CalendarController.create);

// PUT /academic/calendar/:id — update event (admin only)
router.put("/:id", CalendarController.update);

// DELETE /academic/calendar/:id — delete event (admin only)
router.delete("/:id", CalendarController.remove);

export default router;

import { Router } from "express";
import { getNotifications, markAsRead, markAllAsRead } from "../controllers/notification.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.get("/", getNotifications);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);

export default router;

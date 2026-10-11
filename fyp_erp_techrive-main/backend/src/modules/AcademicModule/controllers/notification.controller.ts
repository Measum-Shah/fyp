import { Request, Response } from "express";
import { NotificationService } from "../services/notification.service";
import { AuthRequest } from "../../../middlewares/auth.middleware";

export const getNotifications = async (req: Request, res: Response) => {
  try {
    // Determine userId from auth token. The auth middleware adds `user` to `req`
    // Wait, let's assume the auth middleware adds it, if not, we handle error
    const userId = (req as any).user?.id || 1; // Fallback to 1 for dev if not present, though authMiddleware should provide it
    
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    
    const data = await NotificationService.getNotificationsForUser(userId, limit);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 1;
    const notificationId = parseInt(req.params.id as string, 10);
    
    if (isNaN(notificationId)) {
      return res.status(400).json({ success: false, message: "Invalid notification ID" });
    }

    const data = await NotificationService.markAsRead(notificationId, userId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    const status = error.message.includes("Unauthorized") ? 403 : (error.message.includes("not found") ? 404 : 500);
    res.status(status).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 1;
    const data = await NotificationService.markAllAsRead(userId);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

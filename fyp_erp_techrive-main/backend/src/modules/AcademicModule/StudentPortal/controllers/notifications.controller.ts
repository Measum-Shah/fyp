import { Request, Response } from 'express';
import { AuthRequest } from '../../../../middlewares/auth.middleware';
import * as notificationsService from '../services/notifications.service';

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const data = await notificationsService.getNotifications(req.user!.id, unreadOnly);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const data = await notificationsService.markAsRead(req.user!.id, Number(req.params.id));
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const data = await notificationsService.markAllAsRead(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

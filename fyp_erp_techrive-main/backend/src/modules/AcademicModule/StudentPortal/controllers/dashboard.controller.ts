import { Request, Response } from 'express';
import { AuthRequest } from '../../../../middlewares/auth.middleware';
import * as dashboardService from '../services/dashboard.service';

export const get = async (req: AuthRequest, res: Response) => {
  try {
    const data = await dashboardService.getDashboardHome(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

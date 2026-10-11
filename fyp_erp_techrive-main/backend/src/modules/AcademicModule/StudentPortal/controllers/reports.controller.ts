import { Request, Response } from 'express';
import { AuthRequest } from '../../../../middlewares/auth.middleware';
import * as reportsService from '../services/reports.service';

export const getAcademicProgress = async (req: AuthRequest, res: Response) => {
  try {
    const data = await reportsService.getAcademicProgress(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendanceAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const data = await reportsService.getAttendanceAnalytics(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

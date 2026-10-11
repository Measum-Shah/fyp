import { Request, Response } from 'express';
import { AuthRequest } from '../../../../middlewares/auth.middleware';
import * as timetableService from '../services/timetable.service';

export const getTimetable = async (req: AuthRequest, res: Response) => {
  try {
    const data = await timetableService.getTimetable(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendance = async (req: AuthRequest, res: Response) => {
  try {
    const data = await timetableService.getAttendance(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

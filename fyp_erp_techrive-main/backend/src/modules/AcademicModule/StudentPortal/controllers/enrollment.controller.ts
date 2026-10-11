import { Request, Response } from 'express';
import { AuthRequest } from '../../../../middlewares/auth.middleware';
import * as enrollmentService from '../services/enrollment.service';

export const getAvailableCourses = async (req: AuthRequest, res: Response) => {
  try {
    const data = await enrollmentService.getAvailableCourses(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const registerCourse = async (req: AuthRequest, res: Response) => {
  try {
    const data = await enrollmentService.registerCourse(req.user!.id, req.body.course_id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getEnrollmentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const data = await enrollmentService.getEnrollmentStatus(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

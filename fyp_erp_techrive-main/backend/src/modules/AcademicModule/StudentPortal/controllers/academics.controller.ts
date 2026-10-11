import { Request, Response } from 'express';
import { AuthRequest } from '../../../../middlewares/auth.middleware';
import * as academicsService from '../services/academics.service';

export const getCourses = async (req: AuthRequest, res: Response) => {
  try {
    const data = await academicsService.getEnrolledCourses(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getResults = async (req: AuthRequest, res: Response) => {
  try {
    const data = await academicsService.getExamResults(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCGPA = async (req: AuthRequest, res: Response) => {
  try {
    const data = await academicsService.getCGPA(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getGradebook = async (req: AuthRequest, res: Response) => {
  try {
    const data = await academicsService.getGradebook(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTranscript = async (req: AuthRequest, res: Response) => {
  try {
    const data = await academicsService.getTranscript(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

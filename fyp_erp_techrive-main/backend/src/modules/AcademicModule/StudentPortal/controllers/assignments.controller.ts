import { Request, Response } from 'express';
import { AuthRequest } from '../../../../middlewares/auth.middleware';
import * as assignmentsService from '../services/assignments.service';

export const getAssignments = async (req: AuthRequest, res: Response) => {
  try {
    const data = await assignmentsService.getAssignments(req.user!.id, req.query.institution_type as string);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitAssignment = async (req: AuthRequest, res: Response) => {
  try {
    const data = await assignmentsService.submitAssignment(req.user!.id, req.body);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const data = await assignmentsService.getSubmissions(req.user!.id, Number(req.params.id));
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMaterials = async (req: AuthRequest, res: Response) => {
  try {
    const data = await assignmentsService.getMaterials(req.user!.id, req.query.institution_type as string, req.query.course_id ? Number(req.query.course_id) : undefined);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getQuizzes = async (req: AuthRequest, res: Response) => {
  try {
    const data = await assignmentsService.getQuizzes(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import { Request, Response, NextFunction } from "express";
import * as promotionService from "../services/promotion.service";

export const getEligibility = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const program = req.query.program as string;
    const semester = req.query.semester as string;
    
    if (!program || !semester) {
      res.status(400).json({ success: false, message: "Program and Semester are required" });
      return;
    }

    const students = await promotionService.fetchStudentEligibility(program, semester);
    res.status(200).json({ success: true, data: students });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

export const promoteStudents = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { studentIds, program, currentSemester } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      res.status(400).json({ success: false, message: "Student IDs are required" });
      return;
    }

    const result = await promotionService.processPromotion(studentIds, program, currentSemester);
    res.status(200).json({ success: true, data: result, message: `${studentIds.length} students promoted successfully.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

import { Request, Response } from "express";
import { ReportService } from "../services/report.service";

export const getCourseCatalogReport = async (req: Request, res: Response) => {
  try {
    const institution_type = req.query.institution_type as string | undefined;
    const data = await ReportService.getCourseCatalogReport(institution_type);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDepartmentWiseCourseList = async (req: Request, res: Response) => {
  try {
    const institution_type = req.query.institution_type as string | undefined;
    const data = await ReportService.getDepartmentWiseCourseList(institution_type);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProgramWiseCourseList = async (req: Request, res: Response) => {
  try {
    const institution_type = req.query.institution_type as string | undefined;
    const data = await ReportService.getProgramWiseCourseList(institution_type);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSemesterWiseCourseList = async (req: Request, res: Response) => {
  try {
    const institution_type = req.query.institution_type as string | undefined;
    const data = await ReportService.getSemesterWiseCourseList(institution_type);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCreditHourReport = async (req: Request, res: Response) => {
  try {
    const institution_type = req.query.institution_type as string | undefined;
    const data = await ReportService.getCreditHourReport(institution_type);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPrerequisiteReport = async (req: Request, res: Response) => {
  try {
    const course_id = req.query.course_id ? Number(req.query.course_id) : undefined;
    const data = await ReportService.getPrerequisiteReport(course_id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCorequisiteReport = async (req: Request, res: Response) => {
  try {
    const course_id = req.query.course_id ? Number(req.query.course_id) : undefined;
    const data = await ReportService.getCorequisiteReport(course_id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
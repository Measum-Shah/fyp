import { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";

export const getSummaryStats = async (req: Request, res: Response) => {
  try {
    const institution_type = req.query.institution_type as string | undefined;
    const data = await DashboardService.getSummaryStats(institution_type);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCourseDashboardStats = async (req: Request, res: Response) => {
  try {
    const institution_type = req.query.institution_type as string | undefined;
    const data = await DashboardService.getCourseDashboardStats(institution_type);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
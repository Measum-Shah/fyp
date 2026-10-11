import { Request, Response } from "express";
import { CurriculumService } from "../services/curriculum.service";

export const buildCurriculum = async (req: Request, res: Response) => {
  try {
    const data = await CurriculumService.buildCurriculum(req.body);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getCurriculums = async (req: Request, res: Response) => {
  try {
    const institution_type = req.query.institution_type as string | undefined;
    const branch_id = req.query.branch_id ? Number(req.query.branch_id) : undefined;
    const data = await CurriculumService.getCurriculums(institution_type, branch_id);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getCurriculumById = async (req: Request, res: Response) => {
  try {
    const data = await CurriculumService.getCurriculumById(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const updateCurriculum = async (req: Request, res: Response) => {
  try {
    const data = await CurriculumService.updateCurriculum(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const deleteCurriculum = async (req: Request, res: Response) => {
  try {
    await CurriculumService.deleteCurriculum(Number(req.params.id));
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
import { Request, Response } from "express";
import { CurriculumVersionService } from "../services/curriculumVersion.service";

export const createVersion = async (req: Request, res: Response) => {
  try {
    const data = await CurriculumVersionService.createVersion(req.body);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getVersions = async (req: Request, res: Response) => {
  try {
    const institution_type = req.query.institution_type as string | undefined;
    const data = await CurriculumVersionService.getVersions(institution_type);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getVersionById = async (req: Request, res: Response) => {
  try {
    const data = await CurriculumVersionService.getVersionById(Number(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const updateVersion = async (req: Request, res: Response) => {
  try {
    const data = await CurriculumVersionService.updateVersion(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const deleteVersion = async (req: Request, res: Response) => {
  try {
    await CurriculumVersionService.deleteVersion(Number(req.params.id));
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
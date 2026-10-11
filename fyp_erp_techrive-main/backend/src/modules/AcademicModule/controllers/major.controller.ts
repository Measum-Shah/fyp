import { Request, Response } from "express";
import { MajorService } from "../services/major.service";

export const createMajor = async (req: Request, res: Response) => {
  try {
    const maj = await MajorService.createMajor(req.body);
    res.status(201).json({ success: true, data: maj });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMajors = async (req: Request, res: Response) => {
  try {
    const institution_type = req.query.institution_type as string | undefined;
    const branch_id = req.query.branch_id ? Number(req.query.branch_id) : undefined;
    const majs = await MajorService.getMajors(institution_type, branch_id);
    res.status(200).json({ success: true, data: majs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getMajorById = async (req: Request, res: Response) => {
  try {
    const maj = await MajorService.getMajorById(Number(req.params.id));
    if (!maj) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: maj });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMajor = async (req: Request, res: Response) => {
  try {
    const maj = await MajorService.updateMajor(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data: maj });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMajor = async (req: Request, res: Response) => {
  try {
    await MajorService.deleteMajor(Number(req.params.id));
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
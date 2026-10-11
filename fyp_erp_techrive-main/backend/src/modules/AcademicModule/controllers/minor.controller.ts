import { Request, Response } from "express";
import { MinorService } from "../services/minor.service";

export const createMinor = async (req: Request, res: Response) => {
  try {
    const min = await MinorService.createMinor(req.body);
    res.status(201).json({ success: true, data: min });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMinors = async (req: Request, res: Response) => {
  try {
    const institution_type = req.query.institution_type as string | undefined;
    const mins = await MinorService.getMinors(institution_type);
    res.status(200).json({ success: true, data: mins });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getMinorById = async (req: Request, res: Response) => {
  try {
    const min = await MinorService.getMinorById(Number(req.params.id));
    if (!min) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: min });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMinor = async (req: Request, res: Response) => {
  try {
    const min = await MinorService.updateMinor(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data: min });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteMinor = async (req: Request, res: Response) => {
  try {
    await MinorService.deleteMinor(Number(req.params.id));
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
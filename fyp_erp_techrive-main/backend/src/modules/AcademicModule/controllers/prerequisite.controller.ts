import { Request, Response } from "express";
import { PrerequisiteService } from "../services/prerequisite.service";

export const assignRequisite = async (req: Request, res: Response) => {
  try {
    const data = await PrerequisiteService.assignRequisite(req.body);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeRequisite = async (req: Request, res: Response) => {
  try {
    await PrerequisiteService.removeRequisite(Number(req.params.id));
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRequisiteChain = async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const data = await PrerequisiteService.getRequisiteChain(
      Number(req.params.courseId),
      type as string
    );
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /academic/prerequisites?type=prerequisite&institution_type=university
export const getAllRequisites = async (req: Request, res: Response) => {
  try {
    const { type = "prerequisite", institution_type } = req.query;
    const data = await PrerequisiteService.getAllRequisites(
      type as string,
      institution_type as string | undefined
    );
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

import { Request, Response } from "express";
import { ProgramService } from "../services/program.service";

export const createProgram = async (req: Request, res: Response) => {
  try {
    const prog = await ProgramService.createProgram(req.body);
    res.status(201).json({ success: true, data: prog });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPrograms = async (req: Request, res: Response) => {
  try {
    const institution_type = req.query.institution_type as string | undefined;
    const branch_id = req.query.branch_id ? Number(req.query.branch_id) : undefined;
    const progs = await ProgramService.getPrograms(institution_type, branch_id);
    res.status(200).json({ success: true, data: progs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProgramById = async (req: Request, res: Response) => {
  try {
    const prog = await ProgramService.getProgramById(Number(req.params.id));
    if (!prog) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, data: prog });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProgram = async (req: Request, res: Response) => {
  try {
    const prog = await ProgramService.updateProgram(Number(req.params.id), req.body);
    res.status(200).json({ success: true, data: prog });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProgram = async (req: Request, res: Response) => {
  try {
    await ProgramService.deleteProgram(Number(req.params.id));
    res.status(200).json({ success: true, message: "Deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
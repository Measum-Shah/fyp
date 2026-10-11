import { Request, Response } from "express";
import { AlumniService } from "../services/alumni.service";

export class AlumniController {
  static async getAlumniList(req: Request, res: Response) {
    try {
      const branch_id = req.query.branch_id ? parseInt(req.query.branch_id as string) : undefined;
      const data = await AlumniService.getAlumniDirectory(branch_id);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async graduateStudents(req: Request, res: Response) {
    try {
      const { studentIds } = req.body;
      const updatedBy = 1; // Fallback – replace with auth middleware user ID when available
      
      const result = await AlumniService.graduateStudents(studentIds, updatedBy);
      return res.status(200).json({ success: true, message: "Students successfully graduated", data: result });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getEligibleStudents(req: Request, res: Response) {
    try {
      const program_id = parseInt(req.query.program_id as string);
      const term_id = parseInt(req.query.term_id as string);
      const branch_id = req.query.branch_id ? parseInt(req.query.branch_id as string) : undefined;

      if (!program_id || !term_id) {
        return res.status(400).json({ success: false, message: "program_id and term_id are required" });
      }

      const data = await AlumniService.getStudentsInFinalTerm(program_id, term_id, branch_id);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

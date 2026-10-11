import { Request, Response } from "express";
import { ResultService } from "../services/result.service";

export class ResultController {
  static async generateBatchResult(req: Request, res: Response) {
    try {
      const { program_id, term_id, session_id } = req.body;
      
      if (!program_id || !term_id || !session_id) {
        return res.status(400).json({ success: false, message: "program_id, term_id, and session_id are required" });
      }

      const results = await ResultService.generateBatchResults(program_id, term_id, session_id);
      return res.status(200).json({ success: true, data: results });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getStudentResult(req: Request, res: Response) {
    try {
      const student_id = parseInt(req.params.studentId as string);
      if (!student_id || isNaN(student_id)) {
        return res.status(400).json({ success: false, message: "studentId is required" });
      }

      const data = await ResultService.getStudentResult(student_id);
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

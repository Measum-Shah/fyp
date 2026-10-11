import { Request, Response } from "express";
import { TeacherExamsService } from "../services/teacherExams.service";
import { getAuthUser } from "../../../../utils/authHelper";

export class TeacherExamsController {
  static async getExams(req: Request, res: Response) {
    try {
      const user = await getAuthUser(req);
      const staffId = user?.employee_id || user?.id;
      if (!staffId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const exams = await TeacherExamsService.getExams(staffId);
      res.json({ success: true, data: exams });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createExamSlot(req: Request, res: Response) {
    try {
      const user = await getAuthUser(req);
      const staffId = user?.employee_id || user?.id;
      if (!staffId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const data = req.body; // should include title, course_id, active_session_id, section_id, total_marks
      const slot = await TeacherExamsService.createExamSlot(data, staffId);
      res.json({ success: true, data: slot });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getStudentsForExam(req: Request, res: Response) {
    try {
      const scheduleId = Number(req.params.scheduleId);
      const students = await TeacherExamsService.getStudentsForExam(scheduleId);
      res.json({ success: true, data: students });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async saveMarks(req: Request, res: Response) {
    try {
      const user = await getAuthUser(req);
      const staffId = user?.employee_id || user?.id;
      if (!staffId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const scheduleId = Number(req.params.scheduleId);
      const { marks } = req.body;
      
      const result = await TeacherExamsService.saveMarks(scheduleId, marks, staffId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

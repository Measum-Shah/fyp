import { Request, Response } from "express";
import { TeacherCommunicationService } from "../services/teacherCommunication.service";
import { getAuthUser } from "../../../../utils/authHelper";

export class TeacherCommunicationController {
  static async getNotices(req: Request, res: Response) {
    try {
      const user = await getAuthUser(req);
      const staffId = user?.employee_id || user?.id;
      if (!staffId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const notices = await TeacherCommunicationService.getNotices(staffId);
      res.json({ success: true, data: notices });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createNotice(req: Request, res: Response) {
    try {
      const user = await getAuthUser(req);
      const staffId = user?.employee_id || user?.id;
      if (!staffId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const notice = await TeacherCommunicationService.createNotice(staffId, req.body);
      res.json({ success: true, data: notice });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async sendParentMessage(req: Request, res: Response) {
    try {
      const user = await getAuthUser(req);
      const staffId = user?.employee_id || user?.id;
      if (!staffId) return res.status(401).json({ success: false, message: "Unauthorized" });

      const result = await TeacherCommunicationService.sendParentMessage(staffId, req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}

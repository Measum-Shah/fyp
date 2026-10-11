import { Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { TimetableAdminService } from "../services/timetableAdmin.service";

const requireAdmin = (req: AuthRequest) => {
  const userType = String(req.user?.user_type || "").toLowerCase();
  if (!req.user || !["admin", "superadmin"].includes(userType)) throw new Error("Unauthorized: Admin access required.");
};

const inputFrom = (body: any) => ({
  active_session_section_id: Number(body.active_session_section_id),
  subject_id: Number(body.subject_id),
  teacher_id: Number(body.teacher_id),
  room_id: body.room_id ? Number(body.room_id) : null,
  time_table_slot_id: Number(body.time_table_slot_id),
  day: String(body.day || ""),
  time_table_id: Number(body.time_table_id),
  session_id: body.session_id ? Number(body.session_id) : null,
  branch_id: body.branch_id ? Number(body.branch_id) : null,
});

export class TimetableAdminController {
  static async lookups(req: AuthRequest, res: Response) {
    try { requireAdmin(req); res.json({ success: true, data: await TimetableAdminService.lookups() }); }
    catch (error: any) { res.status(error.message.includes("Unauthorized") ? 403 : 500).json({ success: false, message: error.message }); }
  }

  static async list(req: AuthRequest, res: Response) {
    try { requireAdmin(req); res.json({ success: true, data: await TimetableAdminService.list() }); }
    catch (error: any) { res.status(error.message.includes("Unauthorized") ? 403 : 500).json({ success: false, message: error.message }); }
  }

  static async create(req: AuthRequest, res: Response) {
    try { requireAdmin(req); res.status(201).json({ success: true, data: await TimetableAdminService.create(inputFrom(req.body)) }); }
    catch (error: any) { res.status(error.message.includes("Unauthorized") ? 403 : 400).json({ success: false, message: error.message }); }
  }

  static async update(req: AuthRequest, res: Response) {
    try { requireAdmin(req); res.json({ success: true, data: await TimetableAdminService.update(Number(req.params.id), inputFrom(req.body)) }); }
    catch (error: any) { res.status(error.message.includes("Unauthorized") ? 403 : 400).json({ success: false, message: error.message }); }
  }

  static async remove(req: AuthRequest, res: Response) {
    try { requireAdmin(req); await TimetableAdminService.remove(Number(req.params.id)); res.json({ success: true }); }
    catch (error: any) { res.status(error.message.includes("Unauthorized") ? 403 : 400).json({ success: false, message: error.message }); }
  }

  static async teachersBySession(req: AuthRequest, res: Response) {
    try {
      requireAdmin(req);
      const data = await TimetableAdminService.getTeachersBySession(Number(req.params.active_session_id));
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.message.includes("Unauthorized") ? 403 : 500).json({ success: false, message: error.message });
    }
  }

  static async coursesBySession(req: AuthRequest, res: Response) {
    try {
      requireAdmin(req);
      const data = await TimetableAdminService.getCoursesBySession(Number(req.params.active_session_id));
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(error.message.includes("Unauthorized") ? 403 : 500).json({ success: false, message: error.message });
    }
  }

  static async createSlot(req: AuthRequest, res: Response) {
    try {
      requireAdmin(req);
      const { name, slot_from, slot_to } = req.body;
      if (!name || !slot_from || !slot_to) throw new Error("name, slot_from, and slot_to are required.");
      const data = await TimetableAdminService.createTimeSlot(name, slot_from, slot_to);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(error.message.includes("Unauthorized") ? 403 : 400).json({ success: false, message: error.message });
    }
  }

  static async createTimeTable(req: AuthRequest, res: Response) {
    try {
      requireAdmin(req);
      const { title } = req.body;
      if (!title) throw new Error("title is required.");
      const data = await TimetableAdminService.createTimeTable(title);
      res.status(201).json({ success: true, data });
    } catch (error: any) {
      res.status(error.message.includes("Unauthorized") ? 403 : 400).json({ success: false, message: error.message });
    }
  }
}

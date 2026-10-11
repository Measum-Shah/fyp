import { Request, Response } from "express";
import { TeacherEnrollmentService } from "../services/teacherEnrollment.service";

export class TeacherEnrollmentController {

  static async getUniversities(_req: Request, res: Response) {
    try {
      const data = await TeacherEnrollmentService.getUniversities();
      res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
  }

  static async getCampuses(req: Request, res: Response) {
    try {
      const data = await TeacherEnrollmentService.getCampuses(Number(req.params.company_id));
      res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
  }

  static async getActiveSessions(req: Request, res: Response) {
    try {
      const data = await TeacherEnrollmentService.getActiveSessions(Number(req.params.branch_id));
      res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
  }

  static async getSections(req: Request, res: Response) {
    try {
      const data = await TeacherEnrollmentService.getSections(Number(req.params.session_id));
      res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
  }

  static async getStaff(req: Request, res: Response) {
    try {
      const { branch_id, staff_type } = req.query;
      const data = await TeacherEnrollmentService.getAvailableStaff(
        Number(branch_id),
        staff_type as string
      );
      res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
  }

  static async getCourses(req: Request, res: Response) {
    try {
      const { active_session_id, institution_type } = req.query;
      if (!active_session_id || !institution_type) {
        return res.status(400).json({ success: false, message: "active_session_id and institution_type are required" });
      }
      const data = await TeacherEnrollmentService.getCoursesBySession(
        Number(active_session_id),
        institution_type as string
      );
      res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
  }

  static async assignTeacher(req: Request, res: Response) {
    try {
      const data = await TeacherEnrollmentService.assignTeacher(req.body);
      res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
  }

  static async getEnrolledTeachers(req: Request, res: Response) {
    try {
      const data = await TeacherEnrollmentService.getEnrolledTeachers(Number(req.params.section_id));
      res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
  }

  static async removeTeacher(req: Request, res: Response) {
    try {
      await TeacherEnrollmentService.removeTeacher(Number(req.params.id));
      res.json({ success: true, message: "Teacher assignment removed." });
    } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
  }

  // ── Lookups for Create Active Session form ──────────────────────────
  static async getSessions(_req: Request, res: Response) {
    try {
      const data = await TeacherEnrollmentService.getSessions();
      res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
  }

  static async getPrograms(req: Request, res: Response) {
    try {
      const branch_id = Number(req.query.branch_id);
      const institution_type = req.query.institution_type as string;
      const data = await TeacherEnrollmentService.getPrograms(branch_id, institution_type);
      res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
  }

  static async getClasses(_req: Request, res: Response) {
    try {
      const data = await TeacherEnrollmentService.getClasses();
      res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
  }

  static async getSemesters(req: Request, res: Response) {
    try {
      const data = await TeacherEnrollmentService.getSemesters(Number(req.query.branch_id));
      res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
  }

  static async getBoards(req: Request, res: Response) {
    try {
      const branch_id = Number(req.query.branch_id);
      const institution_type = req.query.institution_type as string;
      const data = await TeacherEnrollmentService.getBoards(branch_id, institution_type);
      res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
  }

  static async getAllSections(_req: Request, res: Response) {
    try {
      const data = await TeacherEnrollmentService.getAllSections();
      res.json({ success: true, data });
    } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
  }

  // ── Create Active Session ───────────────────────────────────────────
  static async createActiveSession(req: Request, res: Response) {
    try {
      const data = await TeacherEnrollmentService.createActiveSession(req.body);
      res.json({ success: true, data });
    } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
  }

  // ── Add Section to Session ──────────────────────────────────────────
  static async addSectionToSession(req: Request, res: Response) {
    try {
      const { active_session_id, section_id } = req.body;
      const data = await TeacherEnrollmentService.addSectionToSession(Number(active_session_id), Number(section_id));
      res.json({ success: true, data });
    } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
  }

  // ── Create Brand-new Section ────────────────────────────────────────
  static async createSection(req: Request, res: Response) {
    try {
      const data = await TeacherEnrollmentService.createSection(req.body.name);
      res.json({ success: true, data });
    } catch (e: any) { res.status(400).json({ success: false, message: e.message }); }
  }
}


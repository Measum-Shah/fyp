import { Request, Response } from "express";
import { TeacherService } from "../services/teacherDashboard.service";
import { AuthRequest } from "../../../../middlewares/auth.middleware";

export class TeacherController {
  
  // Login
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await TeacherService.loginTeacher(email, password);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  // Dashboard Stats
  static async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      const staffId = user?.employee_id || user?.id; 
      
      if (!staffId) {
          return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const stats = await TeacherService.getDashboardStats(staffId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // My Courses
  static async getMyCourses(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      const staffId = user?.employee_id || user?.id;
      
      if (!staffId) {
          return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const courses = await TeacherService.getMyCourses(staffId);
      res.json({ success: true, data: courses });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Timetable
  static async getTimetable(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      const staffId = user?.employee_id || user?.id;
      
      if (!staffId) {
          return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const schedule = await TeacherService.getTimetable(staffId);
      res.json({ success: true, data: schedule });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }


  // Course Students
  static async getCourseStudents(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      const staffId = user?.employee_id || user?.id;
      const courseId = Number(req.params.courseId);

      if (!staffId) {
          return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const students = await TeacherService.getCourseStudents(staffId, courseId);
      res.json({ success: true, data: students });
    } catch (error: any) {
      res.status(403).json({ success: false, message: error.message });
    }
  }

  // Attendance Stubs
  static async getAttendanceAnalytics(req: AuthRequest, res: Response) {
    res.json({ success: true, data: [] });
  }
  static async getAttendance(req: AuthRequest, res: Response) {
    res.json({ success: true, data: [] });
  }
  static async saveAttendance(req: AuthRequest, res: Response) {
    res.json({ success: true, data: {} });
  }
}


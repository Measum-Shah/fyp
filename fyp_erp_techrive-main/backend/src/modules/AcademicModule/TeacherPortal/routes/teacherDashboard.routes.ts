import { Router } from "express";
import { TeacherController } from "../controllers/teacherDashboard.controller";
import { authMiddleware } from "../../../../middlewares/auth.middleware";

const router = Router();

// Public route for login
router.post("/login", TeacherController.login);

// Protected routes (Require Authentication)
router.use(authMiddleware);

import { TeacherExamsController } from "../controllers/teacherExams.controller";
import { TeacherCommunicationController } from "../controllers/teacherCommunication.controller";
import gradebookRoutes from "./gradebook.routes";

router.use("/gradebook", gradebookRoutes);

router.get("/dashboard-stats", TeacherController.getDashboardStats);
router.get("/my-courses", TeacherController.getMyCourses);
router.get("/timetable", TeacherController.getTimetable);
router.get("/course/:courseId/students", TeacherController.getCourseStudents);
router.get("/attendance/analytics", TeacherController.getAttendanceAnalytics);
router.get("/attendance", TeacherController.getAttendance);
router.post("/attendance", TeacherController.saveAttendance);

// Exams & Results
router.get("/exams", TeacherExamsController.getExams);
router.post("/exams", TeacherExamsController.createExamSlot);
router.get("/exams/:scheduleId/students", TeacherExamsController.getStudentsForExam);
router.post("/exams/:scheduleId/marks", TeacherExamsController.saveMarks);

// Communication & Notices
router.get("/notices", TeacherCommunicationController.getNotices);
router.post("/notices", TeacherCommunicationController.createNotice);
router.post("/parent-message", TeacherCommunicationController.sendParentMessage);

export default router;

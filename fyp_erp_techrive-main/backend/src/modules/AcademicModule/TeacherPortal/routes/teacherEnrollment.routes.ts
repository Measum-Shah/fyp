import { Router } from "express";
import { TeacherEnrollmentController } from "../controllers/teacherEnrollment.controller";
import { authMiddleware } from "../../../../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

// Cascading dropdowns
router.get("/universities",                                 TeacherEnrollmentController.getUniversities);
router.get("/campuses/:company_id",                        TeacherEnrollmentController.getCampuses);
router.get("/active-sessions/:branch_id",                  TeacherEnrollmentController.getActiveSessions);
router.get("/sections/:session_id",                        TeacherEnrollmentController.getSections);
router.get("/staff",                                       TeacherEnrollmentController.getStaff);
router.get("/courses",                                     TeacherEnrollmentController.getCourses);

// Lookups for Create Active Session form
router.get("/lookup/sessions",                             TeacherEnrollmentController.getSessions);
router.get("/lookup/programs",                             TeacherEnrollmentController.getPrograms);
router.get("/lookup/classes",                              TeacherEnrollmentController.getClasses);
router.get("/lookup/semesters",                           TeacherEnrollmentController.getSemesters);
router.get("/lookup/boards",                               TeacherEnrollmentController.getBoards);
router.get("/lookup/sections",                             TeacherEnrollmentController.getAllSections);

// Create Active Session & Sections
router.post("/create-session",                             TeacherEnrollmentController.createActiveSession);
router.post("/add-section",                                TeacherEnrollmentController.addSectionToSession);
router.post("/create-section",                             TeacherEnrollmentController.createSection);

// Assignment
router.post("/assign",                                     TeacherEnrollmentController.assignTeacher);
router.get("/enrolled/:section_id",                        TeacherEnrollmentController.getEnrolledTeachers);
router.delete("/remove/:id",                               TeacherEnrollmentController.removeTeacher);

export default router;

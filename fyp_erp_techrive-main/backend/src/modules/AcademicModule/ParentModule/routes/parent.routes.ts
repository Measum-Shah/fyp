import { Router } from "express";
import {
  parentLogin,
  getStudentInfo,
  getStudentCourses,
  getStudentResults,
  getStudentProgress,
  getStudentTeachers,
  createParentCredentials,
  getAllParents,
  createParent,
  deleteParent,
  updateParent,
} from "../controllers/parent.controller";
import { authMiddleware } from "../../../../middlewares/auth.middleware";

const router = Router();

// Public — no auth needed
router.post("/auth/login", parentLogin);

// Protected — requires parent JWT
router.get("/student",          authMiddleware, getStudentInfo);
router.get("/student/courses",  authMiddleware, getStudentCourses);
router.get("/student/results",  authMiddleware, getStudentResults);
router.get("/student/progress", authMiddleware, getStudentProgress);
router.get("/student/teachers", authMiddleware, getStudentTeachers);

// Admin — parent CRUD
router.get("/admin/parents",              authMiddleware, getAllParents);
router.post("/admin/parents",             authMiddleware, createParent);
router.patch("/admin/parents/:id",        authMiddleware, updateParent);
router.delete("/admin/parents/:id",       authMiddleware, deleteParent);
router.post("/admin/create-credentials",  authMiddleware, createParentCredentials);

export default router;
import { Router } from "express";
import { createCourse, getCourses, getCourseById, updateCourse, deleteCourse } from "../controllers/course.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.post("/", createCourse);
router.get("/", getCourses);
router.get("/:id", getCourseById);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

export default router;
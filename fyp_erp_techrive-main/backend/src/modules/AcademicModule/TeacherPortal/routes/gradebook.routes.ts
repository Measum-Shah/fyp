import { Router } from "express";
import { GradebookController } from "../controllers/gradebook.controller";

const router = Router();

// Base path: /api/teacher/gradebook (when mounted in teacherDashboard.routes)

// Categories
router.get("/:courseId/:sectionId/categories", GradebookController.getCategories);
router.post("/categories", GradebookController.saveCategory);
router.delete("/categories/:categoryId", GradebookController.deleteCategory);

// Marks
router.get("/:categoryId/:sectionId/marks", GradebookController.getMarks);
router.post("/:categoryId/marks", GradebookController.saveMarks);

// Summary & Publish
router.get("/:courseId/:sectionId/summary", GradebookController.getSummary);
router.post("/publish", GradebookController.publishGradebook);

export default router;

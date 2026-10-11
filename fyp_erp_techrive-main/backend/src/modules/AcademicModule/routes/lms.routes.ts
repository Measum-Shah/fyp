import { Router } from "express";
import {
  uploadMaterial,
  updateMaterial,
  deleteMaterial,
  getMaterials,
  getMaterialsByModule,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  getAssignments,
  submitAssignment,
  getSubmissions,
  gradeSubmission,
} from "../controllers/lms.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validateMaterial, validateAssignment, validateSubmission, validateGrade } from "../validators/lms.validator";

const router = Router();
router.use(authMiddleware);

// ─── LMS Materials ────────────────────────────────────────────────────────────
router.post("/materials", validateMaterial, uploadMaterial);
router.get("/materials", getMaterials);                          // NEW: GET all by institution_type
router.put("/materials/:id", updateMaterial);
router.delete("/materials/:id", deleteMaterial);
router.get("/materials/module/:moduleId", getMaterialsByModule); // Legacy compat

// ─── LMS Assignments ─────────────────────────────────────────────────────────
router.post("/assignments", validateAssignment, createAssignment);
router.put("/assignments/:id", updateAssignment);
router.delete("/assignments/:id", deleteAssignment);
router.get("/assignments", getAssignments);                      // NEW: GET all by institution_type
router.post("/assignments/submit", validateSubmission, submitAssignment);
router.get("/assignments/:assignmentId/submissions", getSubmissions);
router.put("/submissions/:id/grade", validateGrade, gradeSubmission);

export default router;
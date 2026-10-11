import { Router } from "express";
import { ResultController } from "../controllers/result.controller";

const router = Router();

router.post("/generate", ResultController.generateBatchResult);
router.get("/:studentId", ResultController.getStudentResult);

export default router;

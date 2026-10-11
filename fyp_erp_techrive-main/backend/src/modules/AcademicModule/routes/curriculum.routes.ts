import { Router } from "express";
import { buildCurriculum, getCurriculums, getCurriculumById, updateCurriculum, deleteCurriculum } from "../controllers/curriculum.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.post("/", buildCurriculum);
router.get("/", getCurriculums);
router.get("/:id", getCurriculumById);
router.put("/:id", updateCurriculum);
router.delete("/:id", deleteCurriculum);

export default router;
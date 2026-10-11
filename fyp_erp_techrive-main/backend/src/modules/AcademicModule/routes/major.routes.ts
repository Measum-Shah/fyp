import { Router } from "express";
import { createMajor, getMajors, getMajorById, updateMajor, deleteMajor } from "../controllers/major.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.post("/", createMajor);
router.get("/", getMajors);
router.get("/:id", getMajorById);
router.put("/:id", updateMajor);
router.delete("/:id", deleteMajor);

export default router;
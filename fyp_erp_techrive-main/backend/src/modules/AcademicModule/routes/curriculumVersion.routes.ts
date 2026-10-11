import { Router } from "express";
import { createVersion, getVersions, getVersionById, updateVersion, deleteVersion } from "../controllers/curriculumVersion.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.post("/", createVersion);
router.get("/", getVersions);
router.get("/:id", getVersionById);
router.put("/:id", updateVersion);
router.delete("/:id", deleteVersion);

export default router;
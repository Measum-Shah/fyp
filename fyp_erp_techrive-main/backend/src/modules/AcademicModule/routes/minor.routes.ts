import { Router } from "express";
import { createMinor, getMinors, getMinorById, updateMinor, deleteMinor } from "../controllers/minor.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.post("/", createMinor);
router.get("/", getMinors);
router.get("/:id", getMinorById);
router.put("/:id", updateMinor);
router.delete("/:id", deleteMinor);

export default router;
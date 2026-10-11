import { Router } from "express";
import {
  assignRequisite,
  removeRequisite,
  getRequisiteChain,
  getAllRequisites,
} from "../controllers/prerequisite.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

// GET all prerequisites/corequisites (for reports and PrerequisiteManagementPage)
router.get("/", getAllRequisites);

// GET chain for a specific course
router.get("/:courseId", getRequisiteChain);

// POST create, DELETE remove
router.post("/", assignRequisite);
router.delete("/:id", removeRequisite);

export default router;

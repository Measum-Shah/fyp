import { Router } from "express";
import { createDepartment, getDepartments, getDepartmentById, updateDepartment, deleteDepartment } from "../controllers/department.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

router.post("/", createDepartment);
router.get("/", getDepartments);
router.get("/:id", getDepartmentById);
router.put("/:id", updateDepartment);
router.delete("/:id", deleteDepartment);

export default router;
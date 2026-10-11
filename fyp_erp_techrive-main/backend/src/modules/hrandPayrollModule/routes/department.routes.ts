import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createDepartment,
  deleteDepartment,
  getDepartmentById,
  getDepartments,
  updateDepartment,
} from "../controllers/department.controller";
import {
  createDepartmentSchema,
  departmentIdParamSchema,
  listDepartmentsQuerySchema,
  updateDepartmentSchema,
} from "../validators/department.validator";

const router = Router();

// All Department routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/departments
router.get("/", requireHrAccess("department.view"), validate(listDepartmentsQuerySchema, "query"), getDepartments);

// GET /api/departments/:id
router.get(
  "/:id",
  requireHrAccess("department.view"),
  validate(departmentIdParamSchema, "params"),
  getDepartmentById
);

// POST /api/departments
router.post(
  "/",
  requireHrAccess("department.create"),
  validate(createDepartmentSchema, "body"),
  createDepartment
);

// PUT /api/departments/:id
router.put(
  "/:id",
  requireHrAccess("department.update"),
  validate(departmentIdParamSchema, "params"),
  validate(updateDepartmentSchema, "body"),
  updateDepartment
);

// DELETE /api/departments/:id
router.delete(
  "/:id",
  requireHrAccess("department.delete"),
  validate(departmentIdParamSchema, "params"),
  deleteDepartment
);

export default router;

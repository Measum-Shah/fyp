import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createStaffType,
  deleteStaffType,
  getStaffTypeById,
  getStaffTypes,
  updateStaffType,
} from "../controllers/staffType.controller";
import {
  createStaffTypeSchema,
  listStaffTypesQuerySchema,
  staffTypeIdParamSchema,
  updateStaffTypeSchema,
} from "../validators/staffType.validator";

const router = Router();

// All Staff Type routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/staff-types
router.get(
  "/",
  requireHrAccess("staff_type.view"), validate(listStaffTypesQuerySchema, "query"), getStaffTypes);

// GET /api/staff-types/:id
router.get(
  "/:id",
  requireHrAccess("staff_type.view"), validate(staffTypeIdParamSchema, "params"), getStaffTypeById);

// POST /api/staff-types
router.post(
  "/",
  requireHrAccess("staff_type.create"), validate(createStaffTypeSchema, "body"), createStaffType);

// PUT /api/staff-types/:id
router.put(
  "/:id",
  requireHrAccess("staff_type.update"),
  validate(staffTypeIdParamSchema, "params"),
  validate(updateStaffTypeSchema, "body"),
  updateStaffType
);

// DELETE /api/staff-types/:id
router.delete(
  "/:id",
  requireHrAccess("staff_type.delete"), validate(staffTypeIdParamSchema, "params"), deleteStaffType);

export default router;

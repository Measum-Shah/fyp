import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createDesignation,
  deleteDesignation,
  getDesignationById,
  getDesignations,
  updateDesignation,
} from "../controllers/designation.controller";
import {
  createDesignationSchema,
  designationIdParamSchema,
  listDesignationsQuerySchema,
  updateDesignationSchema,
} from "../validators/designation.validator";

const router = Router();

// All Designation routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/designations
router.get(
  "/",
  requireHrAccess("designation.view"), validate(listDesignationsQuerySchema, "query"), getDesignations);

// GET /api/designations/:id
router.get(
  "/:id",
  requireHrAccess("designation.view"), validate(designationIdParamSchema, "params"), getDesignationById);

// POST /api/designations
router.post(
  "/",
  requireHrAccess("designation.create"), validate(createDesignationSchema, "body"), createDesignation);

// PUT /api/designations/:id
router.put(
  "/:id",
  requireHrAccess("designation.update"),
  validate(designationIdParamSchema, "params"),
  validate(updateDesignationSchema, "body"),
  updateDesignation
);

// DELETE /api/designations/:id
router.delete(
  "/:id",
  requireHrAccess("designation.delete"), validate(designationIdParamSchema, "params"), deleteDesignation);

export default router;

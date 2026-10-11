import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createAllowanceType,
  deleteAllowanceType,
  getAllowanceTypeById,
  getAllowanceTypeLookup,
  getAllowanceTypes,
  updateAllowanceType,
} from "../controllers/allowanceType.controller";
import {
  allowanceTypeIdParamSchema,
  createAllowanceTypeSchema,
  listAllowanceTypesQuerySchema,
  updateAllowanceTypeSchema,
} from "../validators/allowanceType.validator";

const router = Router();

// All Allowance Type routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/allowance-types/lookup — MUST come before /:id
router.get("/lookup", requireHrAccess("allowance_type.view"), getAllowanceTypeLookup);

// GET /api/allowance-types
router.get(
  "/",
  requireHrAccess("allowance_type.view"), validate(listAllowanceTypesQuerySchema, "query"), getAllowanceTypes);

// GET /api/allowance-types/:id
router.get(
  "/:id",
  requireHrAccess("allowance_type.view"), validate(allowanceTypeIdParamSchema, "params"), getAllowanceTypeById);

// POST /api/allowance-types
router.post(
  "/",
  requireHrAccess("allowance_type.create"), validate(createAllowanceTypeSchema, "body"), createAllowanceType);

// PUT /api/allowance-types/:id
router.put(
  "/:id",
  requireHrAccess("allowance_type.update"),
  validate(allowanceTypeIdParamSchema, "params"),
  validate(updateAllowanceTypeSchema, "body"),
  updateAllowanceType
);

// DELETE /api/allowance-types/:id
router.delete(
  "/:id",
  requireHrAccess("allowance_type.delete"), validate(allowanceTypeIdParamSchema, "params"), deleteAllowanceType);

export default router;

import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createSalarySheet,
  deleteSalarySheet,
  getSalarySheetById,
  getSalarySheets,
  updateSalaryApproval,
  updateSalarySheet,
} from "../controllers/salary.controller";
import {
  createSalarySchema,
  listSalaryQuerySchema,
  salaryIdParamSchema,
  updateSalaryApprovalSchema,
  updateSalarySchema,
} from "../validators/salary.validator";

const router = Router();

// All Salary Sheet routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/salary-sheets
router.get(
  "/",
  requireHrAccess("salary.view"), validate(listSalaryQuerySchema, "query"), getSalarySheets);

// GET /api/salary-sheets/:id
router.get(
  "/:id",
  requireHrAccess("salary.view"), validate(salaryIdParamSchema, "params"), getSalarySheetById);

// POST /api/salary-sheets
router.post(
  "/",
  requireHrAccess("salary.create"), validate(createSalarySchema, "body"), createSalarySheet);

// PUT /api/salary-sheets/:id
router.put(
  "/:id",
  requireHrAccess("salary.update"),
  validate(salaryIdParamSchema, "params"),
  validate(updateSalarySchema, "body"),
  updateSalarySheet
);

// PATCH /api/salary-sheets/:id/approval — approval chain only
router.patch(
  "/:id/approval",
  requireHrAccess("salary.approve"),
  validate(salaryIdParamSchema, "params"),
  validate(updateSalaryApprovalSchema, "body"),
  updateSalaryApproval
);

// DELETE /api/salary-sheets/:id
router.delete(
  "/:id",
  requireHrAccess("salary.delete"), validate(salaryIdParamSchema, "params"), deleteSalarySheet);

export default router;

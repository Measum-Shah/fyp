import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createDeductionFormula,
  deleteDeductionFormula,
  getDeductionFormulaById,
  getDeductionFormulas,
  updateDeductionFormula,
} from "../controllers/payrollDeductionFormula.controller";
import {
  createDeductionFormulaSchema,
  deductionFormulaIdParamSchema,
  listDeductionFormulasQuerySchema,
  updateDeductionFormulaSchema,
} from "../validators/payrollDeductionFormula.validator";

const router = Router();

// All Payroll Deduction Formula routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/payroll-deduction-formulas
router.get(
  "/",
  requireHrAccess("payroll_deduction_formula.view"),
  validate(listDeductionFormulasQuerySchema, "query"),
  getDeductionFormulas
);

// GET /api/payroll-deduction-formulas/:id
router.get(
  "/:id",
  requireHrAccess("payroll_deduction_formula.view"),
  validate(deductionFormulaIdParamSchema, "params"),
  getDeductionFormulaById
);

// POST /api/payroll-deduction-formulas
router.post(
  "/",
  requireHrAccess("payroll_deduction_formula.create"),
  validate(createDeductionFormulaSchema, "body"),
  createDeductionFormula
);

// PUT /api/payroll-deduction-formulas/:id
router.put(
  "/:id",
  requireHrAccess("payroll_deduction_formula.update"),
  validate(deductionFormulaIdParamSchema, "params"),
  validate(updateDeductionFormulaSchema, "body"),
  updateDeductionFormula
);

// DELETE /api/payroll-deduction-formulas/:id
router.delete(
  "/:id",
  requireHrAccess("payroll_deduction_formula.delete"),
  validate(deductionFormulaIdParamSchema, "params"),
  deleteDeductionFormula
);

export default router;

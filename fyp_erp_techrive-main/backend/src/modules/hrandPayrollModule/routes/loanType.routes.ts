import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createLoanType,
  deleteLoanType,
  getLoanTypeById,
  getLoanTypeLookup,
  getLoanTypes,
  updateLoanType,
} from "../controllers/loanType.controller";
import {
  createLoanTypeSchema,
  listLoanTypesQuerySchema,
  loanTypeIdParamSchema,
  updateLoanTypeSchema,
} from "../validators/loanType.validator";

const router = Router();

router.use(authMiddleware);

// GET /api/loan-types
router.get(
  "/",
  requireHrAccess("loan_type.view"), validate(listLoanTypesQuerySchema, "query"), getLoanTypes);

// GET /api/loan-types/lookup — MUST be before "/:id" or Express would try to
// parse "lookup" as the :id param.
router.get(
  "/lookup",
  requireHrAccess("loan_type.view"), getLoanTypeLookup);

// GET /api/loan-types/:id
router.get(
  "/:id",
  requireHrAccess("loan_type.view"), validate(loanTypeIdParamSchema, "params"), getLoanTypeById);

// POST /api/loan-types
router.post(
  "/",
  requireHrAccess("loan_type.create"), validate(createLoanTypeSchema, "body"), createLoanType);

// PUT /api/loan-types/:id
router.put(
  "/:id",
  requireHrAccess("loan_type.update"),
  validate(loanTypeIdParamSchema, "params"),
  validate(updateLoanTypeSchema, "body"),
  updateLoanType
);

// DELETE /api/loan-types/:id
router.delete(
  "/:id",
  requireHrAccess("loan_type.delete"), validate(loanTypeIdParamSchema, "params"), deleteLoanType);

export default router;

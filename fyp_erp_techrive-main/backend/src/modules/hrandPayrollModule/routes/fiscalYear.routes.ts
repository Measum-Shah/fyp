import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createFiscalYear,
  deleteFiscalYear,
  getFiscalYearById,
  getFiscalYearLookup,
  getFiscalYears,
  updateFiscalYear,
} from "../controllers/fiscalYear.controller";
import {
  createFiscalYearSchema,
  fiscalYearIdParamSchema,
  listFiscalYearsQuerySchema,
  updateFiscalYearSchema,
} from "../validators/fiscalYear.validator";

const router = Router();

// All Fiscal Year routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/fiscal-years/lookup — MUST come before /:id
router.get("/lookup", requireHrAccess("fiscal_year.view"), getFiscalYearLookup);

// GET /api/fiscal-years
router.get("/", requireHrAccess("fiscal_year.view"), validate(listFiscalYearsQuerySchema, "query"), getFiscalYears);

// GET /api/fiscal-years/:id
router.get(
  "/:id",
  requireHrAccess("fiscal_year.view"), validate(fiscalYearIdParamSchema, "params"), getFiscalYearById);

// POST /api/fiscal-years
router.post(
  "/",
  requireHrAccess("fiscal_year.create"), validate(createFiscalYearSchema, "body"), createFiscalYear);

// PUT /api/fiscal-years/:id
router.put(
  "/:id",
  requireHrAccess("fiscal_year.update"),
  validate(fiscalYearIdParamSchema, "params"),
  validate(updateFiscalYearSchema, "body"),
  updateFiscalYear
);

// DELETE /api/fiscal-years/:id
router.delete(
  "/:id",
  requireHrAccess("fiscal_year.delete"), validate(fiscalYearIdParamSchema, "params"), deleteFiscalYear);

export default router;

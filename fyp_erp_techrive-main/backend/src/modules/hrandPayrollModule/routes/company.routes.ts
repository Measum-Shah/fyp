import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createCompany,
  deleteCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
} from "../controllers/company.controller";
import {
  companyIdParamSchema,
  createCompanySchema,
  listCompaniesQuerySchema,
  updateCompanySchema,
} from "../validators/company.validator";

const router = Router();

// All Company routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/companies
router.get(
  "/",
  requireHrAccess("company.view"), validate(listCompaniesQuerySchema, "query"), getCompanies);

// GET /api/companies/:id
router.get(
  "/:id",
  requireHrAccess("company.view"), validate(companyIdParamSchema, "params"), getCompanyById);

// POST /api/companies
router.post(
  "/",
  requireHrAccess("company.create"), validate(createCompanySchema, "body"), createCompany);

// PUT /api/companies/:id
router.put(
  "/:id",
  requireHrAccess("company.update"),
  validate(companyIdParamSchema, "params"),
  validate(updateCompanySchema, "body"),
  updateCompany
);

// DELETE /api/companies/:id
router.delete(
  "/:id",
  requireHrAccess("company.delete"), validate(companyIdParamSchema, "params"), deleteCompany);

export default router;
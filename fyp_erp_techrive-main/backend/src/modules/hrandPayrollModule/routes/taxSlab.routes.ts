import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createTaxSlab,
  deleteTaxSlab,
  getTaxSlabById,
  getTaxSlabs,
  getTaxSlabsForFiscalYear,
  updateTaxSlab,
} from "../controllers/taxSlab.controller";
import {
  createTaxSlabSchema,
  listTaxSlabsQuerySchema,
  taxSlabIdParamSchema,
  updateTaxSlabSchema,
} from "../validators/taxSlab.validator";

const router = Router();

// All Tax Slab routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/tax-slabs/by-fiscal-year/:fiscalYearId — MUST come before /:id
router.get(
  "/by-fiscal-year/:fiscalYearId",
  requireHrAccess("tax_slab.view"),
  getTaxSlabsForFiscalYear
);

// GET /api/tax-slabs
router.get("/", requireHrAccess("tax_slab.view"), validate(listTaxSlabsQuerySchema, "query"), getTaxSlabs);

// GET /api/tax-slabs/:id
router.get("/:id", requireHrAccess("tax_slab.view"), validate(taxSlabIdParamSchema, "params"), getTaxSlabById);

// POST /api/tax-slabs
router.post("/", requireHrAccess("tax_slab.create"), validate(createTaxSlabSchema, "body"), createTaxSlab);

// PUT /api/tax-slabs/:id
router.put(
  "/:id",
  requireHrAccess("tax_slab.update"),
  validate(taxSlabIdParamSchema, "params"),
  validate(updateTaxSlabSchema, "body"),
  updateTaxSlab
);

// DELETE /api/tax-slabs/:id
router.delete("/:id", requireHrAccess("tax_slab.delete"), validate(taxSlabIdParamSchema, "params"), deleteTaxSlab);

export default router;

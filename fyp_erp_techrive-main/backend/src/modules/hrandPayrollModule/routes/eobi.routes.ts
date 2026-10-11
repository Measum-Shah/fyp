import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createEobiEntry,
  deleteEobiEntry,
  getEobiEntries,
  getEobiEntryById,
  updateEobiEntry,
} from "../controllers/eobi.controller";
import {
  createEobiEntrySchema,
  eobiEntryIdParamSchema,
  listEobiEntriesQuerySchema,
  updateEobiEntrySchema,
} from "../validators/eobi.validator";

const router = Router();

router.use(authMiddleware);

// GET /api/eobi-register
router.get(
  "/",
  requireHrAccess("eobi.view"), validate(listEobiEntriesQuerySchema, "query"), getEobiEntries);

// GET /api/eobi-register/:id
router.get(
  "/:id",
  requireHrAccess("eobi.view"), validate(eobiEntryIdParamSchema, "params"), getEobiEntryById);

// POST /api/eobi-register
router.post(
  "/",
  requireHrAccess("eobi.create"), validate(createEobiEntrySchema, "body"), createEobiEntry);

// PUT /api/eobi-register/:id
router.put(
  "/:id",
  requireHrAccess("eobi.update"),
  validate(eobiEntryIdParamSchema, "params"),
  validate(updateEobiEntrySchema, "body"),
  updateEobiEntry
);

// DELETE /api/eobi-register/:id
router.delete(
  "/:id",
  requireHrAccess("eobi.delete"), validate(eobiEntryIdParamSchema, "params"), deleteEobiEntry);

export default router;
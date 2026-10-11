import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createTermination,
  deleteTermination,
  getTerminationById,
  getTerminations,
  updateTermination,
} from "../controllers/termination.controller";
import {
  createTerminationSchema,
  listTerminationsQuerySchema,
  terminationIdParamSchema,
  updateTerminationSchema,
} from "../validators/termination.validator";

const router = Router();

router.use(authMiddleware);

// GET /api/terminations
router.get(
  "/",
  requireHrAccess("termination.view"), validate(listTerminationsQuerySchema, "query"), getTerminations);

// GET /api/terminations/:id
router.get(
  "/:id",
  requireHrAccess("termination.view"), validate(terminationIdParamSchema, "params"), getTerminationById);

// POST /api/terminations
router.post(
  "/",
  requireHrAccess("termination.create"), validate(createTerminationSchema, "body"), createTermination);

// PUT /api/terminations/:id
router.put(
  "/:id",
  requireHrAccess("termination.update"),
  validate(terminationIdParamSchema, "params"),
  validate(updateTerminationSchema, "body"),
  updateTermination
);

// DELETE /api/terminations/:id
router.delete(
  "/:id",
  requireHrAccess("termination.delete"), validate(terminationIdParamSchema, "params"), deleteTermination);

export default router;

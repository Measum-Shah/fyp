import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createPerformance,
  deletePerformance,
  getPerformanceById,
  getPerformances,
  updatePerformance,
} from "../controllers/performance.controller";
import {
  createPerformanceSchema,
  listPerformancesQuerySchema,
  performanceIdParamSchema,
  updatePerformanceSchema,
} from "../validators/performance.validator";

const router = Router();
router.use(authMiddleware);

router.get(
  "/",
  requireHrAccess("performance.view"), validate(listPerformancesQuerySchema, "query"), getPerformances);
router.get(
  "/:id",
  requireHrAccess("performance.view"), validate(performanceIdParamSchema, "params"), getPerformanceById);
router.post(
  "/",
  requireHrAccess("performance.create"), validate(createPerformanceSchema, "body"), createPerformance);
router.put(
  "/:id",
  requireHrAccess("performance.update"), validate(performanceIdParamSchema, "params"), validate(updatePerformanceSchema, "body"), updatePerformance);
router.delete(
  "/:id",
  requireHrAccess("performance.delete"), validate(performanceIdParamSchema, "params"), deletePerformance);

export default router;

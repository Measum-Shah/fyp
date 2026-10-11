import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createMonth,
  deleteMonth,
  getActiveMonths,
  getMonthById,
  getMonths,
  updateMonth,
} from "../controllers/month.controller";
import {
  createMonthSchema,
  listMonthsQuerySchema,
  monthIdParamSchema,
  updateMonthSchema,
} from "../validators/month.validator";

const router = Router();

router.use(authMiddleware);

router.get("/", requireHrAccess("month.view"), validate(listMonthsQuerySchema, "query"), getMonths);
router.get("/lookup", requireHrAccess(), getActiveMonths); // MUST be registered before "/:id".
router.get("/:id", requireHrAccess("month.view"), validate(monthIdParamSchema, "params"), getMonthById);
router.post("/", requireHrAccess("month.create"), validate(createMonthSchema, "body"), createMonth);
router.put(
  "/:id",
  requireHrAccess("month.update"),
  validate(monthIdParamSchema, "params"),
  validate(updateMonthSchema, "body"),
  updateMonth
);
router.delete("/:id", requireHrAccess("month.delete"), validate(monthIdParamSchema, "params"), deleteMonth);

export default router;

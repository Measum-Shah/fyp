import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createYear,
  deleteYear,
  getActiveYears,
  getYearById,
  getYears,
  setCurrentYear,
  updateYear,
} from "../controllers/year.controller";
import {
  createYearSchema,
  listYearsQuerySchema,
  updateYearSchema,
  yearIdParamSchema,
} from "../validators/year.validator";

const router = Router();

router.use(authMiddleware);

router.get("/", requireHrAccess("year.view"), validate(listYearsQuerySchema, "query"), getYears);
router.get("/lookup", requireHrAccess(), getActiveYears); // MUST be registered before "/:id".
router.get("/:id", requireHrAccess("year.view"), validate(yearIdParamSchema, "params"), getYearById);
router.post("/", requireHrAccess("year.create"), validate(createYearSchema, "body"), createYear);
router.put(
  "/:id",
  requireHrAccess("year.update"),
  validate(yearIdParamSchema, "params"),
  validate(updateYearSchema, "body"),
  updateYear
);
router.patch(
  "/:id/set-current",
  requireHrAccess("year.set_current"),
  validate(yearIdParamSchema, "params"),
  setCurrentYear
);
router.delete("/:id", requireHrAccess("year.delete"), validate(yearIdParamSchema, "params"), deleteYear);

export default router;

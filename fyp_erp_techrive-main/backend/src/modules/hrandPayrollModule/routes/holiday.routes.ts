import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createHoliday,
  deleteHoliday,
  getHolidayById,
  getHolidays,
  updateHoliday,
} from "../controllers/holiday.controller";
import {
  createHolidaySchema,
  holidayIdParamSchema,
  listHolidaysQuerySchema,
  updateHolidaySchema,
} from "../validators/holiday.validator";

const router = Router();

// All Holiday routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/holidays
router.get(
  "/",
  requireHrAccess("holiday.view"), validate(listHolidaysQuerySchema, "query"), getHolidays);

// GET /api/holidays/:id
router.get(
  "/:id",
  requireHrAccess("holiday.view"), validate(holidayIdParamSchema, "params"), getHolidayById);

// POST /api/holidays
router.post(
  "/",
  requireHrAccess("holiday.create"), validate(createHolidaySchema, "body"), createHoliday);

// PUT /api/holidays/:id
router.put(
  "/:id",
  requireHrAccess("holiday.update"),
  validate(holidayIdParamSchema, "params"),
  validate(updateHolidaySchema, "body"),
  updateHoliday
);

// DELETE /api/holidays/:id
router.delete(
  "/:id",
  requireHrAccess("holiday.delete"), validate(holidayIdParamSchema, "params"), deleteHoliday);

export default router;
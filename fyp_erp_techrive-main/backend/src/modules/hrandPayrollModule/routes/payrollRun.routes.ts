import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import { auditLog } from "../middlewares/auditLog.middleware";
import { ACTIVITY_MODULE, ACTIVITY_ACTION } from "../constants/activityLog.constants";
import {
  createPayrollRun,
  getEligibleStaff,
  getPayrollRun,
  removeRunMember,
} from "../controllers/payrollRun.controller";
import {
  createPayrollRunSchema,
  eligibleStaffQuerySchema,
  listPayrollRunQuerySchema,
  payrollRunMemberIdParamSchema,
} from "../validators/payrollRun.validator";

const router = Router();

router.use(authMiddleware);

// GET /api/payroll-runs/eligible-staff — MUST be registered before any
// generic "/:id"-style route on this router (there isn't one here, but kept
// as a fixed sub-path for consistency with employee.routes.ts's lookups).
router.get(
  "/eligible-staff",
  requireHrAccess("payroll_run.generate"),
  validate(eligibleStaffQuerySchema, "query"),
  getEligibleStaff
);

// GET /api/payroll-runs — list a run's members for a branch + month_year
router.get("/", requireHrAccess("payroll_run.view"), validate(listPayrollRunQuerySchema, "query"), getPayrollRun);

// POST /api/payroll-runs — batch-generate salary sheets for selected staff
router.post(
  "/",
  requireHrAccess("payroll_run.generate"),
  validate(createPayrollRunSchema, "body"),
  auditLog({
    module: ACTIVITY_MODULE.PAYROLL,
    action: ACTIVITY_ACTION.GENERATED,
    recordType: "PayrollRun",
    getRecordId: (req) => `${req.body?.branch_id}:${req.body?.month_year}`,
    description: (req) => `Payroll generated for campus ${req.body?.branch_id}, ${req.body?.month_year}`,
  }),
  createPayrollRun
);

// DELETE /api/payroll-runs/:id — remove one employee from a run (doesn't delete their sheet)
router.delete(
  "/:id",
  requireHrAccess("payroll_run.delete"),
  validate(payrollRunMemberIdParamSchema, "params"),
  removeRunMember
);

export default router;
import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import { auditLog } from "../middlewares/auditLog.middleware";
import { ACTIVITY_MODULE, ACTIVITY_ACTION } from "../constants/activityLog.constants";
import {
  createBranch,
  deleteBranch,
  getBranchById,
  getBranches,
  getCompanies,
  updateBranch,
} from "../controllers/branch.controller";
import { getBranchById as fetchBranchById } from "../services/branch.service";
import {
  branchIdParamSchema,
  createBranchSchema,
  listBranchesQuerySchema,
  updateBranchSchema,
} from "../validators/branch.validator";

const router = Router();

// All Branch routes require an authenticated ERP user
router.use(authMiddleware);

// GET /api/branches
router.get(
  "/",
  requireHrAccess("branch.view"), validate(listBranchesQuerySchema, "query"), getBranches);

// GET /api/branches/lookups/companies
// IMPORTANT: must be registered before "/:id" — same reasoning as
// employee.routes.ts's lookup routes.
router.get("/lookups/companies", requireHrAccess("directory.read"), getCompanies);

// GET /api/branches/:id
router.get(
  "/:id",
  requireHrAccess("branch.view"), validate(branchIdParamSchema, "params"), getBranchById);

// POST /api/branches
router.post(
  "/",
  requireHrAccess("branch.create"), validate(createBranchSchema, "body"), createBranch);

// PUT /api/branches/:id
router.put(
  "/:id",
  requireHrAccess("branch.update"),
  validate(branchIdParamSchema, "params"),
  validate(updateBranchSchema, "body"),
  updateBranch
);

// DELETE /api/branches/:id
router.delete(
  "/:id",
  requireHrAccess("branch.delete"), validate(branchIdParamSchema, "params"), deleteBranch);

export default router;
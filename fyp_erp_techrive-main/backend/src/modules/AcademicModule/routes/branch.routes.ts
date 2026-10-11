import { Router } from "express";
import {
  getUniversities,
  getCampusesByUniversity,
  getBranches,
  getDepartmentsByBranch,
  assignDepartmentToBranch,
  removeDepartmentFromBranch,
} from "../controllers/branch.controller";
import { authMiddleware } from "../../../middlewares/auth.middleware";

const router = Router();
router.use(authMiddleware);

// Universities (companies)
router.get("/universities",                             getUniversities);
router.get("/universities/:companyId/campuses",         getCampusesByUniversity);

// Campuses (branches)
router.get("/",                                         getBranches);
router.get("/:branchId/departments",                   getDepartmentsByBranch);
router.post("/assign-department",                      assignDepartmentToBranch);
router.post("/remove-department",                      removeDepartmentFromBranch);

export default router;
import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import { createFamily, deleteFamily, getFamilyById, getFamilies, updateFamily } from "../controllers/family.controller";
import { createFamilySchema, familyIdParamSchema, listFamiliesQuerySchema, updateFamilySchema } from "../validators/family.validator";

const router = Router();
router.use(authMiddleware);

router.get(
  "/",
  requireHrAccess("family.view"), validate(listFamiliesQuerySchema, "query"), getFamilies);
router.get(
  "/:id",
  requireHrAccess("family.view"), validate(familyIdParamSchema, "params"), getFamilyById);
router.post(
  "/",
  requireHrAccess("family.create"), validate(createFamilySchema, "body"), createFamily);
router.put(
  "/:id",
  requireHrAccess("family.update"), validate(familyIdParamSchema, "params"), validate(updateFamilySchema, "body"), updateFamily);
router.delete(
  "/:id",
  requireHrAccess("family.delete"), validate(familyIdParamSchema, "params"), deleteFamily);

export default router;

import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createExperience,
  deleteExperience,
  getExperienceById,
  getExperiences,
  updateExperience,
} from "../controllers/experience.controller";
import {
  createExperienceSchema,
  experienceIdParamSchema,
  listExperiencesQuerySchema,
  updateExperienceSchema,
} from "../validators/experience.validator";

const router = Router();
router.use(authMiddleware);

router.get(
  "/",
  requireHrAccess("experience.view"), validate(listExperiencesQuerySchema, "query"), getExperiences);
router.get(
  "/:id",
  requireHrAccess("experience.view"), validate(experienceIdParamSchema, "params"), getExperienceById);
router.post(
  "/",
  requireHrAccess("experience.create"), validate(createExperienceSchema, "body"), createExperience);
router.put(
  "/:id",
  requireHrAccess("experience.update"), validate(experienceIdParamSchema, "params"), validate(updateExperienceSchema, "body"), updateExperience);
router.delete(
  "/:id",
  requireHrAccess("experience.delete"), validate(experienceIdParamSchema, "params"), deleteExperience);

export default router;

import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import {
  createEmergencyContact,
  deleteEmergencyContact,
  getEmergencyContactById,
  getEmergencyContacts,
  updateEmergencyContact,
} from "../controllers/emergencyContact.controller";
import {
  createEmergencyContactSchema,
  emergencyContactIdParamSchema,
  listEmergencyContactsQuerySchema,
  updateEmergencyContactSchema,
} from "../validators/emergencyContact.validator";

const router = Router();
router.use(authMiddleware);

router.get(
  "/",
  requireHrAccess("emergency_contact.view"), validate(listEmergencyContactsQuerySchema, "query"), getEmergencyContacts);
router.get(
  "/:id",
  requireHrAccess("emergency_contact.view"), validate(emergencyContactIdParamSchema, "params"), getEmergencyContactById);
router.post(
  "/",
  requireHrAccess("emergency_contact.create"), validate(createEmergencyContactSchema, "body"), createEmergencyContact);
router.put(
  "/:id",
  requireHrAccess("emergency_contact.update"), validate(emergencyContactIdParamSchema, "params"), validate(updateEmergencyContactSchema, "body"), updateEmergencyContact);
router.delete(
  "/:id",
  requireHrAccess("emergency_contact.delete"), validate(emergencyContactIdParamSchema, "params"), deleteEmergencyContact);

export default router;

import { z } from "zod";
import {
  EMERGENCY_CONTACT_EMAIL_MAX_LENGTH,
  EMERGENCY_CONTACT_NAME_MAX_LENGTH,
  EMERGENCY_CONTACT_PHONE_MAX_LENGTH,
  EMERGENCY_CONTACT_RELATION_MAX_LENGTH,
} from "../constants/emergencyContact.constants";

export const createEmergencyContactSchema = z.object({
  staff_id: z.coerce.number({ error: "Employee is required" }).int().positive("Employee must reference a valid staff id"),
  name: z.string({ error: "Name is required" }).trim().min(1).max(EMERGENCY_CONTACT_NAME_MAX_LENGTH),
  relation: z.string({ error: "Relation is required" }).trim().min(1).max(EMERGENCY_CONTACT_RELATION_MAX_LENGTH),
  phone: z.string({ error: "Phone is required" }).trim().min(1).max(EMERGENCY_CONTACT_PHONE_MAX_LENGTH),
  email: z.string({ error: "Email is required" }).trim().min(1).max(EMERGENCY_CONTACT_EMAIL_MAX_LENGTH).email("Must be a valid email address"),
});

export type CreateEmergencyContactInput = z.infer<typeof createEmergencyContactSchema>;

export const updateEmergencyContactSchema = createEmergencyContactSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: "At least one field must be provided to update the emergency contact" });

export type UpdateEmergencyContactInput = z.infer<typeof updateEmergencyContactSchema>;

export const emergencyContactIdParamSchema = z.object({
  id: z.coerce.number({ error: "Emergency contact id must be a number" }).int().positive("Emergency contact id must be a valid integer"),
});

export const listEmergencyContactsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  search: z.string().trim().max(191).optional(),
  staff_id: z.coerce.number().int().positive().optional(),
});

import { Router } from "express";
import { authMiddleware } from "../../../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { requireHrAccess } from "../middlewares/hrAccess.middleware";
import { auditLog } from "../middlewares/auditLog.middleware";
import { ACTIVITY_MODULE, ACTIVITY_ACTION } from "../constants/activityLog.constants";
import {
  clearDevice,
  syncAttendanceFromDevice,
  testDeviceConnection,
  uploadStaffToDevice,
} from "../controllers/biometricDevice.controller";
import { biometricBranchIdParamSchema } from "../validators/biometricDevice.validator";

const router = Router();

// All biometric device routes require an authenticated ERP user
router.use(authMiddleware);

// POST /api/biometric/branches/:branchId/test-connection
router.post(
  "/branches/:branchId/test-connection",
  requireHrAccess("biometric_device.test_connection"),
  validate(biometricBranchIdParamSchema, "params"),
  testDeviceConnection
);

// POST /api/biometric/branches/:branchId/upload-staff
router.post(
  "/branches/:branchId/upload-staff",
  requireHrAccess("biometric_device.upload_staff"),
  validate(biometricBranchIdParamSchema, "params"),
  uploadStaffToDevice
);

// POST /api/biometric/branches/:branchId/sync-attendance
router.post(
  "/branches/:branchId/sync-attendance",
  requireHrAccess("biometric_device.sync_attendance"),
  validate(biometricBranchIdParamSchema, "params"),
  auditLog({
    module: ACTIVITY_MODULE.ATTENDANCE,
    action: ACTIVITY_ACTION.SYNCHRONIZED,
    recordType: "Branch",
    getRecordId: (req) => String(req.params.branchId),
  }),
  syncAttendanceFromDevice
);

// POST /api/biometric/branches/:branchId/clear-device
router.post(
  "/branches/:branchId/clear-device",
  requireHrAccess("biometric_device.clear_device"),
  validate(biometricBranchIdParamSchema, "params"),
  clearDevice
);

export default router;

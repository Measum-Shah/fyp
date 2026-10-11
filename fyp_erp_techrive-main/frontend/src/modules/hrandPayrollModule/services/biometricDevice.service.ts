import API from "../../../api/api";
import type { ApiEnvelope } from "./employee.types";
import type { DeviceInfo, SyncAttendanceResult, UploadStaffResult } from "./biometricDevice.types";

// ─── Biometric Device — API Service ──────────────────────────────────────────
// Same shape as branchAPI/holidayAPI. All four calls are scoped by branchId —
// a branch's device connectivity is its existing ip/port fields, edited via
// the existing branchAPI.update (see BiometricDevicesPage.tsx).

export const biometricDeviceAPI = {
  testConnection: (branchId: number) =>
    API.post<ApiEnvelope<DeviceInfo>>(`/biometric/branches/${branchId}/test-connection`).then(
      (res) => res.data
    ),

  uploadStaff: (branchId: number) =>
    API.post<ApiEnvelope<UploadStaffResult>>(`/biometric/branches/${branchId}/upload-staff`).then(
      (res) => res.data
    ),

  syncAttendance: (branchId: number) =>
    API.post<ApiEnvelope<SyncAttendanceResult>>(
      `/biometric/branches/${branchId}/sync-attendance`
    ).then((res) => res.data),

  clearDevice: (branchId: number) =>
    API.post<ApiEnvelope<null>>(`/biometric/branches/${branchId}/clear-device`).then(
      (res) => res.data
    ),
};

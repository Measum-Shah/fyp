// ─── Biometric Device — Types ────────────────────────────────────────────────
// Mirrors backend/src/modules/hrandPayrollModule/services/biometricDevice.service.ts's
// return shapes exactly. There is no separate "biometric config" record —
// device connectivity is just a branch's existing ip/port fields (see
// branch.types.ts's Branch), so this file only has response types for the
// four action endpoints.

export interface DeviceInfo {
  userCounts?: number;
  logCounts?: number;
  logCapacity?: number;
  raw?: unknown;
}

export interface UploadStaffResult {
  total: number;
  uploaded: number;
  failed: { employee_id: number; error: string }[];
}

export interface SyncAttendanceResult {
  inserted: number;
  timeOutUpdates: number;
  logsSeen: number;
  message: string;
}

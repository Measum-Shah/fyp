// ─── Biometric device client — hardware abstraction ─────────────────────────
// The rest of the HR module (attendanceSyncFromDevice.service.ts,
// biometricDevice.controller.ts) only ever talks to this interface. It never
// imports a device driver directly. That's what lets a real ZKTeco terminal
// (zktecoDeviceClient.ts) and a fake, hardware-free stand-in
// (mockDeviceClient.ts) be swapped in without touching any business logic —
// see deviceClientFactory.ts for how the swap happens.

export interface BiometricDeviceInfo {
  userCounts?: number;
  logCounts?: number;
  logCapacity?: number;
  /** Raw payload from the driver, kept for debugging — not relied on by business logic. */
  raw?: unknown;
}

export interface BiometricUserInput {
  /** ERP staff.id — used as both the device uid and userid, same as the Laravel reference (`$zk->setUser($user->id, $user->id, ...)`). */
  employeeId: number;
  /** Display name shown on the terminal; callers are responsible for pre-truncating to ZKTECO_USER_NAME_MAX_LENGTH. */
  name: string;
}

export interface BiometricAttendanceLog {
  /** The device-side user id a punch was recorded against. Since setUser() registers staff.id as the device userid, this maps 1:1 back to staff.id. */
  deviceUserId: string;
  timestamp: Date;
  /** 0 = time-in, 1 = time-out (ZKTECO_LOG_TYPE). Optional because some drivers/firmwares omit it. */
  type?: number;
}

export interface IBiometricDeviceClient {
  connect(): Promise<void>;
  /** Must be safe to call even if connect() was never called or already failed. */
  disconnect(): Promise<void>;
  getInfo(): Promise<BiometricDeviceInfo>;
  setUser(user: BiometricUserInput): Promise<void>;
  getAttendanceLogs(): Promise<BiometricAttendanceLog[]>;
  /** Wipes all enrolled users/admins from the device. */
  clearUsers(): Promise<void>;
  /** Wipes the device's on-board attendance log. */
  clearAttendanceLogs(): Promise<void>;
}

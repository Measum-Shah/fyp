import {
  BiometricAttendanceLog,
  BiometricDeviceInfo,
  BiometricUserInput,
  IBiometricDeviceClient,
} from "./biometricDevice.types";

/**
 * In-memory stand-in for a physical ZKTeco terminal. Implements the exact
 * same IBiometricDeviceClient interface as ZktecoDeviceClient, so the whole
 * sync flow (upload staff → simulate punches → download/merge attendance)
 * can be exercised — by hand or in automated tests — with no hardware on
 * the network. Selected via BIOMETRIC_DEVICE_DRIVER=mock (see
 * deviceClientFactory.ts).
 *
 * State is per-instance and lives only as long as the process — each
 * request builds a fresh client (see deviceClientFactory.ts), so seeded
 * logs are normally supplied by a test harness holding its own reference to
 * an instance, not by this driver persisting anything.
 */
export class MockBiometricDeviceClient implements IBiometricDeviceClient {
  private connected = false;
  private users = new Map<number, BiometricUserInput>();
  private attendanceLogs: BiometricAttendanceLog[] = [];

  constructor(
    private readonly ip: string,
    private readonly port: number
  ) {}

  /** Test helper — queue punches this "device" will hand back on the next getAttendanceLogs() call. */
  seedAttendanceLogs(logs: BiometricAttendanceLog[]): void {
    this.attendanceLogs.push(...logs);
  }

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async getInfo(): Promise<BiometricDeviceInfo> {
    return {
      userCounts: this.users.size,
      logCounts: this.attendanceLogs.length,
      logCapacity: 100000,
      raw: { ip: this.ip, port: this.port, mock: true },
    };
  }

  async setUser(user: BiometricUserInput): Promise<void> {
    this.users.set(user.employeeId, user);
  }

  async getAttendanceLogs(): Promise<BiometricAttendanceLog[]> {
    return [...this.attendanceLogs];
  }

  async clearUsers(): Promise<void> {
    this.users.clear();
  }

  async clearAttendanceLogs(): Promise<void> {
    this.attendanceLogs = [];
  }
}

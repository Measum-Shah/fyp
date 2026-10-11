import ZKLib from "node-zklib";
import {
  ZKTECO_DEFAULT_CARD_NO,
  ZKTECO_DEFAULT_USER_PASSWORD,
  ZKTECO_DEFAULT_USER_ROLE,
} from "../../constants/biometricDevice.constants";
import {
  BiometricAttendanceLog,
  BiometricDeviceInfo,
  BiometricUserInput,
  IBiometricDeviceClient,
} from "./biometricDevice.types";

const CONNECT_TIMEOUT_MS = 10000;
const INPORT = 4000;

/**
 * Real hardware driver. Wraps `node-zklib` (github.com/caobo171/node-zklib)
 * — see biometricDevice.constants.ts / this repo's README for why that
 * library was chosen. Its actively-maintained, API-compatible fork
 * (`zklib-js`) can be dropped in with no changes beyond the import above,
 * since both expose the same createSocket/getInfo/getUsers/setUser/
 * getAttendances/disconnect method names.
 *
 * Every method here feature-checks the underlying driver before calling it
 * and normalizes its output, because published ZKTeco drivers vary in
 * exactly what shape they hand back (field naming in particular) — this is
 * the one place in the codebase allowed to know about that.
 */
export class ZktecoDeviceClient implements IBiometricDeviceClient {
  private zk: any = null;

  constructor(
    private readonly ip: string,
    private readonly port: number
  ) {}

  async connect(): Promise<void> {
    this.zk = new (ZKLib as any)(this.ip, this.port, CONNECT_TIMEOUT_MS, INPORT);
    await this.zk.createSocket();
  }

  async disconnect(): Promise<void> {
    if (!this.zk) return;
    try {
      if (typeof this.zk.disconnect === "function") {
        await this.zk.disconnect();
      }
    } catch {
      // Best-effort — mirrors the Laravel reference's finally-block
      // disconnect, which never lets a disconnect failure surface.
    } finally {
      this.zk = null;
    }
  }

  async getInfo(): Promise<BiometricDeviceInfo> {
    const info = await this.zk.getInfo();
    return {
      userCounts: info?.userCounts,
      logCounts: info?.logCounts,
      logCapacity: info?.logCapacity,
      raw: info,
    };
  }

  async setUser(user: BiometricUserInput): Promise<void> {
    // setUser(uid, userid, name, password, role, cardno) — staff.id is used
    // as both uid and userid so a punch's device-side user id maps 1:1 back
    // onto staff.id later, same as the Laravel reference.
    await this.zk.setUser(
      user.employeeId,
      String(user.employeeId),
      user.name,
      ZKTECO_DEFAULT_USER_PASSWORD,
      ZKTECO_DEFAULT_USER_ROLE,
      ZKTECO_DEFAULT_CARD_NO
    );
  }

  async getAttendanceLogs(): Promise<BiometricAttendanceLog[]> {
    const result = await this.zk.getAttendances();
    const rows: any[] = Array.isArray(result) ? result : result?.data ?? [];

    const logs: BiometricAttendanceLog[] = [];
    for (const row of rows) {
      const deviceUserId = row?.deviceUserId ?? row?.userId ?? row?.userSn ?? row?.id;
      const rawTimestamp = row?.recordTime ?? row?.timestamp ?? row?.record_time;
      if (deviceUserId === undefined || deviceUserId === null || !rawTimestamp) continue;

      const timestamp = rawTimestamp instanceof Date ? rawTimestamp : new Date(rawTimestamp);
      if (Number.isNaN(timestamp.getTime())) continue;

      logs.push({
        deviceUserId: String(deviceUserId),
        timestamp,
        type: typeof row?.type === "number" ? row.type : undefined,
      });
    }
    return logs;
  }

  async clearUsers(): Promise<void> {
    if (typeof this.zk.clearUsers === "function") {
      await this.zk.clearUsers();
      return;
    }
    if (typeof this.zk.clearAdmin === "function") {
      await this.zk.clearAdmin();
      return;
    }
    throw new Error(
      "Clearing users is not supported by the installed ZKTeco driver. " +
        "Install a driver build that exposes clearUsers()/clearAdmin() (e.g. a recent zklib-js build)."
    );
  }

  async clearAttendanceLogs(): Promise<void> {
    if (typeof this.zk.clearAttendanceLog === "function") {
      await this.zk.clearAttendanceLog();
      return;
    }
    throw new Error(
      "Clearing the attendance log is not supported by the installed ZKTeco driver. " +
        "Install a driver build that exposes clearAttendanceLog()."
    );
  }
}

import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { ATTENDANCE_MACHINE_STATUS } from "../constants/attendance.constants";
import {
  ATTENDANCE_INSERT_CHUNK_SIZE,
  DEFAULT_ZKTECO_PORT,
  ZKTECO_LOG_TYPE,
  ZKTECO_USER_NAME_MAX_LENGTH,
} from "../constants/biometricDevice.constants";
import { createBiometricDeviceClient } from "./biometric/deviceClientFactory";
import { BiometricAttendanceLog, BiometricDeviceInfo, IBiometricDeviceClient } from "./biometric/biometricDevice.types";
import { acquireBiometricSyncLock, releaseBiometricSyncLock } from "./biometric/biometricSyncLock";

// ─── Branch lookup / device config ───────────────────────────────────────────
// Reuses erp_branches.ip / erp_branches.port directly — configuration for a
// branch's biometric device is the existing Branch record, managed through
// the existing Branch endpoints (PUT /api/branches/:id). No separate
// "biometric config" table was introduced.

interface DeviceBranch {
  id: number;
  ip: string;
  port: number;
}

const parsePort = (rawPort: string | null): number => {
  const parsed = rawPort ? parseInt(rawPort, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_ZKTECO_PORT;
};

const getDeviceBranchOrThrow = async (branchId: number): Promise<DeviceBranch> => {
  const branch = await prisma.erpBranches.findFirst({
    where: { id: branchId, deleted_at: null },
    select: { id: true, ip: true, port: true },
  });

  if (!branch) {
    throw AppError.notFound(`Campus with id ${branchId} was not found`);
  }

  if (!branch.ip || branch.ip.trim() === "") {
    throw AppError.badRequest("This campus has no biometric device IP configured", {
      ip: "Set the campus's IP address (PUT /api/branches/:id) before running a biometric operation",
    });
  }

  return { id: branch.id, ip: branch.ip.trim(), port: parsePort(branch.port) };
};

const safeDisconnect = async (client: IBiometricDeviceClient): Promise<void> => {
  try {
    await client.disconnect();
  } catch {
    // Disconnect failures must never mask the operation's real outcome —
    // same as the Laravel reference's finally-block disconnect.
  }
};

const wrapDeviceError = (error: unknown): never => {
  if (error instanceof AppError) throw error;
  const message = error instanceof Error ? error.message : "Unknown device error";
  throw new AppError(`Device not connected or an error occurred: ${message}`, 502);
};

// ─── Test connection ──────────────────────────────────────────────────────────
export const testDeviceConnection = async (branchId: number): Promise<BiometricDeviceInfo> => {
  const branch = await getDeviceBranchOrThrow(branchId);
  const client = createBiometricDeviceClient(branch.ip, branch.port);

  try {
    await client.connect();
    return await client.getInfo();
  } catch (error) {
    return wrapDeviceError(error);
  } finally {
    await safeDisconnect(client);
  }
};

// ─── Clear device (users + attendance log) ───────────────────────────────────
// Mirrors ZktecoController::clear_data (clearUsers + clearAdmin + clearAttendance).
export const clearDevice = async (branchId: number): Promise<void> => {
  const branch = await getDeviceBranchOrThrow(branchId);
  const client = createBiometricDeviceClient(branch.ip, branch.port);

  try {
    await client.connect();
    await client.clearUsers();
    await client.clearAttendanceLogs();
  } catch (error) {
    return wrapDeviceError(error);
  } finally {
    await safeDisconnect(client);
  }
};

// ─── Upload active staff to device ───────────────────────────────────────────
// Mirrors ZktecoController::add_staff_in_branch.
export interface UploadStaffResult {
  total: number;
  uploaded: number;
  failed: { employee_id: number; error: string }[];
}

// `deviceClientOverride` is only ever passed by prisma/seed.ts, which needs
// to hand this a MockBiometricDeviceClient it has already seeded with fake
// users/punches — the factory always builds an *empty* client per call, so
// there's no other way to exercise this real code path without hardware.
// The controller never passes this, so production behavior is unchanged.
export const uploadStaffToDevice = async (
  branchId: number,
  deviceClientOverride?: IBiometricDeviceClient
): Promise<UploadStaffResult> => {
  const branch = await getDeviceBranchOrThrow(branchId);

  const staffList = await prisma.staff.findMany({
    where: { branch_id: branchId, status: "Active", deleted_at: null },
    select: { id: true, first_name: true, last_name: true },
  });

  const client = deviceClientOverride ?? createBiometricDeviceClient(branch.ip, branch.port);
  const result: UploadStaffResult = { total: staffList.length, uploaded: 0, failed: [] };

  try {
    await client.connect();

    for (const staff of staffList) {
      const name = [staff.first_name, staff.last_name].filter(Boolean).join(" ").trim() || `Employee #${staff.id}`;
      try {
        await client.setUser({
          employeeId: staff.id,
          name: name.slice(0, ZKTECO_USER_NAME_MAX_LENGTH),
        });
        result.uploaded++;
      } catch (error) {
        result.failed.push({
          employee_id: staff.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  } catch (error) {
    return wrapDeviceError(error);
  } finally {
    await safeDisconnect(client);
  }

  return result;
};

// ─── Sync attendance from device ─────────────────────────────────────────────
// Mirrors ZktecoController::add_attendance_from_branch. Reuses
// attendance.constants.ts's ATTENDANCE_MACHINE_STATUS (device rows are
// stamped DEVICE, same field the manual Attendance module already reads/
// displays) so this plugs straight into the existing Attendance module —
// Attendance Reports, Leave calculations, Salary Sheets, and Payroll all
// read employee_attendance directly and need no changes.

const pad2 = (n: number): string => String(n).padStart(2, "0");

// Device timestamps are treated as naive wall-clock values (no timezone
// conversion) — same as the Laravel reference, which ran date()/strtotime()
// against the server's local timezone with no explicit TZ handling.
const toDateOnly = (d: Date): string => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const toTimeOnly = (d: Date): string => `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
const timeStringToTimeValue = (hms: string): Date => new Date(`1970-01-01T${hms}.000Z`);

const chunk = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export interface SyncAttendanceResult {
  inserted: number;
  timeOutUpdates: number;
  logsSeen: number;
  message: string;
}

// `deviceClientOverride` — see the comment on uploadStaffToDevice above;
// same reasoning, same seed.ts-only use.
export const syncAttendanceFromDevice = async (
  branchId: number,
  actorId?: number,
  deviceClientOverride?: IBiometricDeviceClient
): Promise<SyncAttendanceResult> => {
  const lockKey = `zkteco_attendance_sync_${branchId}`;
  const lockToken = acquireBiometricSyncLock(lockKey);
  if (lockToken === false) {
    throw AppError.conflict("Sync already running for this campus. Please wait 1-2 minutes and try again.", {
      branch_id: "A biometric sync for this campus is already in progress",
    });
  }

  try {
    const branch = await getDeviceBranchOrThrow(branchId);
    const client = deviceClientOverride ?? createBiometricDeviceClient(branch.ip, branch.port);

    let logs: BiometricAttendanceLog[];
    try {
      await client.connect();
      // Pull everything off the machine, then release the device before
      // touching the database — same ordering as the Laravel reference
      // (getAttendance() first, disconnect, THEN write to the DB).
      logs = await client.getAttendanceLogs();
    } catch (error) {
      return wrapDeviceError(error);
    } finally {
      await safeDisconnect(client);
    }

    if (logs.length === 0) {
      return { inserted: 0, timeOutUpdates: 0, logsSeen: 0, message: "Device connected but no attendance logs found on machine." };
    }

    // IMPORTANT: do NOT filter by MAX(attendance_date) — that cursor skips
    // gap days when only some employees already have a newer date. Every
    // log the machine returns is checked, matching the Laravel reference.
    const datesInDump = new Set<string>();
    for (const log of logs) {
      datesInDump.add(toDateOnly(log.timestamp));
    }

    const existingRows = await prisma.employeeAttendance.findMany({
      where: {
        branch_id: branchId,
        deleted_at: null,
        attendance_date: { in: [...datesInDump].map((d) => new Date(`${d}T00:00:00.000Z`)) },
      },
      select: { id: true, employee_id: true, attendance_date: true },
    });

    // key: "<employee_id>_<YYYY-MM-DD>" -> existing row id
    const existingByKey = new Map<string, number>();
    for (const row of existingRows) {
      if (row.employee_id === null || row.attendance_date === null) continue;
      existingByKey.set(`${row.employee_id}_${toDateOnly(row.attendance_date)}`, row.id);
    }

    const now = new Date();
    const inserts: Prisma.EmployeeAttendanceCreateManyInput[] = [];
    const insertIndexByKey = new Map<string, number>();
    const timeoutUpdates = new Map<number, string>(); // existing row id -> "HH:mm:ss"

    for (const log of logs) {
      const employeeId = Number(log.deviceUserId);
      if (!Number.isInteger(employeeId) || employeeId <= 0) continue;

      const dateStr = toDateOnly(log.timestamp);
      const timeStr = toTimeOnly(log.timestamp);
      const key = `${employeeId}_${dateStr}`;

      const existingId = existingByKey.get(key);
      if (existingId !== undefined) {
        // Already has a row for this employee/day (from a manual entry or
        // an earlier sync) — only a time-out punch updates it, same rule
        // as the Laravel reference.
        if (log.type === ZKTECO_LOG_TYPE.TIME_OUT) {
          timeoutUpdates.set(existingId, timeStr);
        }
        continue;
      }

      const pendingIndex = insertIndexByKey.get(key);
      if (pendingIndex !== undefined) {
        // Second (or later) punch this run for a day that isn't in the DB
        // yet — a time-out punch updates the pending insert's timeOut.
        if (log.type === ZKTECO_LOG_TYPE.TIME_OUT) {
          const pending = inserts[pendingIndex];
          if (pending) pending.timeOut = timeStringToTimeValue(timeStr);
        }
        continue;
      }

      inserts.push({
        machine_status: ATTENDANCE_MACHINE_STATUS.DEVICE,
        branch_id: branchId,
        employee_id: employeeId,
        attendance_date: new Date(`${dateStr}T00:00:00.000Z`),
        timeIn: timeStringToTimeValue(timeStr),
        timeOut: null,
        created_by: actorId ?? null,
        updated_by: actorId ?? null,
        created_at: now,
        updated_at: now,
      });
      insertIndexByKey.set(key, inserts.length - 1);
    }

    for (const batch of chunk(inserts, ATTENDANCE_INSERT_CHUNK_SIZE)) {
      await prisma.employeeAttendance.createMany({ data: batch });
    }

    for (const [id, timeOut] of timeoutUpdates) {
      await prisma.employeeAttendance.update({
        where: { id },
        data: { timeOut: timeStringToTimeValue(timeOut), updated_by: actorId ?? null, updated_at: now },
      });
    }

    return {
      inserted: inserts.length,
      timeOutUpdates: timeoutUpdates.size,
      logsSeen: logs.length,
      message: `Attendance synced successfully! New: ${inserts.length}, TimeOut updates: ${timeoutUpdates.size}.`,
    };
  } finally {
    releaseBiometricSyncLock(lockKey, lockToken);
  }
};
// ─── Biometric Device (ZKTeco) — Backend Constants ──────────────────────────
// Mirrors ZktecoController.php (Laravel reference implementation). This
// module talks to physical ZKTeco attendance terminals over the ZK binary
// protocol (TCP, default port 4370) and syncs their logs into
// employee_attendance — see attendanceSyncFromDevice.service.ts.
//
// Device connectivity is configured on erp_branches.ip / erp_branches.port
// (already present in the schema — see branch.constants.ts /
// branch.validator.ts). No new columns or tables were needed for this
// module; branches are configured through the existing Branch endpoints
// (PUT /api/branches/:id with { ip, port }).

// erp_branches.port is stored as a free-text VARCHAR (legacy column, shared
// with unrelated branch config), so it isn't guaranteed to hold a valid
// port number. Fall back to the ZKTeco factory-default port when it's
// missing or not numeric — same default Laravel hardcoded in
// ZktecoController::add_attendance_from_branch (`new ZKTeco($branch->ip, 4370)`).
export const DEFAULT_ZKTECO_PORT = 4370;

// ZKTeco device firmware truncates display names to 20 characters — mirrors
// `$name = substr($name, 0, 20)` in the Laravel reference.
export const ZKTECO_USER_NAME_MAX_LENGTH = 20;

// The Laravel reference always registers device users as role "0" (normal
// user, not device admin) with a fixed PIN password ("123") and a dummy
// card number. Kept identical here for behavioral parity — this PIN is not
// a login credential, only a fallback verification method on the terminal
// itself when fingerprint/face matching fails.
export const ZKTECO_DEFAULT_USER_ROLE = 0;
export const ZKTECO_DEFAULT_USER_PASSWORD = "123";
export const ZKTECO_DEFAULT_CARD_NO = 0;

// device log "type": 0 = time-in punch, 1 = time-out punch (ZK protocol
// convention, same values the Laravel reference compares against
// `$single['type'] == 1`).
export const ZKTECO_LOG_TYPE = {
  TIME_IN: 0,
  TIME_OUT: 1,
} as const;

// ─── Sync lock (prevents two concurrent syncs hammering the same device) ───
// In-memory equivalent of the Laravel reference's `cache()->add(...)` lock.
// Single-process only — see biometricSyncLock.ts's header comment for the
// horizontal-scaling caveat.
export const SYNC_LOCK_TTL_MS = 5 * 60 * 1000; // auto-expire in 5 minutes
export const SYNC_LOCK_STALE_AFTER_MS = 90 * 1000; // reclaimable if no finish in 90s

// How many attendance rows to insert per batch — mirrors
// `array_chunk($inserts, 500)` in the Laravel reference.
export const ATTENDANCE_INSERT_CHUNK_SIZE = 500;

// Which IBiometricDeviceClient implementation the factory hands back.
// "mock" lets the rest of the HR module (and any tests) exercise the full
// sync flow with no physical device on the network. Defaults to the real
// driver so nothing has to be configured for production use.
export const BIOMETRIC_DEVICE_DRIVER = (process.env.BIOMETRIC_DEVICE_DRIVER || "zkteco").toLowerCase();

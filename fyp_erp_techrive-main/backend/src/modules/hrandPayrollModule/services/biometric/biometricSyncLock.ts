import { SYNC_LOCK_STALE_AFTER_MS, SYNC_LOCK_TTL_MS } from "../../constants/biometricDevice.constants";

// ─── Biometric attendance sync lock ──────────────────────────────────────────
// Node/TS equivalent of the Laravel reference's acquireZktecoSyncLock /
// releaseZktecoSyncLock, which used `cache()->add(...)`. This codebase has
// no cache/Redis layer (see repo-wide search — nothing else uses one), so
// the lock lives in a plain in-process Map instead.
//
// CAVEAT: this only serializes syncs within a single Node process. If this
// backend is ever run as more than one instance behind a load balancer,
// swap the Map below for a shared store (Redis SETNX, or a
// `biometric_sync_locks` table) — the acquire/release function signatures
// here were kept deliberately simple so that swap doesn't touch any caller.

interface LockEntry {
  token: string;
  startedAt: number;
  expiresAt: number;
}

const locks = new Map<string, LockEntry>();

const makeToken = (): string => `${Date.now()}_${Math.random().toString(36).slice(2)}`;

/**
 * Returns a lock token on success, or `false` if another sync is actively
 * running for this key. A lock older than SYNC_LOCK_STALE_AFTER_MS is
 * treated as abandoned (hung device call / crashed process) and reclaimed,
 * same recovery behavior as the Laravel reference.
 */
export const acquireBiometricSyncLock = (key: string): string | false => {
  const now = Date.now();
  const existing = locks.get(key);

  if (!existing || existing.expiresAt <= now || now - existing.startedAt >= SYNC_LOCK_STALE_AFTER_MS) {
    const token = makeToken();
    locks.set(key, { token, startedAt: now, expiresAt: now + SYNC_LOCK_TTL_MS });
    return token;
  }

  return false;
};

/** Clears the lock only if the caller still owns it, so a slow, already-superseded sync can't clear a newer one's lock. */
export const releaseBiometricSyncLock = (key: string, token: string | false): void => {
  if (!token) return;
  const existing = locks.get(key);
  if (existing && existing.token === token) {
    locks.delete(key);
  }
};

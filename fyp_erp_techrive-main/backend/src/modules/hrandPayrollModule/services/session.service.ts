import crypto from "crypto";
import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { AppError } from "../utils/app-error";
import { RequestContext } from "../utils/request-context.util";
import {
  ACTIVITY_TOUCH_INTERVAL_MS,
  LOGIN_STATUS,
  LOGOUT_REASON,
  LogoutReason,
  SESSION_ACTIVE,
  SESSION_IDLE_TIMEOUT_MS,
  SESSION_INACTIVE,
} from "../constants/sessionLog.constants";

// ─── Shared select ────────────────────────────────────────────────────────
const sessionSelect = {
  id: true,
  user_id: true,
  user_name: true,
  user_email: true,
  role_id: true,
  branch_id: true,
  login_time: true,
  logout_time: true,
  session_duration_seconds: true,
  ip_address: true,
  user_agent: true,
  browser: true,
  os: true,
  device: true,
  is_active: true,
  login_status: true,
  failure_reason: true,
  logout_reason: true,
  last_activity_at: true,
  created_at: true,
  // session_token intentionally excluded from every read path below — it's
  // a bearer-equivalent credential (embedded verbatim in the JWT as `sid`),
  // so it's never returned to the client once issued at login time.
} satisfies Prisma.ErpUserSessionsSelect;

export type SessionRecord = Prisma.ErpUserSessionsGetPayload<{ select: typeof sessionSelect }>;

// ─── Start session (successful login) ────────────────────────────────────
// Returns the raw session_token so the caller (auth.controller.ts) can
// embed it in the JWT as `sid`. This is the ONLY place that token is ever
// returned from the service layer.
export const startSession = async (params: {
  userId: number;
  userName: string;
  userEmail: string;
  roleId?: number | null;
  branchId?: number | null;
  context: RequestContext;
}): Promise<{ sessionId: number; sessionToken: string }> => {
  const sessionToken = crypto.randomUUID();
  const now = new Date();

  const session = await prisma.erpUserSessions.create({
    data: {
      user_id: params.userId,
      user_name: params.userName,
      user_email: params.userEmail,
      role_id: params.roleId ?? null,
      branch_id: params.branchId ?? null,
      session_token: sessionToken,
      login_time: now,
      ip_address: params.context.ipAddress,
      user_agent: params.context.userAgent,
      browser: params.context.browser,
      os: params.context.os,
      device: params.context.device,
      is_active: SESSION_ACTIVE,
      login_status: LOGIN_STATUS.SUCCESS,
      last_activity_at: now,
      created_at: now,
      updated_at: now,
    },
    select: { id: true },
  });

  return { sessionId: session.id, sessionToken };
};

// ─── Record failed login attempt ─────────────────────────────────────────
// user_id may be null (email didn't match any account at all — we still
// want the attempt on record for security monitoring, just without a user
// link). Never throws — a logging failure must not affect the login
// response the caller already decided on.
export const recordFailedLogin = async (params: {
  userId: number | null;
  attemptedEmail: string;
  reason: string;
  context: RequestContext;
}): Promise<void> => {
  try {
    const now = new Date();
    await prisma.erpUserSessions.create({
      data: {
        user_id: params.userId,
        user_email: params.attemptedEmail,
        login_time: now,
        ip_address: params.context.ipAddress,
        user_agent: params.context.userAgent,
        browser: params.context.browser,
        os: params.context.os,
        device: params.context.device,
        is_active: SESSION_INACTIVE,
        login_status: LOGIN_STATUS.FAILED,
        failure_reason: params.reason.slice(0, 255),
        created_at: now,
        updated_at: now,
      },
    });
  } catch (error) {
    console.error("recordFailedLogin error:", error);
  }
};

// ─── End session (logout / expiry / forced) ──────────────────────────────
export const endSessionByToken = async (
  sessionToken: string,
  reason: LogoutReason = LOGOUT_REASON.MANUAL
): Promise<SessionRecord | null> => {
  const session = await prisma.erpUserSessions.findFirst({
    where: { session_token: sessionToken, is_active: SESSION_ACTIVE },
    select: { id: true, login_time: true },
  });

  if (!session) return null;

  const logoutTime = new Date();
  const durationSeconds = session.login_time
    ? Math.max(0, Math.floor((logoutTime.getTime() - session.login_time.getTime()) / 1000))
    : null;

  return prisma.erpUserSessions.update({
    where: { id: session.id },
    data: {
      logout_time: logoutTime,
      session_duration_seconds: durationSeconds,
      is_active: SESSION_INACTIVE,
      logout_reason: reason,
      last_activity_at: logoutTime,
      updated_at: logoutTime,
    },
    select: sessionSelect,
  });
};

// ─── Force logout (admin action, by session id) ──────────────────────────
export const forceLogoutSession = async (
  id: number,
  actorId: number | undefined
): Promise<SessionRecord> => {
  if (!actorId) {
    throw AppError.badRequest("Unable to determine the current user for this action");
  }

  const session = await prisma.erpUserSessions.findFirst({
    where: { id, is_active: SESSION_ACTIVE },
    select: { id: true, login_time: true },
  });

  if (!session) {
    throw AppError.notFound(`Active session with id ${id} was not found`);
  }

  const logoutTime = new Date();
  const durationSeconds = session.login_time
    ? Math.max(0, Math.floor((logoutTime.getTime() - session.login_time.getTime()) / 1000))
    : null;

  return prisma.erpUserSessions.update({
    where: { id: session.id },
    data: {
      logout_time: logoutTime,
      session_duration_seconds: durationSeconds,
      is_active: SESSION_INACTIVE,
      logout_reason: LOGOUT_REASON.FORCED,
      last_activity_at: logoutTime,
      updated_at: logoutTime,
    },
    select: sessionSelect,
  });
};

// ─── Throttled last-activity touch ────────────────────────────────────────
// Called from auth.middleware.ts on every authenticated request. Writing
// to the DB on every single request would be wasteful and would directly
// violate the "avoid unnecessary database writes" / "must not block normal
// user requests" requirements, so:
//   1. An in-memory map tracks the last time each session_token was
//      touched; if it was touched within ACTIVITY_TOUCH_INTERVAL_MS, this
//      is a no-op (no DB round-trip at all).
//   2. When a write IS due, it's fired without being awaited by the
//      caller (see auth.middleware.ts) so it can never add latency to the
//      request/response cycle. Errors are swallowed (logged only) since a
//      missed activity-timestamp update is not worth failing a request over.
// This is process-local state, which is an accepted trade-off for a single
// backend instance; a multi-instance deployment would want this moved to
// a shared cache (e.g. Redis) — noted for future scaling.
const lastTouchAt = new Map<string, number>();

export const touchSessionActivity = (sessionToken: string): void => {
  const now = Date.now();
  const last = lastTouchAt.get(sessionToken) ?? 0;
  if (now - last < ACTIVITY_TOUCH_INTERVAL_MS) return;

  lastTouchAt.set(sessionToken, now);

  prisma.erpUserSessions
    .updateMany({
      where: { session_token: sessionToken, is_active: SESSION_ACTIVE },
      data: { last_activity_at: new Date() },
    })
    .catch((error: unknown) => {
      console.error("touchSessionActivity error:", error);
    });
};

// ─── Is a given session still active? (used by auth.middleware.ts) ───────
// A single indexed lookup on the unique session_token column. This IS an
// extra query per authenticated request — a deliberate trade-off documented
// in auth.middleware.ts, needed so "force logout" actually revokes access
// rather than just being a label in a report.
export const isSessionActive = async (sessionToken: string): Promise<boolean> => {
  const session = await prisma.erpUserSessions.findUnique({
    where: { session_token: sessionToken },
    select: { is_active: true },
  });
  return session?.is_active === SESSION_ACTIVE;
};

// ─── List sessions (Sessions monitoring page) ─────────────────────────────
interface ListSessionsParams {
  page: number;
  limit: number;
  userId?: number;
  isActive?: boolean;
  loginStatus?: string;
  search?: string; // matches user_name / user_email
}

interface ListSessionsResult {
  data: (SessionRecord & { isOnline: boolean })[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const listSessions = async (params: ListSessionsParams): Promise<ListSessionsResult> => {
  const { page, limit, userId, isActive, loginStatus, search } = params;

  const where: Prisma.ErpUserSessionsWhereInput = {
    ...(userId ? { user_id: userId } : {}),
    ...(isActive !== undefined ? { is_active: isActive ? SESSION_ACTIVE : SESSION_INACTIVE } : {}),
    ...(loginStatus ? { login_status: loginStatus } : {}),
    ...(search
      ? {
          OR: [
            { user_name: { contains: search, mode: "insensitive" } },
            { user_email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rows] = await prisma.$transaction([
    prisma.erpUserSessions.count({ where }),
    prisma.erpUserSessions.findMany({
      where,
      select: sessionSelect,
      orderBy: { login_time: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  // "Online" = active AND last activity within the idle timeout window —
  // an active-but-idle-for-40-minutes session is still technically
  // is_active=1 in the DB (nothing closed it) but shouldn't be shown as
  // "online" on the dashboard. Display-only distinction, no DB write.
  const now = Date.now();
  const data = rows.map((row: SessionRecord) => ({
    ...row,
    isOnline:
      row.is_active === SESSION_ACTIVE &&
      !!row.last_activity_at &&
      now - row.last_activity_at.getTime() < SESSION_IDLE_TIMEOUT_MS,
  }));

  return {
    data,
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

// ─── Active sessions summary (dashboard widget) ───────────────────────────
export const getActiveSessionsSummary = async (): Promise<{ activeCount: number; onlineCount: number }> => {
  const activeSessions = await prisma.erpUserSessions.findMany({
    where: { is_active: SESSION_ACTIVE },
    select: { last_activity_at: true },
  });

  const now = Date.now();
  const onlineCount = activeSessions.filter(
    (s: { last_activity_at: Date | null }) =>
      !!s.last_activity_at && now - s.last_activity_at.getTime() < SESSION_IDLE_TIMEOUT_MS
  ).length;

  return { activeCount: activeSessions.length, onlineCount };
};

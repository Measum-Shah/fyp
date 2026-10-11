import { Request } from "express";

// ─── RequestContext ──────────────────────────────────────────────────────────
// Shared by session.service.ts (login/logout tracking) and
// activityLog.service.ts (audit trail) so both capture IP/browser/OS/device
// the exact same way. Deliberately dependency-free (regex-based UA parsing)
// rather than pulling in a package like ua-parser-js — the project has no
// existing UA-parsing dependency, and the requirements only ask for a
// human-readable browser/OS/device label, not exhaustive version detection.

export interface RequestContext {
  ipAddress: string | null;
  userAgent: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
}

// ─── IP extraction ────────────────────────────────────────────────────────
// Prefers X-Forwarded-For (first hop) for deployments behind a proxy/load
// balancer, falls back to the raw socket address.
const extractIpAddress = (req: Request): string | null => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }
  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0] ?? null;
  }
  return req.socket?.remoteAddress || req.ip || null;
};

// ─── User-Agent parsing ──────────────────────────────────────────────────
// Order matters — e.g. Edge and Opera both contain "Chrome" in their UA
// string, so they must be checked before the generic Chrome match.
const parseBrowser = (ua: string): string => {
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua) || /Opera/.test(ua)) return "Opera";
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return "Chrome";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/Safari\//.test(ua) && /Version\//.test(ua)) return "Safari";
  if (/MSIE|Trident/.test(ua)) return "Internet Explorer";
  return "Unknown";
};

const parseOS = (ua: string): string => {
  if (/Windows NT 10/.test(ua)) return "Windows 10/11";
  if (/Windows NT/.test(ua)) return "Windows";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown";
};

const parseDevice = (ua: string): string => {
  if (/iPad|Tablet/.test(ua)) return "Tablet";
  if (/Mobi|Android.*Mobile|iPhone/.test(ua)) return "Mobile";
  return "Desktop";
};

// ─── getRequestContext ────────────────────────────────────────────────────
// Single entry point — call once per request, reuse the result rather than
// re-parsing the same header multiple times.
export const getRequestContext = (req: Request): RequestContext => {
  const ipAddress = extractIpAddress(req);
  const userAgentHeader = req.headers["user-agent"];
  const userAgent = typeof userAgentHeader === "string" ? userAgentHeader : null;

  if (!userAgent) {
    return { ipAddress, userAgent: null, browser: null, os: null, device: null };
  }

  return {
    ipAddress,
    userAgent: userAgent.slice(0, 512), // matches user_agent VARCHAR(512)
    browser: parseBrowser(userAgent),
    os: parseOS(userAgent),
    device: parseDevice(userAgent),
  };
};

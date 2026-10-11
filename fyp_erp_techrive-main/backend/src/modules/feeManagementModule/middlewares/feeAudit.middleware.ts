import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { FEE_AUDIT_ACTIONS } from "../constants/feeAudit.constants";
import { recordFeeActivity } from "../services/feeAudit.service";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const inferAction = (method: string, path: string): string => {
  const p = path.toLowerCase();
  if (p.includes("/payments") || p.includes("/process") || p.includes("/record-payment")) {
    return FEE_AUDIT_ACTIONS.PAYMENT;
  }
  if (p.includes("/discount") || p.includes("/scholarship") || p.includes("/concession")) {
    return FEE_AUDIT_ACTIONS.DISCOUNT;
  }
  if (p.includes("/late-fee")) return FEE_AUDIT_ACTIONS.LATE_FEE;
  if (p.includes("/notification")) return FEE_AUDIT_ACTIONS.NOTIFICATION;
  if (method === "DELETE") return FEE_AUDIT_ACTIONS.DELETE;
  if (p.includes("/status")) return FEE_AUDIT_ACTIONS.STATUS_CHANGE;
  if (method === "POST") return FEE_AUDIT_ACTIONS.CREATE;
  if (method === "PUT" || method === "PATCH") return FEE_AUDIT_ACTIONS.UPDATE;
  return FEE_AUDIT_ACTIONS.CONFIG;
};

const inferRecordType = (path: string): string => {
  const parts = path.replace(/^\/api\/fee\/?/, "").split("/").filter(Boolean);
  return parts[0] || "fee";
};

/**
 * Fee Management–scoped audit middleware.
 * Logs mutating /api/fee requests into existing erp_activity_logs.
 * Does not modify HR middleware or auth.
 */
export const feeAuditMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!MUTATING.has(req.method)) return next();

  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    try {
      const authReq = req as AuthRequest;
      const status = res.statusCode || 200;
      if (status >= 200 && status < 400) {
        const path = req.originalUrl || req.url || "";
        void recordFeeActivity({
          userId: authReq.user?.id ?? null,
          userName:
            (authReq.user as { name?: string; email?: string } | undefined)?.name ||
            (authReq.user as { email?: string } | undefined)?.email ||
            null,
          roleId: (authReq.user as { role_id?: number } | undefined)?.role_id ?? null,
          branchId: authReq.user?.branch_id ?? null,
          action: inferAction(req.method, path),
          recordType: inferRecordType(path),
          recordId: (req.params as { id?: string })?.id || null,
          newValues: sanitizeBody(req.body),
          description: `${req.method} ${path.split("?")[0]}`,
          ipAddress:
            (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
            req.socket.remoteAddress ||
            null,
          userAgent: req.headers["user-agent"] || null,
          requestMethod: req.method,
          endpoint: path.split("?")[0],
        });
      }
    } catch (err) {
      console.error("[FeeAudit] middleware error:", err);
    }
    return originalJson(body);
  }) as typeof res.json;

  next();
};

const sanitizeBody = (body: unknown) => {
  if (!body || typeof body !== "object") return undefined;
  const clone = { ...(body as Record<string, unknown>) };
  for (const key of Object.keys(clone)) {
    if (/password|secret|token|api_key|apikey/i.test(key)) {
      clone[key] = "[REDACTED]";
    }
  }
  return clone;
};

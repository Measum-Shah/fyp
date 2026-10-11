import { NextFunction, Response } from "express";
import { AuthRequest } from "../../../middlewares/auth.middleware";
import { getRequestContext } from "../utils/request-context.util";
import { recordActivity } from "../services/activityLog.service";

// ─── auditLog ────────────────────────────────────────────────────────────
// Drop-in middleware for any existing write route (POST/PUT/PATCH/DELETE)
// that should leave an entry in erp_activity_logs. Designed so wiring a
// new controller up takes one line in its routes file — no changes to the
// controller itself are required.
//
// Usage (see employee.routes.ts / branch.routes.ts / leaveRequest.routes.ts
// / loanRequest.routes.ts / biometricDevice.routes.ts for real examples):
//
//   router.post(
//     "/",
//     validate(createEmployeeSchema, "body"),
//     auditLog({ module: ACTIVITY_MODULE.EMPLOYEE, action: ACTIVITY_ACTION.CREATED }),
//     createEmployee
//   );
//
// How it works:
//   1. (optional) loadPrevious(req) runs BEFORE the controller, so it can
//      fetch the record's current state for update/delete actions. Any
//      error here is swallowed — a failed "load previous state for
//      logging" must never block the actual request the user is making.
//   2. res.json is wrapped so that once the controller sends its response,
//      IF the response was a success (status < 400), an activity_log row
//      is written using body.data as the "new values". This write is
//      fire-and-forget (not awaited) so it can never add latency to the
//      response already sent to the client — see recordActivity()'s own
//      try/catch for why a logging failure is safe to ignore here.
//   3. Sensitive fields (password, token, secret, etc.) are redacted by
//      recordActivity() → maskSensitiveFields() before anything is
//      persisted — this middleware does not need to know which fields are
//      sensitive per-module, that's handled centrally.

export interface AuditLogOptions {
  module: string;
  // Static action string, or resolved per-request (e.g. deriving
  // "approved"/"rejected" from req.body for a status-change endpoint).
  action: string | ((req: AuthRequest, responseBody: any) => string);
  recordType?: string;
  // Defaults to req.params.id, then responseBody?.data?.id.
  getRecordId?: (req: AuthRequest, responseBody: any) => string | number | undefined;
  // Fetch the record's state BEFORE the controller mutates it — needed for
  // update/status-change/delete actions to populate previous_values.
  loadPrevious?: (req: AuthRequest) => Promise<unknown>;
  description?: (req: AuthRequest, responseBody: any) => string;
}

export const auditLog = (options: AuditLogOptions) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    let previousValues: unknown;

    if (options.loadPrevious) {
      try {
        previousValues = await options.loadPrevious(req);
      } catch (error) {
        // A record that doesn't exist yet (e.g. bad :id) is the
        // controller's job to reject with 404 — we just log without
        // previous_values in that case rather than failing the request.
        previousValues = undefined;
      }
    }

    const originalJson = res.json.bind(res);

    res.json = ((body: any) => {
      if (res.statusCode < 400) {
        const context = getRequestContext(req);
        const action = typeof options.action === "function" ? options.action(req, body) : options.action;
        const recordId = options.getRecordId
          ? options.getRecordId(req, body)
          : (req.params?.id as string | undefined) ?? body?.data?.id;

        recordActivity({
          userId: req.user?.id,
          userName: req.user?.name,
          roleId: req.user?.role_id,
          branchId: req.user?.branch_id,
          module: options.module,
          action,
          recordType: options.recordType ?? options.module,
          recordId,
          previousValues,
          newValues: body?.data,
          description: options.description ? options.description(req, body) : undefined,
          context,
          requestMethod: req.method,
          endpoint: req.originalUrl,
        }).catch((error) => {
          console.error("auditLog middleware — recordActivity failed:", error);
        });
      }

      return originalJson(body);
    }) as Response["json"];

    next();
  };
};

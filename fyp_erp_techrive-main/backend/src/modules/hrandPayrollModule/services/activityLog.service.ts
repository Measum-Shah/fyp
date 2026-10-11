import { prisma } from "../../../config/db";
import { Prisma } from "../../../generated/prisma/client";
import { RequestContext } from "../utils/request-context.util";
import { maskSensitiveFields } from "../utils/mask-sensitive.util";
import { diffActivityValues } from "../utils/diff-activity-values.util";

// --- Shared select ----------------------------------------------------------
const activityLogSelect = {
  id: true,
  user_id: true,
  user_name: true,
  role_id: true,
  branch_id: true,
  module: true,
  action: true,
  record_type: true,
  record_id: true,
  previous_values: true,
  new_values: true,
  description: true,
  ip_address: true,
  user_agent: true,
  request_method: true,
  endpoint: true,
  created_at: true,
} satisfies Prisma.ErpActivityLogsSelect;

export type ActivityLogRecord = Omit<Prisma.ErpActivityLogsGetPayload<{ select: typeof activityLogSelect }>, "id"> & { id: string };

// BigSerial `id` deserializes as a JS BigInt via Prisma, and BigInt has no
// default JSON.stringify() support - res.json() would throw
// "Do not know how to serialize a BigInt" the first time this table has a
// row. Rather than adding a global BigInt.prototype.toJSON polyfill (which
// would silently change serialization behavior for any other BigInt field
// anywhere else in the app), the conversion is done locally, once, right
// here - the only place ErpActivityLogs rows leave the service layer.
// Also the point where `previous_values` / `new_values` are narrowed down
// to only the fields that actually changed (see diff-activity-values.util.ts)
// before the row is handed back to the Activity Log API/UI. The full
// snapshots remain untouched in the database - only this API-facing shape
// is reduced.
const toActivityLogRecord = (
  row: Prisma.ErpActivityLogsGetPayload<{ select: typeof activityLogSelect }>
): ActivityLogRecord => {
  const { previousValues, newValues } = diffActivityValues(row.previous_values, row.new_values);
  return {
    ...row,
    id: row.id.toString(),
    previous_values: previousValues as typeof row.previous_values,
    new_values: newValues as typeof row.new_values,
  };
};

// --- Record an activity ------------------------------------------------------
// The single write path into erp_activity_logs. Deliberately swallows its
// own errors (logged only) - an audit-log write failing must never take
// down the request that triggered it (see auditLog.middleware.ts, which
// calls this fire-and-forget after the response has already been sent).
export const recordActivity = async (params: {
  userId?: number | null;
  userName?: string | null;
  roleId?: number | null;
  branchId?: number | null;
  module: string;
  action: string;
  recordType?: string | null;
  recordId?: string | number | null;
  previousValues?: unknown;
  newValues?: unknown;
  description?: string | null;
  context: RequestContext;
  requestMethod?: string;
  endpoint?: string;
}): Promise<void> => {
  try {
    await prisma.erpActivityLogs.create({
      data: {
        user_id: params.userId ?? null,
        user_name: params.userName ?? null,
        role_id: params.roleId ?? null,
        branch_id: params.branchId ?? null,
        module: params.module,
        action: params.action,
        record_type: params.recordType ?? null,
        record_id: params.recordId !== undefined && params.recordId !== null ? String(params.recordId) : null,
        previous_values:
          params.previousValues !== undefined
            ? (maskSensitiveFields(params.previousValues) as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        new_values:
          params.newValues !== undefined
            ? (maskSensitiveFields(params.newValues) as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        description: params.description ? params.description.slice(0, 500) : null,
        ip_address: params.context.ipAddress,
        user_agent: params.context.userAgent,
        request_method: params.requestMethod ?? null,
        endpoint: params.endpoint ? params.endpoint.slice(0, 255) : null,
        created_at: new Date(),
      },
    });
  } catch (error) {
    console.error("recordActivity error:", error);
  }
};

// --- List activity logs (Activity Log monitoring page) ----------------------
interface ListActivityLogsParams {
  page: number;
  limit: number;
  userId?: number;
  module?: string;
  action?: string;
  recordType?: string;
  recordId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string; // matches user_name / description
}

interface ListActivityLogsResult {
  data: ActivityLogRecord[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const listActivityLogs = async (params: ListActivityLogsParams): Promise<ListActivityLogsResult> => {
  const { page, limit, userId, module, action, recordType, recordId, dateFrom, dateTo, search } = params;

  const where: Prisma.ErpActivityLogsWhereInput = {
    ...(userId ? { user_id: userId } : {}),
    ...(module ? { module } : {}),
    ...(action ? { action } : {}),
    ...(recordType ? { record_type: recordType } : {}),
    ...(recordId ? { record_id: recordId } : {}),
    ...(dateFrom || dateTo
      ? {
          created_at: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { user_name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, data] = await prisma.$transaction([
    prisma.erpActivityLogs.count({ where }),
    prisma.erpActivityLogs.findMany({
      where,
      select: activityLogSelect,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    data: data.map(toActivityLogRecord),
    meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};
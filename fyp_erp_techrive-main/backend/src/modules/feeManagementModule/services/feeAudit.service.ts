import { prisma } from "../../../config/db";
import { FEE_AUDIT_MODULE } from "../constants/feeAudit.constants";

/**
 * Fee-local write path into existing erp_activity_logs.
 * Does not modify the HR activity-log module — reuses the same table.
 * Errors are swallowed so audit failures never break Fee Management requests.
 */
export const recordFeeActivity = async (params: {
  userId?: number | null;
  userName?: string | null;
  roleId?: number | null;
  branchId?: number | null;
  action: string;
  recordType?: string | null;
  recordId?: string | number | null;
  previousValues?: unknown;
  newValues?: unknown;
  description?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestMethod?: string | null;
  endpoint?: string | null;
}): Promise<void> => {
  try {
    await prisma.erpActivityLogs.create({
      data: {
        user_id: params.userId ?? null,
        user_name: params.userName ?? null,
        role_id: params.roleId ?? null,
        branch_id: params.branchId ?? null,
        module: FEE_AUDIT_MODULE,
        action: params.action,
        record_type: params.recordType ?? null,
        record_id:
          params.recordId !== undefined && params.recordId !== null
            ? String(params.recordId)
            : null,
        previous_values:
          params.previousValues !== undefined
            ? (params.previousValues as object)
            : undefined,
        new_values:
          params.newValues !== undefined ? (params.newValues as object) : undefined,
        description: params.description
          ? params.description.slice(0, 500)
          : null,
        ip_address: params.ipAddress ?? null,
        user_agent: params.userAgent ?? null,
        request_method: params.requestMethod ?? null,
        endpoint: params.endpoint ? params.endpoint.slice(0, 255) : null,
        created_at: new Date(),
      },
    });
  } catch (error) {
    console.error("[FeeAudit] recordFeeActivity error:", error);
  }
};

export const listFeeAuditTrail = async (params: {
  page?: number;
  limit?: number;
  action?: string;
  record_type?: string;
  user_id?: number;
  branch_id?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
}) => {
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 100);
  const skip = (page - 1) * limit;

  const and: Array<Record<string, unknown>> = [
    {
      OR: [
        { module: FEE_AUDIT_MODULE },
        { endpoint: { startsWith: "/api/fee" } },
        { endpoint: { contains: "/fee/" } },
      ],
    },
  ];

  if (params.action) and.push({ action: params.action });
  if (params.record_type) and.push({ record_type: params.record_type });
  if (params.user_id) and.push({ user_id: params.user_id });
  if (params.branch_id) and.push({ branch_id: params.branch_id });
  if (params.date_from || params.date_to) {
    const created: Record<string, Date> = {};
    if (params.date_from) created.gte = new Date(params.date_from);
    if (params.date_to) {
      const end = new Date(params.date_to);
      end.setHours(23, 59, 59, 999);
      created.lte = end;
    }
    and.push({ created_at: created });
  }
  if (params.search) {
    and.push({
      OR: [
        { user_name: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
        { record_type: { contains: params.search, mode: "insensitive" } },
        { action: { contains: params.search, mode: "insensitive" } },
      ],
    });
  }

  const where = { AND: and };

  const [rows, total] = await Promise.all([
    prisma.erpActivityLogs.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    prisma.erpActivityLogs.count({ where }),
  ]);

  return {
    items: rows.map((r) => ({
      ...r,
      id: r.id.toString(),
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

import { prisma } from "../../../config/db";

export const getPeriodClosings = async () => {
  return await prisma.accPeriodClosing.findMany({
    orderBy: { period_month: "desc" },
  });
};

export const closePeriod = async (data: { fiscal_year: number; period_month: number; period_name: string }) => {
  return await prisma.accPeriodClosing.create({
    data: {
      fiscal_year: data.fiscal_year,
      period_month: data.period_month,
      period_name: data.period_name,
      status: "LOCKED",
      closed_at: new Date(),
    },
  });
};

export const getAuditLogs = async () => {
  return await prisma.accAuditTrail.findMany({
    orderBy: { created_at: "desc" },
    take: 100,
  });
};

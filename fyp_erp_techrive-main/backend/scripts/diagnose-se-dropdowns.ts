import "dotenv/config";
import { prisma } from "../src/config/db";
import { StudentEnrollmentService } from "../src/modules/AcademicModule/services/studentEnrollment.service";

async function main() {
  // Raw table state
  const raw = await prisma.$queryRawUnsafe<any[]>(`
    SELECT id, title, branch_id, status, deleted_at IS NULL AS deleted_null
    FROM active_sessions
    WHERE id BETWEEN 1 AND 5
    ORDER BY id
  `);
  console.log("RAW_active_sessions", JSON.stringify(raw, null, 2));

  const rawAss = await prisma.$queryRawUnsafe<any[]>(`
    SELECT id, active_session_id, section_id
    FROM active_session_sections
    WHERE id BETWEEN 1 AND 10
    ORDER BY id
  `);
  console.log("RAW_active_session_sections", JSON.stringify(rawAss, null, 2));

  // Prisma findMany with current where clause
  const prismaRows = await prisma.activeSessions.findMany({
    where: {
      deleted_at: null,
      NOT: {
        OR: [
          { status: "Inactive" },
          { status: "inactive" },
          { status: "Deleted" },
          { status: "0" },
        ],
      },
      branch_id: 1,
    },
    select: {
      id: true,
      title: true,
      branch_id: true,
      status: true,
    },
    orderBy: { id: "asc" },
  });
  console.log("PRISMA_branch1", JSON.stringify(prismaRows, null, 2));

  // Simpler Active only
  const simple = await prisma.activeSessions.findMany({
    where: { branch_id: 1, status: "Active" },
    select: { id: true, title: true, status: true, deleted_at: true },
  });
  console.log("PRISMA_simple_Active", JSON.stringify(simple, null, 2));

  // Full service lookup
  try {
    const lookups = await StudentEnrollmentService.getLookups(1);
    console.log("SERVICE_lookups", {
      branches: lookups.branches?.length,
      active_sessions: lookups.active_sessions?.length,
      active_session_sections: lookups.active_session_sections?.length,
      boards: lookups.boards?.length,
      sessionIds: lookups.active_sessions?.map((s: any) => s.id),
      sectionBySession: lookups.active_session_sections?.reduce(
        (acc: any, s: any) => {
          acc[s.active_session_id] = (acc[s.active_session_id] || 0) + 1;
          return acc;
        },
        {}
      ),
    });
  } catch (e: any) {
    console.log("SERVICE_ERROR", e?.message || e);
    console.log(e?.stack);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await prisma.$disconnect();
  } catch {}
  process.exit(1);
});

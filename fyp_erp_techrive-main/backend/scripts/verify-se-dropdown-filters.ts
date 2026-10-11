import "dotenv/config";
import { StudentEnrollmentService } from "../src/modules/AcademicModule/services/studentEnrollment.service";
import { prisma } from "../src/config/db";

function filterSessions(
  sessions: Array<{ id: number; branch_id: number; title?: string | null }>,
  branchId: string
) {
  const bid = Number(branchId);
  return sessions.filter((s) => Number(s.branch_id) === bid);
}

function filterSections(
  sections: Array<{ id: number; active_session_id: number; name?: string | null }>,
  activeSessionId: string
) {
  const aid = Number(activeSessionId);
  return sections.filter((s) => Number(s.active_session_id) === aid);
}

async function main() {
  const all = await StudentEnrollmentService.getLookups();
  console.log("ALL", {
    active_sessions: all.active_sessions.length,
    active_session_sections: all.active_session_sections.length,
  });

  for (const branch of ["1", "2", "3"]) {
    const sessions = filterSessions(all.active_sessions as any, branch);
    console.log(`BRANCH_${branch}_SESSIONS`, sessions.map((s) => s.id));
    if (sessions[0]) {
      const secs = filterSections(
        all.active_session_sections as any,
        String(sessions[0].id)
      );
      console.log(
        `BRANCH_${branch}_FIRST_SESSION_${sessions[0].id}_SECTIONS`,
        secs.map((s) => ({ id: s.id, name: s.name }))
      );
    }
  }

  // invalid combo rejection
  try {
    await StudentEnrollmentService.createEnrollment({
      first_name: "Invalid",
      mobile_1: "03001112233",
      branch_id: 1,
      active_session_id: 1,
      active_session_section_id: 5, // belongs to session 3
    } as any);
    console.log("INVALID_COMBO: unexpected success");
  } catch (e: any) {
    console.log("INVALID_COMBO_REJECTED:", e.message);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

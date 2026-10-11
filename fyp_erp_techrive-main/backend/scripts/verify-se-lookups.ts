import "dotenv/config";
import { StudentEnrollmentService } from "../src/modules/AcademicModule/services/studentEnrollment.service";
import { prisma } from "../src/config/db";

async function main() {
  const d = await StudentEnrollmentService.getLookups(1);
  console.log({
    sessions: d.active_sessions.length,
    sections: d.active_session_sections.length,
    boards: d.boards.length,
    branches: d.branches.length,
    sessionIds: d.active_sessions.map((s) => s.id),
  });
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

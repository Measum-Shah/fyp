import "dotenv/config";
import { StudentEnrollmentService } from "../src/modules/AcademicModule/services/studentEnrollment.service";
import { prisma } from "../src/config/db";

async function main() {
  const lookups = await StudentEnrollmentService.getLookups(1);
  console.log("lookups.branches", lookups.branches.length);
  console.log("lookups.active_sessions", lookups.active_sessions.length);
  console.log(
    "lookups.active_session_sections",
    lookups.active_session_sections.length
  );
  console.log("lookups.staff", lookups.staff.length);

  const as = lookups.active_sessions[0];
  const secs = lookups.active_session_sections.filter(
    (s) => s.active_session_id === as.id
  );
  if (!as || secs.length === 0) {
    throw new Error("Missing active session/section seed data for branch 1");
  }

  // Invalid combo must fail
  const wrong = lookups.active_session_sections.find(
    (s) => s.active_session_id !== as.id
  );
  if (wrong) {
    try {
      await StudentEnrollmentService.createEnrollment({
        first_name: "Invalid",
        mobile_1: "03000000000",
        branch_id: 1,
        active_session_id: as.id,
        active_session_section_id: wrong.id,
      });
      console.log("invalid_combo: UNEXPECTED_SUCCESS");
    } catch (e: any) {
      console.log("invalid_combo_rejected:", e.message);
    }
  }

  const created = await StudentEnrollmentService.createEnrollment({
    first_name: "Smoke",
    last_name: "Enrollment",
    mobile_1: "03009998877",
    branch_id: 1,
    active_session_id: as.id,
    active_session_section_id: secs[0].id,
    disability: 1,
    disability_description: "Requires seating support",
    previous_class: "Grade 8",
    temp_address: "Temp address line",
    extra_info: "Smoke test note",
    parent: {
      father_first_name: "Ali",
      father_last_name: "Khan",
      father_cnic: "12345-1234567-1",
      father_occupation: "Engineer",
      father_is_staff: 0,
      mother_first_name: "Sara",
      mother_last_name: "Khan",
      mother_cnic: "12345-7654321-2",
      mother_is_staff: 0,
    },
  });

  console.log("created_id", created.id);
  console.log("active_session_id", created.active_session_id);
  console.log("active_session_section_id", created.active_session_section_id);
  console.log("disability", created.disability, created.disability_description);
  console.log("parent_id", created.parent?.id);
  console.log("ass_student_id", created.active_session_student?.id);

  const loaded = await StudentEnrollmentService.getEnrollment(created.id);
  console.log(
    "loaded_parent_father",
    loaded.parent?.father_first_name,
    loaded.parent?.father_cnic
  );
  console.log("loaded_disability", loaded.disability);

  // cleanup smoke student (soft-ish hard delete of smoke-only records)
  if (created.active_session_student?.id) {
    await prisma.activeSessionStudents.delete({
      where: { id: created.active_session_student.id },
    });
  }
  if (created.parent?.id) {
    await prisma.parentDetails.delete({ where: { id: created.parent.id } });
  }
  await prisma.students.delete({ where: { id: created.id } });
  console.log("cleanup_ok");

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("ERR", e);
  try {
    await prisma.$disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});

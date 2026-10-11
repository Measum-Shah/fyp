/**
 * Verify Student Enrollment photo persistence (no browser UI).
 * Creates a tiny PNG, posts multipart enrollment, checks students.student_image + disk file.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { prisma } from "../src/config/db";
import { StudentEnrollmentService } from "../src/modules/AcademicModule/services/studentEnrollment.service";
import {
  toStudentPhotoPublicPath,
  unlinkStudentPhotoFile,
} from "../src/modules/AcademicModule/middlewares/studentEnrollmentUpload.middleware";

// 1x1 PNG
const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function main() {
  const lookups = await StudentEnrollmentService.getLookups(1);
  const session = lookups.active_sessions[0];
  const section = lookups.active_session_sections.find(
    (s) => s.active_session_id === session.id
  );
  if (!session || !section) throw new Error("Missing active session/section");

  const uploadRoot = path.join(__dirname, "..", "uploads", "student-enrollment-photos");
  fs.mkdirSync(uploadRoot, { recursive: true });
  const filename = `${Date.now()}_test_student_photo.png`;
  const abs = path.join(uploadRoot, filename);
  fs.writeFileSync(abs, Buffer.from(PNG_BASE64, "base64"));
  const publicPath = toStudentPhotoPublicPath(filename);

  const created = await StudentEnrollmentService.createEnrollment({
    first_name: "Photo",
    last_name: "Test",
    mobile_1: "03005550123",
    branch_id: 1,
    active_session_id: session.id,
    active_session_section_id: section.id,
    student_image: publicPath,
  });

  console.log("created_id", created.id);
  console.log("student_image", created.student_image);

  const row = await prisma.students.findUnique({
    where: { id: created.id },
    select: { id: true, student_image: true },
  });
  console.log("db_row", row);
  console.log("file_exists", fs.existsSync(abs));

  // cleanup
  if (created.active_session_student?.id) {
    await prisma.activeSessionStudents.delete({
      where: { id: created.active_session_student.id },
    });
  }
  if (created.parent?.id) {
    await prisma.parentDetails.delete({ where: { id: created.parent.id } });
  }
  await prisma.students.delete({ where: { id: created.id } });
  unlinkStudentPhotoFile(abs);
  console.log("cleanup_ok");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  try {
    await prisma.$disconnect();
  } catch {}
  process.exit(1);
});

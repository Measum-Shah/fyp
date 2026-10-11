import { prisma } from "../../../../config/db";
import { AppError } from "../../../feeManagementModule/utils/fee.helpers"; // or create a local one

export const getStudentByUser = async (userId: number) => {
  const student = await prisma.students.findFirst({
    where: { user_id: userId },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      reg_no: true,
      branch_id: true,
      board_id: true,
      program_id: true,
      session_id: true,
      active_session_id: true,
      active_session_section_id: true,
      term_id: true,
      section_id: true,
      class_id: true,
    },
  });

  if (!student) {
    throw new Error("Student profile not found for this user");
  }

  return student;
};

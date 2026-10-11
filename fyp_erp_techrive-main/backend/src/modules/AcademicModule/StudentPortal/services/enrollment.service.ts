import { prisma } from '../../../../config/db';
import { getStudentByUser } from './studentPortal.helpers';

export const getAvailableCourses = async (userId: number) => {
  const student = await getStudentByUser(userId);
  
  // Available courses might just be all courses for the student's program and active session
  const courses = await prisma.courses.findMany({
    where: { 
      program_id: student.program_id || undefined,
      status: { in: ['Active', 'active'] }
    }
  });

  return courses;
};

export const registerCourse = async (userId: number, courseId: number) => {
  const student = await getStudentByUser(userId);
  
  if (!student.branch_id || !student.board_id || !student.program_id) {
    throw new Error('Incomplete student academic profile');
  }

  // Check existing enrollment
  const existing = await prisma.studentEnrollments.findFirst({
    where: {
      student_id: student.id,
      subject_id: courseId
    }
  });
  
  if (existing) {
    throw new Error('Already enrolled in this course');
  }

  return await prisma.studentEnrollments.create({
    data: {
      student_id: student.id,
      subject_id: courseId,
      branch_id: student.branch_id,
      board_id: student.board_id,
      program_id: student.program_id,
      session_id: student.session_id || 0,
      term_id: student.term_id || 0,
      section_id: student.section_id || 0,
      created_at: new Date(),
      updated_at: new Date()
    }
  });
};

export const getEnrollmentStatus = async (userId: number) => {
  const student = await getStudentByUser(userId);
  
  return await prisma.studentEnrollments.findMany({
    where: { student_id: student.id }
  });
};

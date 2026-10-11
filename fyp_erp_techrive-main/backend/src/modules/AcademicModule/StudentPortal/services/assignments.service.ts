import { prisma } from '../../../../config/db';
import { getStudentByUser } from './studentPortal.helpers';
import { LmsService } from '../../services/lms.service';

export const getAssignments = async (userId: number, institution_type?: string) => {
  // LmsService.getAssignments takes req.user as second arg
  const user = { id: userId, user_type: 'student' }; // Minimal mock for AuthRequest.user
  return await LmsService.getAssignments(institution_type, user);
};

export const submitAssignment = async (userId: number, body: any) => {
  const user = { id: userId, user_type: 'student' };
  return await LmsService.submitAssignment(body, user);
};

export const getSubmissions = async (userId: number, assignmentId: number) => {
  const user = { id: userId, user_type: 'student' };
  return await LmsService.getSubmissions(assignmentId, user);
};

export const getMaterials = async (userId: number, institution_type?: string, course_id?: number) => {
  const user = { id: userId, user_type: 'student' };
  return await LmsService.getMaterials(institution_type, course_id, user);
};

export const getQuizzes = async (userId: number) => {
  const student = await prisma.students.findFirst({ where: { user_id: userId } });
  if (!student || !student.active_session_section_id) return [];

  // Get quizzes scheduled for the student's section
  const sectionQuizzes = await prisma.quizTimetables.findMany({
    where: { active_session_section_id: student.active_session_section_id },
    orderBy: { start: 'desc' }
  });

  // Get quizzes created by teachers who teach courses the student is enrolled in
  // First, get student's course IDs (via LmsService logic implicitly, or direct enrollments)
  const enrollmentCourses = await prisma.studentEnrollments.findMany({
    where: { student_id: student.id },
    select: { subject_id: true }
  });
  
  const activeSessions = await prisma.activeSessionStudents.findMany({
    where: { student_id: student.id }
  });
  const groupIds = activeSessions.map(a => a.academics_group_id).filter(Boolean) as number[];
  if (student.academic_group_id) groupIds.push(student.academic_group_id);
  
  const groupCourses = await prisma.academicsGroupCourses.findMany({
    where: { academics_group_id: { in: groupIds } }
  });

  const courseIds = new Set([
    ...enrollmentCourses.map(e => e.subject_id),
    ...groupCourses.map(gc => gc.course_id)
  ].filter(Boolean) as number[]);

  let teacherQuizzes: any[] = [];
  if (courseIds.size > 0) {
    // Find active session teachers for these courses
    const allSessionTeachers = await prisma.activeSessionTeachers.findMany({
      where: { active_session_section_id: student.active_session_section_id || undefined }
    });
    
    const relevantTeacherSessionIds = allSessionTeachers.filter(st => {
      if (!st.course_ids) return false;
      const tCourseIds = st.course_ids.split(',').map(Number);
      return tCourseIds.some(id => courseIds.has(id));
    }).map(st => st.id);

    if (relevantTeacherSessionIds.length > 0) {
      teacherQuizzes = await prisma.quizzes.findMany({
        where: { active_session_teacher_id: { in: relevantTeacherSessionIds } },
        orderBy: { created_at: 'desc' }
      });
    }
  }

  return {
    section_timetables: sectionQuizzes,
    teacher_quizzes: teacherQuizzes
  };
};

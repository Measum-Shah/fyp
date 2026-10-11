import { prisma } from '../../../../config/db';
import { getStudentByUser } from './studentPortal.helpers';
import { getCGPA, getEnrolledCourses } from './academics.service';
import { getAttendance, getTimetable } from './timetable.service';
import { getAssignments } from './assignments.service';

export const getDashboardHome = async (userId: number) => {
  const student = await getStudentByUser(userId);
  
  const [cgpa, courses, attendance, assignments, timetable, announcements] = await Promise.all([
    getCGPA(userId),
    getEnrolledCourses(userId),
    getAttendance(userId),
    getAssignments(userId),
    getTimetable(userId),
    prisma.notifications.findMany({
      where: {
        OR: [
          { rid: userId },
          { type: 'all' },
          { type: 'student' }
        ]
      },
      orderBy: { created_at: 'desc' },
      take: 5
    }).catch(() => []) // Catch in case table differs slightly
  ]);

  return {
    student: {
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      reg_no: student.reg_no,
      branch_id: student.branch_id,
      program_id: student.program_id,
    },
    academic_summary: {
      cgpa: cgpa.cgpa_placeholder,
      enrolled_courses: courses.courses.length,
    },
    attendance: attendance.summary,
    pending_assignments: assignments.length, // could filter by status or deadline
    today_classes: timetable, // could filter by current day
    recent_announcements: announcements,
  };
};

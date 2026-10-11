import { prisma } from '../../../../config/db';
import { getStudentByUser } from './studentPortal.helpers';
import { getCGPA } from './academics.service';
import { getAttendance } from './timetable.service';

export const getAcademicProgress = async (userId: number) => {
  const cgpaData = await getCGPA(userId);
  return {
    semester_trends: [], // Would group by semester if data had semester info
    current_cgpa: cgpaData.cgpa_placeholder,
    total_credits: 120, // Placeholder
    completed_credits: 60 // Placeholder
  };
};

export const getAttendanceAnalytics = async (userId: number) => {
  const attendance = await getAttendance(userId);
  return attendance;
};

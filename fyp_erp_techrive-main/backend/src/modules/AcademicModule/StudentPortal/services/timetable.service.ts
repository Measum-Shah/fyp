import { prisma } from '../../../../config/db';
import { getStudentByUser } from './studentPortal.helpers';

export const getTimetable = async (userId: number) => {
  const student = await getStudentByUser(userId);

  const timetable = await prisma.classTimeTables.findMany({
    where: {
      active_session_section_id: student.active_session_section_id || undefined,
      session_id: student.session_id || undefined
    }
  });

  return timetable;
};

export const getAttendance = async (userId: number) => {
  const student = await getStudentByUser(userId);
  
  const attendanceRecords = await prisma.studentAttendancePayroll.findMany({
    where: {
      student_id: student.id,
    },
    orderBy: {
      class_date: 'desc'
    }
  });

  // Calculate percentage
  let present = 0;
  let total = attendanceRecords.length;
  
  attendanceRecords.forEach(a => {
    if (a.attendance === 'Present' || a.attendance === 'P') present++;
  });

  return {
    records: attendanceRecords,
    summary: {
      total_classes: total,
      present_classes: present,
      percentage: total > 0 ? (present / total) * 100 : 0
    }
  };
};

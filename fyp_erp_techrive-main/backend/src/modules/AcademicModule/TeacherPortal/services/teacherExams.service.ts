import { prisma } from "../../../../config/db";

export class TeacherExamsService {
  static async getExams(staffId: number) {
    const sessionTeachers = await prisma.activeSessionTeachers.findMany({
      where: { staff_id: staffId }
    });
    const courseIds = new Set<number>();
    for (const st of sessionTeachers) {
      if (st.course_ids) {
        st.course_ids.split(",").forEach((id: string) => courseIds.add(Number(id)));
      }
    }
    const courseIdArray = Array.from(courseIds);
    if (courseIdArray.length === 0) return [];

    const schedules = await (prisma as any).examSchedules.findMany({
      where: { subjects_id: { in: courseIdArray } }
    });
    
    const courses = await prisma.courses.findMany({
      where: { id: { in: courseIdArray } },
      select: { id: true, name: true, institution_type: true }
    });

    const exams = await (prisma as any).exams.findMany({
      where: { id: { in: schedules.map((s: any) => s.exams_id).filter(Boolean) } }
    });

    return schedules.map((s: any) => {
      const course = courses.find(c => c.id === s.subjects_id);
      const exam = exams.find((e: any) => e.id === s.exams_id);
      return {
        ...s,
        exam_title: exam?.title || "Exam",
        course_name: course?.name,
        institution_type: course?.institution_type
      };
    });
  }

  static async createExamSlot(data: { course_id: number, title: string, total_marks: number }, staffId: number) {
    // Find the teacher's active session section for this course
    const sessionTeachers = await prisma.activeSessionTeachers.findMany({
      where: { staff_id: staffId }
    });
    
    let sectionId = null;
    for (const st of sessionTeachers) {
      if (st.course_ids && st.course_ids.split(",").includes(data.course_id.toString())) {
        sectionId = st.active_session_section_id;
        break;
      }
    }

    if (!sectionId) throw new Error("Could not find active session section for this course and teacher");

    const section = await prisma.activeSessionSections.findUnique({
      where: { id: sectionId }
    });
    const sessionId = section?.active_session_id || null;

    // Create an Exam record for the title
    const exam = await (prisma as any).exams.create({
      data: {
        title: data.title,
        session_id: sessionId,
        created_by: staffId,
        created_at: new Date()
      }
    });

    // Create the ExamSchedule record mapped to the section and course
    const schedule = await (prisma as any).examSchedules.create({
      data: {
        exams_id: exam.id,
        subjects_id: data.course_id,
        active_session_id: sessionId,
        active_session_section_id: sectionId,
        total_marks: data.total_marks,
        teacher_id: staffId,
        conducted: "No",
        created_by: staffId,
        created_at: new Date()
      }
    });
    return { ...schedule, exam_title: exam.title };
  }

  static async getStudentsForExam(examScheduleId: number) {
    const schedule = await (prisma as any).examSchedules.findUnique({
      where: { id: examScheduleId }
    });
    if (!schedule) throw new Error("Exam schedule not found");

    const ledgers = await (prisma as any).examMarkLedgers.findMany({
      where: { exam_schedule_id: examScheduleId }
    });

    let allStudentIds: number[] = [];

    if (schedule.active_session_section_id) {
      // If the slot is linked to a specific section, get students from that section
      const sessionStudents = await (prisma as any).activeSessionStudents.findMany({
        where: { active_session_section_id: schedule.active_session_section_id }
      });
      allStudentIds = sessionStudents.map((ss: any) => ss.student_id);
    } else {
      // Legacy fallback: Get all students in groups that take this course
      const courseId = schedule.subjects_id;
      if (!courseId) return [];
      
      const groupCourses = await (prisma as any).academicsGroupCourses.findMany({
        where: { course_id: courseId }
      });
      const groupIds = groupCourses.map((gc: any) => gc.academics_group_id);

      const sessionStudents = await (prisma as any).activeSessionStudents.findMany({
        where: { academics_group_id: { in: groupIds } }
      });
      const directStudents = await prisma.students.findMany({
        where: { academic_group_id: { in: groupIds } },
        select: { id: true }
      });
      allStudentIds = [...new Set([...sessionStudents.map((ss: any) => ss.student_id), ...directStudents.map((s: any) => s.id)])];
    }
    
    const students = await prisma.students.findMany({
      where: { id: { in: allStudentIds } },
      select: { id: true, first_name: true, last_name: true, reg_no: true }
    });

    return students.map((s: any) => {
      const ledger = ledgers.find((l: any) => l.students_id === s.id);
      return {
        students_id: s.id,
        student_name: `${s.first_name} ${s.last_name}`,
        reg_no: s.reg_no,
        obtain_mark_theory: ledger?.obtain_mark_theory || 0,
        obtain_mark_practical: ledger?.obtain_mark_practical || 0
      };
    });
  }

  static async saveMarks(examScheduleId: number, marks: any[], staffId: number) {
    for (const mark of marks) {
      const existing = await (prisma as any).examMarkLedgers.findFirst({
        where: { exam_schedule_id: examScheduleId, students_id: mark.students_id }
      });

      if (existing) {
        await (prisma as any).examMarkLedgers.update({
          where: { id: existing.id },
          data: {
            obtain_mark_theory: mark.obtain_mark_theory,
            obtain_mark_practical: mark.obtain_mark_practical,
            last_updated_by: staffId,
            updated_at: new Date()
          }
        });
      } else {
        await (prisma as any).examMarkLedgers.create({
          data: {
            exam_schedule_id: examScheduleId,
            students_id: mark.students_id,
            obtain_mark_theory: mark.obtain_mark_theory,
            obtain_mark_practical: mark.obtain_mark_practical,
            created_by: staffId,
            created_at: new Date()
          }
        });
      }
    }
    return { success: true };
  }
}

import { prisma } from "../../../../config/db";
import bcrypt from "bcryptjs";

export class TeacherService {
  static readonly REQUIRED_ATTENDANCE_PERCENTAGE = 75;
  
  // ==========================================
  // Auth: Login Teacher
  // ==========================================
  static async loginTeacher(email: string, password: string) {
    const user = await prisma.erpUsers.findFirst({
      where: { 
        email, 
        user_type: { in: ["staff", "teacher"] } 
      },
    });

    if (!user) throw new Error("Invalid email or password");
    if (!user.status || user.active === 0) throw new Error("Account is inactive");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid email or password");

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      type: user.user_type,
    };
  }

  // ==========================================
  // Get Teacher Course IDs Helper
  // ==========================================
  private static async getTeacherCourseIds(staffId: number): Promise<number[]> {
    const staff = await prisma.staff.findFirst({
      where: { user_id: staffId },
      select: { id: true },
    });
    const staffIds = staff ? [staff.id, staffId] : [staffId];
    const sessionTeachers = await prisma.activeSessionTeachers.findMany({
      where: { staff_id: { in: staffIds } }
    });
    const ids = new Set<number>();
    for (const st of sessionTeachers) {
      if (st.course_ids) {
        st.course_ids.split(",").forEach((id: string) => ids.add(Number(id)));
      }
    }
    return Array.from(ids);
  }

  // ==========================================
  // Get Dashboard Stats
  // ==========================================
  static async getDashboardStats(userId: number) {
    const courseIds = await this.getTeacherCourseIds(userId);
    if (courseIds.length === 0) {
      return {
        total_courses: 0,
        active_assignments: 0,
        assigned_courses: 0,
        total_students: 0,
        classes_today: 0,
        pending_assignments: 0,
        upcoming_exams: 0,
        attendance_alerts: 0,
        by_institution: {}
      };
    }

    const courses = await prisma.courses.findMany({
      where: { id: { in: courseIds } },
      select: { id: true, institution_type: true }
    });

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrow = new Date(startOfToday);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const currentDay = today.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

    const [assignments, groupCourses, timetableRows, examSchedules, attendanceRows] = await Promise.all([
      prisma.lmsAssignments.findMany({
      where: { course_id: { in: courseIds } },
        select: { id: true, course_id: true, deadline: true, status: true }
      }),
      prisma.academicsGroupCourses.findMany({
        where: { course_id: { in: courseIds } },
        select: { academics_group_id: true }
      }),
      prisma.classTimeTables.findMany({
        where: { teacher_id: userId, subject_id: { in: courseIds } },
        select: { day: true }
      }),
      (prisma as any).examSchedules.findMany({
        where: {
          subjects_id: { in: courseIds },
          start_date: { gte: startOfToday }
        },
        select: { id: true }
      }),
      prisma.studentAttendancePayroll.findMany({
        where: {
          course_id: { in: courseIds },
          class_date: { gte: startOfToday, lt: tomorrow }
        },
        select: { attendance: true }
      })
    ]);

    const groupIds = [...new Set(groupCourses.map((group) => group.academics_group_id).filter((id): id is number => id !== null))];
    const [studentsInGroups, studentsInSessions] = groupIds.length === 0
      ? [[], []]
      : await Promise.all([
          prisma.students.findMany({
            where: { academic_group_id: { in: groupIds } },
            select: { id: true }
          }),
          prisma.activeSessionStudents.findMany({
            where: { academics_group_id: { in: groupIds }, deleted_at: null },
            select: { student_id: true }
          })
        ]);

    const studentIds = new Set([
      ...studentsInGroups.map((student) => student.id),
      ...studentsInSessions.map((student) => student.student_id)
    ]);
    const pendingAssignments = assignments.filter((assignment) => {
      const status = (assignment.status || "").toLowerCase();
      return status !== "completed" && status !== "closed" && (!assignment.deadline || assignment.deadline >= today);
    }).length;
    const attendanceAlerts = attendanceRows.filter((row: { attendance: string | null }) => {
      const attendance = (row.attendance || "").toLowerCase();
      return attendance.includes("absent") || attendance.includes("late") || attendance.includes("leave");
    }).length;

    const by_institution: Record<string, { courses: number, assignments: number }> = {};
    
    courses.forEach(c => {
      const type = c.institution_type || 'university';
      if (!by_institution[type]) {
        by_institution[type] = { courses: 0, assignments: 0 };
      }
      by_institution[type].courses++;
    });

    assignments.forEach(a => {
      const course = courses.find(c => c.id === a.course_id);
      const type = course?.institution_type || 'university';
      if (by_institution[type]) {
        by_institution[type].assignments++;
      }
    });

    return {
      total_courses: courseIds.length,
      active_assignments: assignments.length,
      assigned_courses: courseIds.length,
      total_students: studentIds.size,
      classes_today: timetableRows.filter((row) => row.day.toLowerCase() === currentDay || row.day === String(today.getDay() || 7)).length,
      pending_assignments: pendingAssignments,
      upcoming_exams: new Set(examSchedules.map((exam: { id: number }) => exam.id)).size,
      attendance_alerts: attendanceAlerts,
      by_institution
    };
  }

  // ==========================================
  // Get My Courses
  // ==========================================
  static async getMyCourses(userId: number) {
    const courseIds = await this.getTeacherCourseIds(userId);
    if (courseIds.length === 0) return [];

    const [courses, groupCourses] = await Promise.all([
      prisma.courses.findMany({
        where: { id: { in: courseIds } },
        select: {
          id: true,
          name: true,
          subject_code: true,
          credit_hours: true,
          class_id: true,
          program_id: true,
          semester: true,
          type: true,
          category: true,
          status: true,
          institution_type: true
        }
      }),
      prisma.academicsGroupCourses.findMany({
        where: { course_id: { in: courseIds } },
        select: { course_id: true, academics_group_id: true }
      })
    ]);

    const groupIds = [...new Set(groupCourses.map((row) => row.academics_group_id))];
    const [groupStudents, sessionStudents] = await Promise.all([
      prisma.students.findMany({
        where: { academic_group_id: { in: groupIds } },
        select: { id: true, academic_group_id: true }
      }),
      prisma.activeSessionStudents.findMany({
        where: { academics_group_id: { in: groupIds }, deleted_at: null },
        select: { student_id: true, academics_group_id: true }
      }),
    ]);

    return courses.map((course) => {
      const courseGroupIds = new Set(
        groupCourses.filter((row) => row.course_id === course.id).map((row) => row.academics_group_id)
      );
      const studentIds = new Set([
        ...groupStudents.filter((student) => student.academic_group_id !== null && courseGroupIds.has(student.academic_group_id)).map((student) => student.id),
        ...sessionStudents.filter((student) => student.academics_group_id !== null && courseGroupIds.has(student.academics_group_id)).map((student) => student.student_id)
      ]);
      return {
        ...course,
        number_of_students: studentIds.size,
        course: course.type || course.category || "—"
      };
    });
  }

  // ==========================================
  // Get Course Students
  // ==========================================
  static async getCourseStudents(userId: number, courseId: number) {
    const courseIds = await this.getTeacherCourseIds(userId);
    if (!courseIds.includes(courseId)) {
      throw new Error("Unauthorized: You do not teach this course.");
    }

    // Find groups that have this course
    const groupCourses = await prisma.academicsGroupCourses.findMany({
      where: { course_id: courseId, deleted_at: null }
    });
    const groupIds = groupCourses.map((gc: any) => gc.academics_group_id);

    // Find active session students in these groups
    const sessionStudents = await prisma.activeSessionStudents.findMany({
      where: {
        academics_group_id: { in: groupIds },
        deleted_at: null
      }
    });
    const studentIdsFromSession = sessionStudents.map((ss: any) => ss.student_id);

    // Also include students whose direct academic_group_id matches
    const directStudents = await prisma.students.findMany({
      where: {
        academic_group_id: { in: groupIds },
        deleted_at: null
      },
      select: { id: true }
    });
    const directStudentIds = directStudents.map(s => s.id);

    const allStudentIds = [...new Set([...studentIdsFromSession, ...directStudentIds])];

    const students = await prisma.students.findMany({
      where: { id: { in: allStudentIds } },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        reg_no: true,
        email: true
      }
    });

    return students;
  }

  private static async assertStudentInCourse(courseId: number, studentId: number) {
    const groupCourses = await prisma.academicsGroupCourses.findMany({
      where: { course_id: courseId, deleted_at: null },
      select: { academics_group_id: true }
    });
    const groupIds = groupCourses.map((group) => group.academics_group_id);
    const student = await prisma.students.findFirst({
      where: { id: studentId, academic_group_id: { in: groupIds }, deleted_at: null },
      select: { id: true }
    });
    if (!student) throw new Error("Student is not enrolled in this course.");
  }

  static async getAttendanceManagement(userId: number, courseId: number, classDate: string) {
    const courseIds = await this.getTeacherCourseIds(userId);
    if (!courseIds.includes(courseId)) throw new Error("Unauthorized: You do not teach this course.");

    const students = await this.getCourseStudents(userId, courseId);
    const rows = await prisma.studentAttendancePayroll.findMany({
      where: { course_id: courseId, class_date: new Date(`${classDate}T00:00:00.000Z`) },
      select: { id: true, student_id: true, course_id: true, class_date: true, attendance: true, attendance_type: true }
    });
    const recordsByStudent = new Map(rows.map((row) => [row.student_id, row]));

    return students.map((student) => {
      const record = recordsByStudent.get(student.id);
      return {
        id: record?.id ?? null,
        student_id: student.id,
        student_name: `${student.first_name || ""} ${student.last_name || ""}`.trim() || `Student #${student.id}`,
        reg_no: student.reg_no,
        course_id: courseId,
        class_date: classDate,
        attendance: record?.attendance || "Not Marked"
      };
    });
  }

  static async saveStudentAttendance(userId: number, input: { student_id: number; course_id: number; class_date: string; attendance: string }) {
    const courseIds = await this.getTeacherCourseIds(userId);
    if (!courseIds.includes(input.course_id)) throw new Error("Unauthorized: You do not teach this course.");
    const attendance = input.attendance.trim();
    if (!["Present", "Absent", "Leave"].includes(attendance)) throw new Error("Attendance must be Present, Absent, or Leave.");
    await this.assertStudentInCourse(input.course_id, input.student_id);

    const classDate = new Date(`${input.class_date}T00:00:00.000Z`);
    const existing = await prisma.studentAttendancePayroll.findFirst({
      where: { student_id: input.student_id, course_id: input.course_id, class_date: classDate }
    });
    const data = { attendance, attendance_type: "Manual", updated_at: new Date() };
    if (existing) {
      return prisma.studentAttendancePayroll.update({ where: { id: existing.id }, data });
    }
    return prisma.studentAttendancePayroll.create({
      data: {
        student_id: input.student_id,
        course_id: input.course_id,
        class_date: classDate,
        attendance,
        attendance_type: "Manual",
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  }

  static async getAttendanceAnalytics(userId: number) {
    const courseIds = await this.getTeacherCourseIds(userId);
    if (courseIds.length === 0) {
      return { required_percentage: this.REQUIRED_ATTENDANCE_PERCENTAGE, courses: [], students_below_threshold: [], most_attended_course: null, least_attended_course: null };
    }

    const [courses, rows] = await Promise.all([
      prisma.courses.findMany({ where: { id: { in: courseIds } }, select: { id: true, name: true, subject_code: true } }),
      prisma.studentAttendancePayroll.findMany({ where: { course_id: { in: courseIds } }, select: { student_id: true, course_id: true, attendance: true } })
    ]);
    const studentIds = [...new Set(rows.map((row) => row.student_id).filter((id): id is number => id !== null))];
    const students = studentIds.length
      ? await prisma.students.findMany({ where: { id: { in: studentIds } }, select: { id: true, first_name: true, last_name: true, reg_no: true } })
      : [];

    const courseMap = new Map(courses.map((course) => [course.id, `${course.subject_code || ""} ${course.name || ""}`.trim()]));
    const studentMap = new Map(students.map((student) => [student.id, { name: `${student.first_name || ""} ${student.last_name || ""}`.trim() || `Student #${student.id}`, reg_no: student.reg_no }]));
    const stats = new Map<number, { present: number; total: number }>();
    const studentStats = new Map<number, { present: number; total: number }>();
    for (const row of rows) {
      const isPresent = row.attendance?.toLowerCase() === "present";
      const courseStat = stats.get(row.course_id || 0) || { present: 0, total: 0 };
      courseStat.total++;
      if (isPresent) courseStat.present++;
      stats.set(row.course_id || 0, courseStat);
      const studentStat = studentStats.get(row.student_id || 0) || { present: 0, total: 0 };
      studentStat.total++;
      if (isPresent) studentStat.present++;
      studentStats.set(row.student_id || 0, studentStat);
    }
    const percentage = (stat: { present: number; total: number }) => stat.total ? Number(((stat.present / stat.total) * 100).toFixed(1)) : 0;
    const courseAnalytics = [...stats.entries()].map(([courseId, stat]) => ({ course_id: courseId, course_name: courseMap.get(courseId) || `Course #${courseId}`, attendance_percentage: percentage(stat), present: stat.present, total: stat.total }));
    const studentWarnings = [...studentStats.entries()].map(([studentId, stat]) => ({ student_id: studentId, ...(studentMap.get(studentId) || { name: `Student #${studentId}`, reg_no: null }), attendance_percentage: percentage(stat), present: stat.present, total: stat.total })).filter((student) => student.attendance_percentage < this.REQUIRED_ATTENDANCE_PERCENTAGE);
    const sorted = [...courseAnalytics].sort((a, b) => b.attendance_percentage - a.attendance_percentage);
    return { required_percentage: this.REQUIRED_ATTENDANCE_PERCENTAGE, courses: courseAnalytics, students_below_threshold: studentWarnings, most_attended_course: sorted[0] || null, least_attended_course: sorted[sorted.length - 1] || null };
  }

  static async getTimetable(userId: number) {
    const courseIds = await this.getTeacherCourseIds(userId);
    if (courseIds.length === 0) return [];
    
    const timetableRows = await prisma.classTimeTables.findMany({
      where: {
        teacher_id: userId,
        subject_id: { in: courseIds }
      },
      orderBy: [{ day: "asc" }, { time_table_slot_id: "asc" }]
    });

    const [subjects, slots, rooms, activeSections] = await Promise.all([
      prisma.courses.findMany({ where: { id: { in: courseIds } }, select: { id: true, name: true, subject_code: true } }),
      prisma.timeTableSlots.findMany({ where: { id: { in: timetableRows.map(row => row.time_table_slot_id).filter((id): id is number => id !== null) } }, select: { id: true, name: true, slot_from: true, slot_to: true } }),
      prisma.rooms.findMany({ where: { id: { in: timetableRows.map(row => row.room_id).filter((id): id is number => id !== null) }, deleted_at: null }, select: { id: true, name: true } }),
      prisma.activeSessionSections.findMany({ where: { id: { in: timetableRows.map(row => row.active_session_section_id) } }, select: { id: true, section_id: true } }),
    ]);
    const subjectMap = new Map(subjects.map(s => [s.id, `${s.subject_code || ''} ${s.name || ''}`.trim()]));
    const slotMap = new Map(slots.map(slot => [slot.id, slot]));
    const roomMap = new Map(rooms.map(room => [room.id, room.name]));
    const sectionIds = activeSections.map(section => section.section_id);
    const sections = await prisma.sections.findMany({ where: { id: { in: sectionIds } }, select: { id: true, name: true } });
    const sectionMap = new Map(sections.map(section => [section.id, section.name]));

    return timetableRows.map(row => ({
      id: row.id,
      day: row.day,
      time_slot_id: row.time_table_slot_id,
      time_slot: slotMap.get(row.time_table_slot_id || 0)?.name || "Unscheduled",
      start_time: slotMap.get(row.time_table_slot_id || 0)?.slot_from || null,
      end_time: slotMap.get(row.time_table_slot_id || 0)?.slot_to || null,
      subject: subjectMap.get(row.subject_id) || `Course #${row.subject_id}`,
      course_id: row.subject_id,
      room: row.room_id ? roomMap.get(row.room_id) || `Room ${row.room_id}` : "TBA",
      room_id: row.room_id,
      section: sectionMap.get(activeSections.find(section => section.id === row.active_session_section_id)?.section_id || 0) || `Section #${row.active_session_section_id}`,
      active_session_section_id: row.active_session_section_id,
    }));
  }

}

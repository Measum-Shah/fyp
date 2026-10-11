import { prisma } from "../../../../config/db";
import bcrypt from "bcryptjs";

export class ParentService {

  // ── Auth: login with email + password ──────────────────────────────────
  static async loginParent(email: string, password: string) {
    const user = await prisma.erpUsers.findFirst({
      where: { email, user_type: "parent" },
    });
    if (!user) throw new Error("Invalid email or password");
    if (!user.status || user.active === 0) throw new Error("Account is inactive");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid email or password");

    // Get parent_details linked to this user
    const parentDetail = await prisma.parentDetails.findFirst({
      where: { user_id: user.id },
    });
    if (!parentDetail) throw new Error("Parent profile not found");

    return { user, parentDetail };
  }

  // ── Get student info linked to parent ──────────────────────────────────
  static async getStudentByParentUserId(userId: number) {
    const parentDetail = await prisma.parentDetails.findFirst({
      where: { user_id: userId },
    });
    if (!parentDetail?.students_id) return null;

    const student = await prisma.students.findUnique({
      where: { id: parentDetail.students_id },
    });
    if (!student) return null;

    // Get program name
    let program_name = null;
    if (student.program_id) {
      const prog = await prisma.programs.findUnique({ where: { id: student.program_id } });
      program_name = prog?.name || null;
    }

    return {
      id:              student.id,
      reg_no:          student.reg_no,
      walkin_reg_no:   student.walkin_reg_no,
      first_name:      student.first_name,
      middle_name:     student.middle_name,
      last_name:       student.last_name,
      full_name:       [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" "),
      gender:          student.gender,
      date_of_birth:   student.date_of_birth,
      email:           student.email,
      mobile:          student.mobile_1,
      program_id:      student.program_id,
      program_name,
      class_id:        student.class_id,
      section_id:      student.section_id,
      academic_status:  student.academic_status,
      admission_status: student.admission_status,
      student_image:   student.student_image,
      parent_id:       parentDetail.id,
      father_name:     [parentDetail.father_first_name, parentDetail.father_last_name].filter(Boolean).join(" "),
      father_email:    parentDetail.father_email,
      father_phone:    parentDetail.father_mobile_1,
      mother_name:     [parentDetail.mother_first_name, parentDetail.mother_last_name].filter(Boolean).join(" "),
      mother_email:    parentDetail.mother_email,
      mother_phone:    parentDetail.mother_mobile_1,
    };
  }

  // ── Get enrolled courses for student ───────────────────────────────────
  static async getStudentCourses(studentId: number) {
    const enrollments = await prisma.stdActiveSElecive.findMany({
      where: { student_id: studentId, deleted_at: null },
      orderBy: { id: "desc" },
    });
    if (!enrollments.length) return [];

    const courseIds = [...new Set(enrollments.map((e: any) => e.course_id).filter(Boolean))];
    if (!courseIds.length) return [];

    const courses = await prisma.courses.findMany({
      where: { id: { in: courseIds as number[] } },
    });

    return courses.map((c: any) => ({
      id:               c.id,
      code:             c.subject_code,
      name:             c.name,
      category:         c.category,
      credit_hours:     c.credit_hours || ((c.lecture_hours || 0) + (c.lab_hours || 0)),
      lecture_hours:    c.lecture_hours,
      lab_hours:        c.lab_hours,
      semester:         c.semester,
      status:           c.status,
      enrollment_status: enrollments.find((e: any) => e.course_id === c.id)?.status === 1 ? "active" : "enrolled",
    }));
  }

  // ── Get results/marks for student ──────────────────────────────────────
  static async getStudentResults(studentId: number) {
    const marks = await prisma.examMarkLedgers.findMany({
      where: { students_id: studentId },
      orderBy: { id: "desc" },
    });
    if (!marks.length) return [];

    // Enrich with exam schedule info
    const scheduleIds = [...new Set(marks.map((m: any) => m.exam_schedule_id).filter(Boolean))];
    const schedules = scheduleIds.length
      ? await prisma.examSchedules.findMany({ where: { id: { in: scheduleIds as number[] } } })
      : [];
    const scheduleMap = Object.fromEntries(schedules.map((s: any) => [s.id, s]));

    return marks.map((m: any) => {
      const schedule = scheduleMap[m.exam_schedule_id] || {};
      const total = (m.obtain_mark_theory || 0) + (m.obtain_mark_practical || 0);
      const totalPossible = schedule.total_marks || 100;
      const percentage = totalPossible > 0 ? ((total / totalPossible) * 100).toFixed(1) : null;
      return {
        id:                    m.id,
        exam_schedule_id:      m.exam_schedule_id,
        obtain_mark_theory:    m.obtain_mark_theory,
        obtain_mark_practical: m.obtain_mark_practical,
        total_obtained:        total,
        total_marks:           totalPossible,
        percentage,
        absent_theory:         m.absent_theory,
        absent_practical:      m.absent_practical,
        approve_status:        m.approve_status,
        session_id:            m.session_id,
        passing_marks:         schedule.passing_marks,
        passed:                total >= (schedule.passing_marks || 0),
      };
    });
  }

  // ── Get progress reports for student ───────────────────────────────────
  static async getStudentProgress(studentId: number) {
    const reports = await prisma.studentReports.findMany({
      where: { student_id: studentId },
      orderBy: { id: "desc" },
    });
    if (!reports.length) return [];

    const reportIds = reports.map((r: any) => r.id);
    const details = await prisma.studentReportDetails.findMany({
      where: { student_report_id: { in: reportIds } },
    });

    return reports.map((r: any) => ({
      id:         r.id,
      name:       r.name,
      grade:      r.grade,
      term_id:    r.term_id,
      session_id: r.session_id,
      program_id: r.program_id,
      details:    details.filter((d: any) => d.student_report_id === r.id).map((d: any) => ({
        parameter: d.report_parameter,
        name:      d.name,
        marks:     d.marks,
      })),
    }));
  }

  // ── Get teachers for student courses ───────────────────────────────────
  static async getStudentTeachers(studentId: number) {
    // Get student info for section/program
    const student = await prisma.students.findUnique({ where: { id: studentId } });
    if (!student) return [];

    // Get faculty_subjects for this program/section
    const facultySubjects = await prisma.facultySubjects.findMany({
      where: {
        ...(student.program_id ? { program_id: student.program_id } : {}),
        ...(student.section_id ? { section_id: student.section_id } : {}),
      },
      take: 50,
    });
    if (!facultySubjects.length) return [];

    const staffIds = [...new Set(facultySubjects.map((f: any) => f.staff_id).filter(Boolean))];
    if (!staffIds.length) return [];

    const teachers = await prisma.staff.findMany({
      where: { id: { in: staffIds as number[] } },
      select: {
        id:         true,
        first_name: true,
        middle_name:true,
        last_name:  true,
        email:      true,
        mobile_1:   true,
        designation:true,
        staff_image:true,
        department_id: true,
      },
    });

    // Map subject info to teacher
    return teachers.map((t: any) => {
      const subjects = facultySubjects
        .filter((f: any) => f.staff_id === t.id)
        .map((f: any) => f.subjects);
      return {
        id:          t.id,
        full_name:   [t.first_name, t.middle_name, t.last_name].filter(Boolean).join(" "),
        email:       t.email,
        phone:       t.mobile_1,
        designation: t.designation,
        staff_image: t.staff_image,
        subject_ids: subjects,
      };
    });
  }

  // ── Create parent credentials (admin use) ──────────────────────────────
  static async createParentCredentials(parentDetailId: number, email: string, plainPassword: string) {
    // Check if already has credentials
    const existing = await prisma.parentDetails.findUnique({ where: { id: parentDetailId } });
    if (!existing) throw new Error("Parent record not found");
    if ((existing as any).user_id) throw new Error("Parent already has login credentials");

    const hashed = await bcrypt.hash(plainPassword, 10);
    const user = await prisma.erpUsers.create({
      data: {
        name:      [existing.father_first_name, existing.father_last_name].filter(Boolean).join(" ") || "Parent",
        email,
        password:  hashed,
        user_type: "parent",
        active:    1,
        status:    1,
        branch_id: 1,
        role_id:   0,
        hook_id:   0,
      },
    });

    // Link user_id to parent_details
    await prisma.parentDetails.update({
      where: { id: parentDetailId },
      data: { user_id: user.id } as any,
    });

    return { user_id: user.id, email };
  }

  // ── Admin: get all parent records ──────────────────────────────────────
  static async getAllParents() {
    const parents = await prisma.parentDetails.findMany({
      where: { deleted_at: null },
      orderBy: { id: "desc" },
    });
    // Batch load student names
    const studentIds = [...new Set(parents.map((p: any) => p.students_id).filter(Boolean))] as number[];
    const students = studentIds.length
      ? await prisma.students.findMany({ where: { id: { in: studentIds } }, select: { id:true, first_name:true, last_name:true, reg_no:true } })
      : [];
    const studentMap = Object.fromEntries(students.map((s: any) => [s.id, s]));

    return parents.map((p: any) => ({
      ...p,
      has_login:    !!p.user_id,
      student_name: p.students_id && studentMap[p.students_id]
        ? `${studentMap[p.students_id].first_name || ""} ${studentMap[p.students_id].last_name || ""}`.trim()
        : null,
      reg_no: p.students_id && studentMap[p.students_id] ? studentMap[p.students_id].reg_no : null,
    }));
  }

  // ── Admin: create parent record ─────────────────────────────────────────
  static async createParent(data: any) {
    const payload: any = {
      filer_info: 0,
    };
    if (data.father_first_name) payload.father_first_name = data.father_first_name;
    if (data.father_last_name)  payload.father_last_name  = data.father_last_name;
    if (data.father_email)      payload.father_email      = data.father_email;
    if (data.father_mobile_1)   payload.father_mobile_1   = data.father_mobile_1;
    if (data.mother_first_name) payload.mother_first_name = data.mother_first_name;
    if (data.mother_last_name)  payload.mother_last_name  = data.mother_last_name;
    if (data.mother_email)      payload.mother_email      = data.mother_email;
    if (data.mother_mobile_1)   payload.mother_mobile_1   = data.mother_mobile_1;
    if (data.students_id)       payload.students_id       = Number(data.students_id);

    const created = await prisma.parentDetails.create({ data: payload });

    let student_name = null, reg_no = null;
    if (created.students_id) {
      const s = await prisma.students.findUnique({ where: { id: created.students_id }, select: { first_name:true, last_name:true, reg_no:true } });
      if (s) { student_name = `${s.first_name || ""} ${s.last_name || ""}`.trim(); reg_no = s.reg_no; }
    }
    return { ...created, has_login: false, student_name, reg_no };
  }

  // ── Admin: delete parent record ─────────────────────────────────────────
  static async deleteParent(id: number) {
    const parent = await prisma.parentDetails.findUnique({ where: { id } });
    if (!parent) throw new Error("Parent record not found");
    // Soft delete
    return await prisma.parentDetails.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  // ── Admin: update parent record (link student, edit info) ───────────────
  static async updateParent(id: number, data: any) {
    const parent = await prisma.parentDetails.findUnique({ where: { id } });
    if (!parent) throw new Error("Parent record not found");

    const payload: any = {};
    if (data.father_first_name !== undefined) payload.father_first_name = data.father_first_name;
    if (data.father_last_name  !== undefined) payload.father_last_name  = data.father_last_name;
    if (data.father_email      !== undefined) payload.father_email      = data.father_email;
    if (data.father_mobile_1   !== undefined) payload.father_mobile_1   = data.father_mobile_1;
    if (data.mother_first_name !== undefined) payload.mother_first_name = data.mother_first_name;
    if (data.mother_last_name  !== undefined) payload.mother_last_name  = data.mother_last_name;
    if (data.mother_email      !== undefined) payload.mother_email      = data.mother_email;
    if (data.mother_mobile_1   !== undefined) payload.mother_mobile_1   = data.mother_mobile_1;
    // Allow linking or unlinking a student
    if (data.students_id !== undefined) {
      payload.students_id = data.students_id ? Number(data.students_id) : null;
    }

    const updated = await prisma.parentDetails.update({ where: { id }, data: payload });

    // ── Sync email to ErpUsers auth record (Issue 12) ──────────────────────
    // If the father_email changed, update the linked ErpUsers.email so login stays valid
    if (data.father_email !== undefined && updated.user_id) {
      const existingUser = await prisma.erpUsers.findUnique({ where: { id: updated.user_id } });
      if (existingUser && existingUser.email !== data.father_email) {
        // Check if the new email is already taken by another user
        const emailConflict = await prisma.erpUsers.findFirst({
          where: { email: data.father_email, id: { not: updated.user_id } },
        });
        if (emailConflict) {
          throw new Error(`Email "${data.father_email}" is already in use by another account.`);
        }
        await prisma.erpUsers.update({
          where: { id: updated.user_id },
          data: { email: data.father_email },
        });
      }
    }

    let student_name = null, reg_no = null;
    if (updated.students_id) {
      const s = await prisma.students.findUnique({
        where: { id: updated.students_id },
        select: { first_name: true, last_name: true, reg_no: true },
      });
      if (s) { student_name = `${s.first_name || ""} ${s.last_name || ""}`.trim(); reg_no = s.reg_no; }
    }

    // Check if has_login
    const hasLogin = updated.user_id != null;
    return { ...updated, has_login: hasLogin, student_name, reg_no };
  }
}
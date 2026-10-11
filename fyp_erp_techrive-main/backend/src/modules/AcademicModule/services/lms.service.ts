import { prisma } from "../../../config/db";

export class LmsService {

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private static async getTeacherCourseIds(user: any): Promise<number[]> {
    const staff_id = user.employee_id || user.id;
    const sessionTeachers = await prisma.activeSessionTeachers.findMany({
      where: { staff_id }
    });
    const ids = new Set<number>();
    for (const st of sessionTeachers) {
      if (st.course_ids) {
        st.course_ids.split(",").forEach((id: string) => ids.add(Number(id)));
      }
    }
    return Array.from(ids);
  }

  private static async checkTeacherAuth(user: any, course_id?: number) {
    if (!user) throw new Error("Unauthorized");
    if (user.user_type === "admin" || user.user_type === "superadmin") return;
    
    if (user.user_type !== "staff") {
      throw new Error("Unauthorized: Only teachers can perform this action.");
    }
    if (course_id) {
      const authorizedIds = await this.getTeacherCourseIds(user);
      if (!authorizedIds.includes(course_id)) {
        throw new Error("Unauthorized: You are not authorized for this course.");
      }
    }
  }

  private static async getStudentCourseIds(user: any): Promise<number[]> {
    const student = await prisma.students.findFirst({ where: { user_id: user.id } });
    if (!student) return [];
    
    const activeSessions = await prisma.activeSessionStudents.findMany({
      where: { student_id: student.id }
    });
    const groupIds = activeSessions.map((a: any) => a.academics_group_id).filter(Boolean) as number[];
    if (student.academic_group_id) groupIds.push(student.academic_group_id);
    
    const groupCourses = await prisma.academicsGroupCourses.findMany({
      where: { academics_group_id: { in: groupIds } }
    });
    
    const courseIds = new Set(groupCourses.map((gc: any) => gc.course_id));

    // Also include enrollments directly linked via student_enrollments
    const enrollmentCourses = await prisma.studentEnrollments.findMany({
      where: { student_id: student.id },
      select: { subject_id: true },
    });
    enrollmentCourses.forEach(e => {
      if (e.subject_id) courseIds.add(e.subject_id);
    });
    
    return [...courseIds];
  }

  // ─── LMS Materials ───────────────────────────────────────────────────────────

  static async uploadMaterial(data: any, user: any) {
    const course_id = data.course_id ? Number(data.course_id) : undefined;
    await this.checkTeacherAuth(user, course_id);

    const type = data.type || data.material_type || "lecture_note";
    const module_id = data.module_id ? Number(data.module_id) : undefined;

    const payload: any = {
      title:            data.title,
      type,
      material_type:    type,
      file_url:         data.file_url || "#",
      file_size:        data.file_size || null,
      description:      data.description || null,
      uploaded_by_name: data.uploaded_by_name || user.name || null,
      institution_type: data.institution_type || "university",
      created_at:       new Date(),
      updated_at:       new Date(),
    };

    if (course_id) payload.course_id = course_id;
    if (module_id) payload.module_id = module_id;

    const created = await prisma.lmsMaterials.create({ data: payload });

    let course_name: string | null = null;
    if (created.course_id) {
      const c = await prisma.courses.findUnique({ where: { id: created.course_id }, select: { name: true, subject_code: true } });
      if (c) course_name = `${c.subject_code || ""} — ${c.name || ""}`.replace(/^—\s*|^\s*—/, "").trim();
    }
    return { ...created, course_name };
  }

  static async updateMaterial(id: number, data: any, user: any) {
    const material = await prisma.lmsMaterials.findUnique({ where: { id } });
    if (!material) throw new Error("Not found");
    if (material.course_id) {
      await this.checkTeacherAuth(user, material.course_id);
    } else {
      await this.checkTeacherAuth(user);
    }
    
    // Inject updated timestamp
    data.updated_at = new Date();
    
    return await prisma.lmsMaterials.update({ where: { id }, data });
  }

  static async deleteMaterial(id: number, user: any) {
    const material = await prisma.lmsMaterials.findUnique({ where: { id } });
    if (!material) throw new Error("Not found");
    if (material.course_id) {
      await this.checkTeacherAuth(user, material.course_id);
    } else {
      await this.checkTeacherAuth(user);
    }
    return await prisma.lmsMaterials.delete({ where: { id } });
  }

  static async getMaterials(institution_type?: string, course_id?: number, user?: any) {
    const where: any = {};
    if (institution_type) where.institution_type = institution_type;
    
    if (user && user.user_type === "student") {
      const studentCourses = await this.getStudentCourseIds(user);
      if (course_id) {
        if (!studentCourses.includes(course_id)) return [];
        where.course_id = course_id;
      } else {
        where.course_id = { in: studentCourses };
      }
    } else if (user && user.user_type === "staff") {
      const teacherCourses = await this.getTeacherCourseIds(user);
      if (course_id) {
        if (!teacherCourses.includes(course_id)) return [];
        where.course_id = course_id;
      } else {
        where.course_id = { in: teacherCourses };
      }
    } else if (course_id) {
       where.course_id = course_id;
    }

    const rows = await prisma.lmsMaterials.findMany({ where, orderBy: { created_at: "desc" } });

    // Batch-load course names
    const courseIds = [...new Set(rows.map((r: any) => r.course_id).filter(Boolean))] as number[];
    const courses   = courseIds.length
      ? await prisma.courses.findMany({ where: { id: { in: courseIds } }, select: { id: true, name: true, subject_code: true } })
      : [];
    const courseMap = Object.fromEntries(courses.map((c: any) => [
      c.id,
      `${c.subject_code || ""} — ${c.name || ""}`.replace(/^—\s*|^\s*—/, "").trim()
    ]));

    return rows.map((r: any) => ({
      ...r,
      course_name: r.course_id ? (courseMap[r.course_id] || null) : null,
    }));
  }

  // ─── LMS Assignments ─────────────────────────────────────────────────────────

  static async createAssignment(data: any, user: any) {
    const course_id = data.course_id ? Number(data.course_id) : undefined;
    await this.checkTeacherAuth(user, course_id);

    const payload: any = {
      title:           data.title,
      description:     data.description     || null,
      instructions:    data.instructions    || null,
      deadline:        data.deadline        ? new Date(data.deadline) : null,
      max_score:       data.max_score       ? Number(data.max_score) : 100,
      submission_type: data.submission_type || "file",
      status:          data.status          || "published",
      institution_type:data.institution_type|| "university",
      created_by:      user.employee_id || user.id,
    };
    if (course_id) payload.course_id = course_id;

    const created = await prisma.lmsAssignments.create({ data: payload });

    let course_name: string | null = null;
    if (created.course_id) {
      const c = await prisma.courses.findUnique({ where: { id: created.course_id }, select: { name: true, subject_code: true } });
      if (c) course_name = `${c.subject_code || ""} — ${c.name || ""}`.replace(/^—\s*|^\s*—/, "").trim();
    }
    return { ...created, course_name };
  }

  static async updateAssignment(id: number, data: any, user: any) {
    const assignment = await prisma.lmsAssignments.findUnique({ where: { id } });
    if (!assignment) throw new Error("Not found");
    if (assignment.course_id) {
      await this.checkTeacherAuth(user, assignment.course_id);
    } else {
      await this.checkTeacherAuth(user);
    }

    const payload: any = {
      title:           data.title,
      description:     data.description     || null,
      instructions:    data.instructions    || null,
      deadline:        data.deadline        ? new Date(data.deadline) : null,
      max_score:       data.max_score       ? Number(data.max_score) : 100,
      submission_type: data.submission_type || "file",
      status:          data.status          || "published",
      institution_type:data.institution_type|| "university",
    };
    if (data.course_id) payload.course_id = Number(data.course_id);

    const updated = await prisma.lmsAssignments.update({ where: { id }, data: payload });

    // Enrich with course_name like getAssignments does
    let course_name: string | null = null;
    if (updated.course_id) {
      const c = await prisma.courses.findUnique({ where: { id: updated.course_id }, select: { name: true, subject_code: true } });
      if (c) course_name = `${c.subject_code || ""} — ${c.name || ""}`.replace(/^—\s*|^\s*—/, "").trim();
    }
    return { ...updated, course_name };
  }

  static async deleteAssignment(id: number, user: any) {
    const assignment = await prisma.lmsAssignments.findUnique({ where: { id } });
    if (!assignment) throw new Error("Not found");
    if (assignment.course_id) {
      await this.checkTeacherAuth(user, assignment.course_id);
    } else {
      await this.checkTeacherAuth(user);
    }
    // Delete dependent submissions first to prevent foreign key constraint errors
    await prisma.lmsAssignmentSubmissions.deleteMany({ where: { assignment_id: id } });
    return await prisma.lmsAssignments.delete({ where: { id } });
  }

  static async getAssignments(institution_type?: string, user?: any) {
    const where: any = {};
    if (institution_type) where.institution_type = institution_type;

    let studentIdForStatus: number | undefined;

    if (user && user.user_type === "student") {
      const studentCourses = await this.getStudentCourseIds(user);
      if (studentCourses.length > 0) {
        where.course_id = { in: studentCourses };
      } else {
        // If student has no courses, return empty array
        return [];
      }
      where.status = "published";
      const student = await prisma.students.findFirst({ where: { user_id: user.id } });
      if (student) studentIdForStatus = student.id;
    } else if (user && user.user_type === "staff") {
      const teacherCourses = await this.getTeacherCourseIds(user);
      if (teacherCourses.length > 0) {
        where.course_id = { in: teacherCourses };
      } else {
        return [];
      }
    }

    const rows = await prisma.lmsAssignments.findMany({ where, orderBy: { created_at: "desc" } });

    // Batch-load course names
    const courseIds = [...new Set(rows.map((r: any) => r.course_id).filter(Boolean))] as number[];
    const courses   = courseIds.length
      ? await prisma.courses.findMany({ where: { id: { in: courseIds } }, select: { id: true, name: true, subject_code: true } })
      : [];
    const courseMap = Object.fromEntries(courses.map((c: any) => [
      c.id,
      `${c.subject_code || ""} — ${c.name || ""}`.replace(/^—\s*|^\s*—/, "").trim()
    ]));

    const assignmentIds = rows.map((r: any) => r.id);
    let subCountMap: Record<number, number> = {};
    let studentSubMap: Record<number, any> = {};

    if (assignmentIds.length) {
      if (user && user.user_type === "staff") {
        const subCounts = await prisma.lmsAssignmentSubmissions.groupBy({
          by: ["assignment_id"],
          where: { assignment_id: { in: assignmentIds } },
          _count: { id: true },
        });
        subCountMap = Object.fromEntries(subCounts.map((s: any) => [s.assignment_id || 0, s._count.id]));
      }

      if (user && user.user_type === "student" && studentIdForStatus) {
        const studentSubs = await prisma.lmsAssignmentSubmissions.findMany({
          where: { assignment_id: { in: assignmentIds }, student_id: studentIdForStatus }
        });
        studentSubMap = Object.fromEntries(studentSubs.map((s: any) => [s.assignment_id, s]));
      }
    }

    return rows.map((r: any) => {
      const res: any = {
        ...r,
        course_name:       r.course_id ? (courseMap[r.course_id] || null) : null,
        due_date:          r.deadline ? r.deadline.toISOString() : null,
      };
      if (user && user.user_type === "staff") {
        res.submissions_count = subCountMap[r.id] || 0;
      }
      if (user && user.user_type === "student") {
        res.student_submission = studentSubMap[r.id] || null;
      }
      return res;
    });
  }

  static async submitAssignment(data: any, user: any) {
    if (!user || user.user_type !== "student") {
      throw new Error("Unauthorized: Only students can submit assignments.");
    }

    const student = await prisma.students.findFirst({ where: { user_id: user.id } });
    if (!student) throw new Error("Student record not found.");
    const student_id = student.id;

    const assignment_id = Number(data.assignment_id || data.assignments_id);
    const assignment = await prisma.lmsAssignments.findUnique({ where: { id: assignment_id } });
    if (!assignment) throw new Error("Assignment not found.");

    if (assignment.course_id) {
      const studentCourses = await this.getStudentCourseIds(user);
      if (!studentCourses.includes(assignment.course_id)) {
        throw new Error("Unauthorized: You are not authorized for this assignment.");
      }
    }

    if (assignment.deadline && new Date() > assignment.deadline) {
      throw new Error("Assignment deadline has passed.");
    }

    if (assignment.submission_type === "file" && !data.file_url) {
      throw new Error("A file submission is required.");
    }
    if (assignment.submission_type === "text" && !data.submission_text) {
      throw new Error("A text submission is required.");
    }
    if (assignment.submission_type === "file+text" && (!data.file_url || !data.submission_text)) {
      throw new Error("Both file and text submissions are required.");
    }

    const existingSubmission = await prisma.lmsAssignmentSubmissions.findFirst({
      where: { assignment_id, student_id }
    });

    const payload = {
      assignment_id,
      student_id,
      submission_text: data.submission_text || null,
      file_url: data.file_url || null,
      submitted_at: new Date(),
      status: "submitted"
    };

    if (existingSubmission) {
      return await prisma.lmsAssignmentSubmissions.update({
        where: { id: existingSubmission.id },
        data: payload
      });
    }

    return await prisma.lmsAssignmentSubmissions.create({ data: payload });
  }

  static async getSubmissions(assignment_id: number, user: any) {
    const assignment = await prisma.lmsAssignments.findUnique({ where: { id: assignment_id } });
    if (!assignment) throw new Error("Not found");
    
    if (user.user_type === "staff") {
      if (assignment.course_id) {
        await this.checkTeacherAuth(user, assignment.course_id);
      } else {
        await this.checkTeacherAuth(user);
      }
    } else if (user.user_type === "student") {
      const student = await prisma.students.findFirst({ where: { user_id: user.id } });
      if (!student) throw new Error("Unauthorized");
      
      return await prisma.lmsAssignmentSubmissions.findMany({
        where: { assignment_id, student_id: student.id },
        orderBy: { submitted_at: "desc" },
      });
    }

    const rows = await prisma.lmsAssignmentSubmissions.findMany({
      where: { assignment_id },
      orderBy: { submitted_at: "desc" },
    });

    const studentIds = [...new Set(rows.map((r: any) => r.student_id).filter(Boolean))] as number[];

    const students = studentIds.length
      ? await prisma.students.findMany({
          where: { id: { in: studentIds } },
          select: { id: true, first_name: true, last_name: true, reg_no: true },
        })
      : [];

    const studentMap: Record<number, string> = Object.fromEntries(students.map((s: any) => [
      s.id,
      `${s.first_name || ""} ${s.last_name || ""}`.trim() || `Reg# ${s.reg_no || s.id}`
    ]));

    const missingIds = studentIds.filter((id) => !studentMap[id]);
    if (missingIds.length) {
      const users = await prisma.erpUsers.findMany({
        where: { id: { in: missingIds } },
        select: { id: true, name: true, email: true },
      });
      users.forEach((u: any) => {
        studentMap[u.id] = u.name || u.email || `User #${u.id}`;
      });
    }

    return rows.map((r: any) => ({
      ...r,
      student_name: r.student_id
        ? (studentMap[r.student_id] || `Student #${r.student_id}`)
        : "Unknown Student",
    }));
  }

  static async gradeSubmission(id: number, grade: number, feedback: string, user: any) {
    const submission = await prisma.lmsAssignmentSubmissions.findUnique({ where: { id } });
    if (!submission) throw new Error("Not found");
    
    const assignment = await prisma.lmsAssignments.findUnique({ where: { id: Number(submission.assignment_id) } });
    if (assignment && assignment.course_id) {
       await this.checkTeacherAuth(user, assignment.course_id);
    } else {
       await this.checkTeacherAuth(user);
    }

    return await prisma.lmsAssignmentSubmissions.update({
      where: { id },
      data: { grade, feedback, status: "graded" },
    });
  }
}
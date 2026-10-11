import { prisma } from "../../../config/db";

export class CourseService {
  static async createCourse(data: any) {
    if (!data.institution_type) throw new Error("institution_type is required");

    const payload: any = {
      name:          data.title || data.name || null,
      subject_code:  data.code  || data.subject_code || null,
      description:   data.description || null,
      lecture_hours: data.lecture_hours != null ? Number(data.lecture_hours) : null,
      lab_hours:     data.lab_hours    != null ? Number(data.lab_hours)    : null,
      credit_hours:  data.credit_hours != null ? Number(data.credit_hours) : null,
      marks:         data.marks        != null ? Number(data.marks)        : null,
      category:      data.category  || null,
      semester:      data.semester_suggested != null ? Number(data.semester_suggested)
                   : data.semester            != null ? Number(data.semester) : null,
      status:           data.status || "Active",
      institution_type: data.institution_type,
      department_id:    data.department_id ? Number(data.department_id) : null,
      level_or_grade:   data.level_or_grade || null,
    };

    if (data.program_id)            payload.program_id            = Number(data.program_id);
    if (data.curriculum_version_id) payload.curriculum_version_id = Number(data.curriculum_version_id);
    if (data.major_id)              payload.major_id              = Number(data.major_id);
    if (data.minor_id)              payload.minor_id              = Number(data.minor_id);
    if (data.class_id)              payload.class_id              = Number(data.class_id);

    // College: store year in `type`, group in `session_details`
    if (data.institution_type === "college") {
      if (data.college_year)  payload.type            = data.college_year;
      if (data.college_group) payload.session_details = data.college_group;
    }

    if (payload.subject_code) {
      const exists = await prisma.courses.findFirst({
        where: { subject_code: payload.subject_code, institution_type: data.institution_type },
      });
      if (exists) throw new Error("Course code already exists in this institution");
    }

    const created = await prisma.courses.create({ data: payload });
    return CourseService._mapOut(created);
  }

  static async getCourses(query: any) {
    const {
      page = 1, limit = 100, search, status,
      institution_type, program_id, department_id,
      school_id, college_id, institute_id,
      category, semester, class_id,
      branch_id,
      sortBy = "id", sortOrder = "asc",
    } = query;

    if (!institution_type) throw new Error("institution_type is required");

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const where: any = { institution_type };

    if (status)        where.status        = status;
    if (program_id)    where.program_id    = Number(program_id);
    if (department_id) where.department_id = Number(department_id);
    if (school_id)     where.school_id     = Number(school_id);
    if (college_id)    where.college_id    = Number(college_id);
    if (institute_id)  where.institute_id  = Number(institute_id);
    if (category)      where.category      = category;
    if (semester)      where.semester      = Number(semester);
    if (class_id)      where.class_id      = Number(class_id);

    // Filter by branch through department → branch_departments junction
    if (branch_id && !department_id) {
      const bds = await prisma.branchDepartments.findMany({ where: { branch_id: Number(branch_id) } });
      const deptIds = bds.map((bd: any) => bd.department_id);
      if (deptIds.length) {
        where.department_id = { in: deptIds };
      } else {
        return { total: 0, page: Number(page), limit: Number(limit), totalPages: 0, data: [] };
      }
    }

    if (search) {
      where.OR = [
        { name:         { contains: search, mode: "insensitive" } },
        { subject_code: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, rows] = await Promise.all([
      prisma.courses.count({ where }),
      prisma.courses.findMany({ where, skip, take, orderBy: { [sortBy]: sortOrder } }),
    ]);

    // Batch-load related names so frontend never shows "—" for known relations
    const progIds = [...new Set(rows.map((r: any) => r.program_id).filter(Boolean))] as number[];
    const progs   = progIds.length ? await prisma.programs.findMany({ where: { id: { in: progIds } } }) : [];
    const progMap = Object.fromEntries(progs.map((p: any) => [p.id, p.name]));

    const cvIds = [...new Set(rows.map((r: any) => r.curriculum_version_id).filter(Boolean))] as number[];
    const cvs   = cvIds.length ? await prisma.curriculumVersions.findMany({ where: { id: { in: cvIds } } }) : [];
    const cvMap = Object.fromEntries(cvs.map((v: any) => [v.id, v.version_number]));

    const deptIds = [...new Set(rows.map((r: any) => r.department_id).filter(Boolean))] as number[];
    const depts   = deptIds.length ? await prisma.departments.findMany({ where: { id: { in: deptIds } } }) : [];
    const deptMap = Object.fromEntries(depts.map((d: any) => [d.id, d.name]));

    return {
      total, page: Number(page), limit: Number(limit),
      totalPages: Math.ceil(total / take),
      data: rows.map((c: any) => ({
        ...CourseService._mapOut(c),
        program_name:       c.program_id            ? (progMap[c.program_id]           || null) : null,
        curriculum_version: c.curriculum_version_id ? (cvMap[c.curriculum_version_id]  || null) : null,
        department_name:    c.department_id         ? (deptMap[c.department_id]         || null) : null,
      })),
    };
  }

  static async getCourseById(id: number) {
    const c = await prisma.courses.findUnique({ where: { id } });
    return c ? CourseService._mapOut(c) : null;
  }

  static async updateCourse(id: number, data: any) {
    const p: any = {};
    if (data.title              !== undefined) p.name                  = data.title;
    if (data.name               !== undefined) p.name                  = data.name;
    if (data.code               !== undefined) p.subject_code          = data.code;
    if (data.subject_code       !== undefined) p.subject_code          = data.subject_code;
    if (data.description        !== undefined) p.description           = data.description;
    if (data.lecture_hours      !== undefined) p.lecture_hours         = Number(data.lecture_hours);
    if (data.lab_hours          !== undefined) p.lab_hours             = Number(data.lab_hours);
    if (data.credit_hours       !== undefined) p.credit_hours          = Number(data.credit_hours);
    if (data.marks              !== undefined) p.marks                 = Number(data.marks);
    if (data.category           !== undefined) p.category              = data.category;
    if (data.semester_suggested !== undefined) p.semester              = Number(data.semester_suggested);
    if (data.semester           !== undefined) p.semester              = data.semester != null ? Number(data.semester) : null;
    if (data.status             !== undefined) p.status                = data.status;
    if (data.program_id         !== undefined) p.program_id            = Number(data.program_id);
    if (data.department_id      !== undefined) p.department_id         = Number(data.department_id);
    if (data.level_or_grade     !== undefined) p.level_or_grade        = data.level_or_grade;
    if (data.curriculum_version_id !== undefined) p.curriculum_version_id = Number(data.curriculum_version_id);
    if (data.institution_type   !== undefined) p.institution_type      = data.institution_type;
    if (data.major_id           !== undefined) p.major_id              = Number(data.major_id);
    if (data.minor_id           !== undefined) p.minor_id              = Number(data.minor_id);
    if (data.class_id           !== undefined) p.class_id              = Number(data.class_id);
    if (data.college_year       !== undefined) p.type                  = data.college_year;
    if (data.college_group      !== undefined) p.session_details       = data.college_group;

    if (p.subject_code) {
      const exists = await prisma.courses.findFirst({
        where: { subject_code: p.subject_code, id: { not: id } },
      });
      if (exists) throw new Error("Course code already exists");
    }

    const updated = await prisma.courses.update({ where: { id }, data: p });
    return CourseService._mapOut(updated);
  }

  static async deleteCourse(id: number) {
    return await prisma.courses.delete({ where: { id } });
  }

  private static _mapOut(c: any) {
    return {
      ...c,
      code:               c.subject_code,
      title:              c.name,
      credit_hours:       c.credit_hours ?? ((c.lecture_hours || 0) + (c.lab_hours || 0)),
      semester_suggested: c.semester,
      college_year:       c.type           || null,
      college_group:      c.session_details === "0" ? null : (c.session_details || null),
    };
  }
}
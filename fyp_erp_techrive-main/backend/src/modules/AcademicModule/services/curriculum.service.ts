import { prisma } from "../../../config/db";

export class CurriculumService {
  static async buildCurriculum(data: any) {
    // All fields now stored directly in DB
    const payload: any = {
      title:           data.title        || null,
      description:     data.description  || null,
      status:          data.status       || "draft",
      institution_type:data.institution_type || "university",
      syllabus_id:     data.syllabus_id  || 1,
      term_id:         data.term_id      || 1,
      created_by:      data.created_by   || 1,
      // new columns
      code:            data.code         || null,
      department_id:   data.department_id  ? Number(data.department_id)  : null,
      program_id:      data.program_id     ? Number(data.program_id)     : null,
      academic_year:   data.academic_year  || null,
      semester:        data.semester       || null,
      total_semesters: data.total_semesters ? Number(data.total_semesters) : null,
      total_credits:   data.total_credits   ? Number(data.total_credits)   : null,
      current_version: data.current_version || "1.0",
      major_id:        data.major_id  ? Number(data.major_id)  : null,
      minor_id:        data.minor_id  ? Number(data.minor_id)  : null,
    };

    const created = await prisma.curriculum.create({ data: payload });
    return CurriculumService._enrich(created);
  }

  static async getCurriculums(institution_type?: string, branch_id?: number) {
    const where: any = {};
    if (institution_type) where.institution_type = institution_type;

    // Filter by branch through department → branch_departments junction
    if (branch_id) {
      const bds = await prisma.branchDepartments.findMany({ where: { branch_id } });
      const deptIds = bds.map((bd: any) => bd.department_id);
      if (deptIds.length) {
        where.department_id = { in: deptIds };
      } else {
        return []; // No departments for this branch
      }
    }

    const rows = await prisma.curriculum.findMany({ where, orderBy: { id: "asc" } });

    // Batch-load department names for rows that have department_id
    const deptIds = [...new Set(rows.map((r: any) => r.department_id).filter(Boolean))] as number[];
    const depts = deptIds.length
      ? await prisma.departments.findMany({ where: { id: { in: deptIds } } })
      : [];
    const deptMap = Object.fromEntries(depts.map((d: any) => [d.id, d.name]));

    // Batch-load program names for rows that have program_id
    const progIds = [...new Set(rows.map((r: any) => r.program_id).filter(Boolean))] as number[];
    const progs = progIds.length
      ? await prisma.programs.findMany({ where: { id: { in: progIds } } })
      : [];
    const progMap = Object.fromEntries(progs.map((p: any) => [p.id, p.name]));

    return rows.map((c: any) => ({
      ...CurriculumService._enrich(c),
      department_name: c.department_id ? (deptMap[c.department_id] || null) : null,
      program_name:    c.program_id    ? (progMap[c.program_id]    || null) : null,
    }));
  }

  static async getCurriculumById(id: number) {
    const c = await prisma.curriculum.findUnique({ where: { id } });
    return c ? CurriculumService._enrich(c) : null;
  }

  static async updateCurriculum(id: number, data: any) {
    const p: any = {};
    if (data.title           !== undefined) p.title           = data.title;
    if (data.description     !== undefined) p.description     = data.description;
    if (data.status          !== undefined) p.status          = data.status;
    if (data.institution_type!== undefined) p.institution_type= data.institution_type;
    if (data.code            !== undefined) p.code            = data.code;
    if (data.department_id   !== undefined) p.department_id   = data.department_id   ? Number(data.department_id)   : null;
    if (data.program_id      !== undefined) p.program_id      = data.program_id      ? Number(data.program_id)      : null;
    if (data.academic_year   !== undefined) p.academic_year   = data.academic_year;
    if (data.semester        !== undefined) p.semester        = data.semester;
    if (data.total_semesters !== undefined) p.total_semesters = data.total_semesters ? Number(data.total_semesters) : null;
    if (data.total_credits   !== undefined) p.total_credits   = data.total_credits   ? Number(data.total_credits)   : null;
    if (data.current_version !== undefined) p.current_version = data.current_version;
    if (data.major_id        !== undefined) p.major_id        = data.major_id        ? Number(data.major_id)        : null;
    if (data.minor_id        !== undefined) p.minor_id        = data.minor_id        ? Number(data.minor_id)        : null;

    const updated = await prisma.curriculum.update({ where: { id }, data: p });

    // Re-fetch names if dept/prog ids present
    let department_name: string | null = data.department_name || null;
    let program_name:    string | null = data.program_name    || null;
    if (updated.department_id && !department_name) {
      const dept = await prisma.departments.findUnique({ where: { id: updated.department_id } });
      department_name = dept ? dept.name : null;
    }
    if ((updated as any).program_id && !program_name) {
      const prog = await prisma.programs.findUnique({ where: { id: (updated as any).program_id } });
      program_name = prog ? prog.name : null;
    }

    return { ...CurriculumService._enrich(updated), department_name, program_name };
  }

  static async deleteCurriculum(id: number) {
    return await prisma.curriculum.delete({ where: { id } });
  }

  // Ensure all frontend-expected fields always present
  private static _enrich(c: any) {
    return {
      ...c,
      code:            c.code            || `CURR-${c.id}`,
      current_version: c.current_version || "1.0",
      total_credits:   c.total_credits   ?? 0,
      total_semesters: c.total_semesters ?? null,
      academic_year:   c.academic_year   || null,
      semester:        c.semester        || null,
      program_id:      c.program_id      || null,
      department_id:   c.department_id   || null,
    };
  }
}
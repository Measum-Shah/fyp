import { prisma } from "../../../config/db";

export class MajorService {
  static async createMajor(data: any) {
    // Only write columns that exist in the majors table
    const payload: any = {
      name: data.name,
      institution_type: data.institution_type || "university",
    };
    if (data.description) payload.description = data.description;
    if (data.department_id) payload.department_id = Number(data.department_id);

    const created = await prisma.majors.create({ data: payload });

    let department_name: string | null = null;
    if (created.department_id) {
      const dept = await prisma.departments.findUnique({ where: { id: created.department_id } });
      department_name = dept ? dept.name : null;
    }
    return { ...created, department_name };
  }

  static async getMajors(institution_type?: string, branch_id?: number) {
    const where: any = {};
    if (institution_type) where.institution_type = institution_type;

    // Filter by branch through department → branch_departments junction
    if (branch_id) {
      const bds = await prisma.branchDepartments.findMany({ where: { branch_id } });
      const deptIds = bds.map((bd: any) => bd.department_id);
      if (deptIds.length) {
        where.department_id = { in: deptIds };
      } else {
        return [];
      }
    }

    const majors = await prisma.majors.findMany({ where, orderBy: { id: "asc" } });

    const deptIds = [...new Set(majors.map((m) => m.department_id).filter(Boolean))] as number[];
    const depts = deptIds.length
      ? await prisma.departments.findMany({ where: { id: { in: deptIds } } })
      : [];
    const deptMap = Object.fromEntries(depts.map((d) => [d.id, d.name]));

    return majors.map((m) => ({
      ...m,
      department_name: m.department_id ? (deptMap[m.department_id] ?? null) : null,
    }));
  }

  static async getMajorById(id: number) {
    const major = await prisma.majors.findUnique({ where: { id } });
    if (!major) return null;
    let department_name: string | null = null;
    if (major.department_id) {
      const dept = await prisma.departments.findUnique({ where: { id: major.department_id } });
      department_name = dept ? dept.name : null;
    }
    return { ...major, department_name };
  }

  static async updateMajor(id: number, data: any) {
    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.department_id !== undefined)
      updatePayload.department_id = data.department_id ? Number(data.department_id) : null;
    if (data.institution_type !== undefined) updatePayload.institution_type = data.institution_type;

    const updated = await prisma.majors.update({ where: { id }, data: updatePayload });

    let department_name: string | null = null;
    if (updated.department_id) {
      const dept = await prisma.departments.findUnique({ where: { id: updated.department_id } });
      department_name = dept ? dept.name : null;
    }
    return { ...updated, department_name };
  }

  static async deleteMajor(id: number) {
    return await prisma.majors.delete({ where: { id } });
  }
}
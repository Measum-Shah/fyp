import { prisma } from "../../../config/db";

export class MinorService {
  static async createMinor(data: any) {
    // Only write columns that exist in the minors table
    const payload: any = {
      name: data.name,
      institution_type: data.institution_type || "university",
    };
    if (data.description) payload.description = data.description;
    if (data.department_id) payload.department_id = Number(data.department_id);

    const created = await prisma.minors.create({ data: payload });

    let department_name: string | null = null;
    if (created.department_id) {
      const dept = await prisma.departments.findUnique({ where: { id: created.department_id } });
      department_name = dept ? dept.name : null;
    }
    return { ...created, department_name };
  }

  static async getMinors(institution_type?: string) {
    const where: any = {};
    if (institution_type) where.institution_type = institution_type;
    const minors = await prisma.minors.findMany({ where, orderBy: { id: "asc" } });

    const deptIds = [...new Set(minors.map((m) => m.department_id).filter(Boolean))] as number[];
    const depts = deptIds.length
      ? await prisma.departments.findMany({ where: { id: { in: deptIds } } })
      : [];
    const deptMap = Object.fromEntries(depts.map((d) => [d.id, d.name]));

    return minors.map((m) => ({
      ...m,
      department_name: m.department_id ? (deptMap[m.department_id] ?? null) : null,
    }));
  }

  static async getMinorById(id: number) {
    const minor = await prisma.minors.findUnique({ where: { id } });
    if (!minor) return null;
    let department_name: string | null = null;
    if (minor.department_id) {
      const dept = await prisma.departments.findUnique({ where: { id: minor.department_id } });
      department_name = dept ? dept.name : null;
    }
    return { ...minor, department_name };
  }

  static async updateMinor(id: number, data: any) {
    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.department_id !== undefined)
      updatePayload.department_id = data.department_id ? Number(data.department_id) : null;
    if (data.institution_type !== undefined) updatePayload.institution_type = data.institution_type;

    const updated = await prisma.minors.update({ where: { id }, data: updatePayload });

    let department_name: string | null = null;
    if (updated.department_id) {
      const dept = await prisma.departments.findUnique({ where: { id: updated.department_id } });
      department_name = dept ? dept.name : null;
    }
    return { ...updated, department_name };
  }

  static async deleteMinor(id: number) {
    return await prisma.minors.delete({ where: { id } });
  }
}